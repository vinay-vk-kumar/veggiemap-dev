const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Load environment variables from .env file
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
const server = http.createServer(app);

// Allowed origins — production domain + localhost for dev/testing
const ALLOWED_ORIGINS = [
    'https://veggiemap.codewithvin.app',
    'http://localhost:3000',
    'http://localhost:5000',
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));
app.use(express.json()); // Body parser middleware

// Serve static files from the 'uploads' directory
const path = require('path');
app.use('/uploads', (req, res, next) => {
    console.log(`[Static Serve] Request for: ${req.url}`);
    next();
}, express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// --- 1. MongoDB Connection ---
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected successfully.');

        // --- Geospatial Index Verification ---
        // After successful connection, verify or create the 2dsphere index
        const Vendor = require('./models/Vendor');
        await Vendor.ensureIndexes();
        console.log('✅ Vendor indexes (including 2dsphere) ensured.');

    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        // Exit process if connection fails
        process.exit(1);
    }
};
connectDB();

// Load models
const Vendor = require('./models/Vendor');
const Consumer = require('./models/Consumer');

// --- 2. Socket.io Initialization ---
const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true,
    }
});

// Store connected clients and vendors (in a real app, this should be Redis or a database)
// Map of active clients (UNCHANGED)
const activeClients = {};

/**
 * Generates a simplified room name based on coordinates for geo-fencing.
 * Truncating coordinates limits the number of rooms needed.
 * E.g., (40.7128, -74.0059) -> 'geo-40--74'
 */
const getGeoRoomName = (lat, lng) => {
    return `geo-${Math.trunc(lat)}-${Math.trunc(lng)}`;
};

io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // --- SOCKET AUTHENTICATION HANDLER ---
    socket.on('auth', async (token) => {
        try {
            if (!token) throw new Error('No token provided.');

            const decoded = jwt.verify(token, JWT_SECRET);
            const userId = new mongoose.Types.ObjectId(decoded.id);

            // Check if client is a Vendor or Consumer
            const vendor = await Vendor.findOne({ userId });
            const consumer = await Consumer.findOne({ userId });

            if (vendor) {
                // Vendor Client
                const role = 'vendor';

                // Store active vendor socket information
                activeClients[socket.id] = {
                    userId,
                    role: 'vendor',
                    vendorType: vendor.vendorType, // Store type for disconnect logic
                    socket
                };

                // Associate the vendor's userId with the socket for easy lookup
                socket.userId = userId;

                console.log(`[Socket Auth] Vendor ${vendor.vendorName} authenticated.`);
                socket.emit('auth:success', { role: 'vendor' });

            } else if (consumer) {
                // Consumer Client
                const role = 'consumer';

                activeClients[socket.id] = { userId, role, socket };
                socket.userId = userId;

                console.log(`[Socket Auth] Consumer ${consumer.name} authenticated.`);
                socket.emit('auth:success', { role: 'consumer' });

                // Consumers immediately join a geo-room based on their location (handled in a later event)

            } else {
                throw new Error('User not found in DB.');
            }

        } catch (error) {
            console.error(`[Socket Auth Error] Client ${socket.id}: ${error.message}`);
            socket.emit('auth:failure', { message: 'Authentication failed.' });
            socket.disconnect(true);
        }
    });

    // --- CONSUMER LOCATION HANDLER (For joining the correct room) ---
    // Consumers send their map center location to join the correct room.
    socket.on('consumer:join-room', (data) => {
        const { lat, lng, previousRoom } = data;
        const newRoom = getGeoRoomName(lat, lng);

        // Leave the old room if the consumer has moved significantly
        if (previousRoom && previousRoom !== newRoom) {
            socket.leave(previousRoom);
            console.log(`[Consumer Room] ${socket.id} left room ${previousRoom}`);
        }

        socket.join(newRoom);
        console.log(`[Consumer Room] ${socket.id} joined room ${newRoom}`);
        socket.currentRoom = newRoom; // Store current room on socket object
    });


    // --- MOBILE VENDOR LOCATION UPDATE HANDLER ---
    // Mobile vendors push their location frequently.
    socket.on('vendor:location-update', async (data) => {
        const { lat, lng } = data;

        // 1. Basic validation and client check
        if (!socket.userId || activeClients[socket.id]?.role !== 'vendor') return;
        if (!lat || !lng) return;

        const vendorId = socket.userId;
        const coordinates = [parseFloat(lng), parseFloat(lat)]; // [lng, lat] for GeoJSON

        try {
            const client = activeClients[socket.id];
            const now = Date.now();

            // 2. Update DB location (Debounced: only write to DB every 30s max to prevent DB crashing)
            if (!client.lastDbUpdate || now - client.lastDbUpdate > 30000) {
                await Vendor.findOneAndUpdate(
                    { userId: vendorId, vendorType: 'mobile' },
                    {
                        isOnline: true,
                        location: {
                            type: 'Point',
                            coordinates: coordinates
                        }
                    }
                );

                // Keep Search Tags in sync with the location occasionally
                try {
                    const SearchTag = require('./models/SearchTag');
                    await SearchTag.updateMany(
                        { userId: vendorId },
                        { $set: { location: { type: 'Point', coordinates: coordinates }, isOnline: true } }
                    );
                } catch (err) {
                    console.error("Error updating SearchTag location:", err.message);
                }

                client.lastDbUpdate = now;
            }

            // 3. Determine the current geo-room for broadcasting
            const roomName = getGeoRoomName(lat, lng);

            // 4. Broadcast the update to the relevant consumer room
            const updatePayload = {
                vendorId: vendorId,
                location: { lat, lng }, // Send back in the more standard [lat, lng] format for frontend
                coordinates: coordinates // [lng, lat] if needed for processing
            };

            // Emit the live update to all consumers in the vendor's current area
            io.to(roomName).emit('vendor:location-move', updatePayload);

            console.log(`[Live Update] Vendor ${vendorId} updated location to room ${roomName}`);

        } catch (error) {
            console.error(`[Vendor Update Error] ${vendorId}: ${error.message}`);
        }
    });

    // --- NEW: Toggle Online Status (For Static Vendors) ---
    socket.on('vendor:online', async () => {
        if (!socket.userId || activeClients[socket.id]?.role !== 'vendor') return;

        try {
            await Vendor.findOneAndUpdate(
                { userId: socket.userId },
                { isOnline: true }
            );

            // Broadcast status update
            // Ideally we'd broadcast to relevant rooms, but for status we might need a global or wide broadcast
            // For now, emit to all (or just let consumers pull it on refresh/search)
            // But real-time status is nice.
            io.emit('vendor:status-update', {
                vendorId: socket.userId,
                isOnline: true
            });
            console.log(`[Vendor Online] Vendor ${socket.userId} set to online.`);

        } catch (error) {
            console.error('Online Toggle Error:', error);
        }
    });

    // --- DISCONNECT HANDLER ---
    socket.on('disconnect', async () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);

        if (activeClients[socket.id]) {
            const client = activeClients[socket.id];

            if (client.role === 'vendor') {
                const isStatic = client.vendorType === 'static';

                if (isStatic) {
                    // STATIC vendors: HTTP PATCH /toggle-online is the source of truth.
                    // Do NOT reset isOnline on socket disconnect — they may have toggled
                    // online via the dashboard and their socket disconnecting is unrelated.
                    console.log(`[Socket Disconnect] Static Vendor ${client.userId} disconnected — keeping DB isOnline as-is.`);

                    // Broadcast current DB status so consumers stay in sync
                    try {
                        const v = await Vendor.findOne({ userId: client.userId }).select('isOnline');
                        io.emit('vendor:status-update', {
                            vendorId: client.userId,
                            isOnline: v ? v.isOnline : false
                        });
                    } catch (err) {
                        console.error('Error broadcasting static vendor disconnect status:', err);
                    }
                } else {
                    // MOBILE vendors: GPS tracking stops on disconnect → mark offline
                    console.log(`[Socket Disconnect] Mobile Vendor ${client.userId} disconnected — marking OFFLINE.`);
                    await Vendor.findOneAndUpdate(
                        { userId: client.userId },
                        { isOnline: false }
                    );

                    // Sync SearchTags
                    try {
                        const SearchTag = require('./models/SearchTag');
                        await SearchTag.updateMany(
                            { userId: client.userId },
                            { $set: { isOnline: false } }
                        );
                    } catch (err) {
                        console.error('Error syncing SearchTag on mobile disconnect:', err);
                    }

                    // Broadcast removal
                    io.emit('vendor:removed', { vendorId: client.userId });
                    io.emit('vendor:status-update', {
                        vendorId: client.userId,
                        isOnline: false
                    });
                }
            }

            delete activeClients[socket.id];
        }
    });
});
// Attach the Socket.io instance to the app for use in REST routes (Phase 3.3)
app.set('socketio', io);


// --- 3. Route Handlers ---
app.get('/', (req, res) => {
    res.send('VeggieMap Backend API is running.');
});

// Import and use the authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Import and use the vendor routes
const vendorRoutes = require('./routes/vendorRoutes');
app.use('/api/vendor', vendorRoutes);

// NEW: Settings Routes
const vendorSettingsRoutes = require('./routes/vendorSettingsRoutes');
app.use('/api/vendor/settings', vendorSettingsRoutes);

const consumerRoutes = require('./routes/consumerRoutes');
app.use('/api/consumer', consumerRoutes)

// Upload Routes
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);

// Bug Report Routes
const bugRoutes = require('./routes/bugRoutes');
app.use('/api/bugs', bugRoutes);

// require('./routes/consumerRoutes')(app); // Next steps


// --- 4. Start Server ---
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});