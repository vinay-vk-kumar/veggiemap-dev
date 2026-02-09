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

// Use CORS middleware for API requests
app.use(cors({
    origin: '*', // Adjust this for production security
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
        origin: "*", // Allow all origins for the college project testing
        methods: ["GET", "POST"]
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
            // 2. Update DB location
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

    // --- DISCONNECT HANDLER (Step 21 - UNCHANGED) ---
    socket.on('disconnect', async () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);

        if (activeClients[socket.id]) {
            const client = activeClients[socket.id];

            // If the disconnected client was a vendor, mark them offline in the DB
            if (client.role === 'vendor') {
                console.log(`[Socket Disconnect] Marking Vendor ${client.userId} as OFFLINE in DB.`);
                await Vendor.findOneAndUpdate(
                    { userId: client.userId },
                    { isOnline: false }
                );

                const isStatic = client.vendorType === 'static';

                if (isStatic) {
                    // STATIC: Just mark as offline (Closed), don't remove from map
                    console.log(`[Vendor Offline] Static Vendor ${client.userId} set to offline.`);

                    // --- SYNC SEARCH TAG ---
                    try {
                        const SearchTag = require('./models/SearchTag');
                        await SearchTag.updateMany(
                            { userId: client.userId },
                            { $set: { isOnline: false } }
                        );
                    } catch (err) {
                        console.error("Error syncing SearchTag on disconnect:", err);
                    }

                    // Broadcast status update
                    io.emit('vendor:status-update', {
                        vendorId: client.userId,
                        isOnline: false
                    });
                } else {
                    // MOBILE: Remove from map as they might stop tracking
                    console.log(`[Vendor Offline] Mobile Vendor ${client.userId} removed.`);
                    // Broadcast removal
                    if (socket.currentRoom) {
                        io.to(socket.currentRoom).emit('vendor:removed', { vendorId: client.userId });
                    } else {
                        // Fallback if no room tracking (or just broadcast global for now)
                        io.emit('vendor:removed', { vendorId: client.userId });
                    }
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

// require('./routes/consumerRoutes')(app); // Next steps


// --- 4. Start Server ---
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});