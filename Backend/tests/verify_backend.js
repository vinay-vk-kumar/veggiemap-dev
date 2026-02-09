const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://127.0.0.1:5000/api';
const SOCKET_URL = 'http://127.0.0.1:5000';

const timestamp = Date.now();
const testVendor = {
    vendorName: `Test Vendor ${timestamp}`,
    email: `vendor${timestamp}@test.com`,
    password: 'password123',
    vendorType: 'mobile',
    location: { coordinates: [-74.0060, 40.7128] } // NY coordinates
};
const testConsumer = {
    name: `Test Consumer ${timestamp}`,
    email: `consumer${timestamp}@test.com`,
    password: 'password123'
};

const runTest = async () => {
    console.log('🚀 Starting Backend Verification Test...');
    let vendorToken, consumerToken, vendorId;

    try {
        // 1. Register Vendor
        console.log('\n1️⃣  Registering Vendor...');
        const vendorRes = await axios.post(`${API_URL}/auth/vendor/register`, testVendor);
        if (vendorRes.status === 201) {
            console.log('✅ Vendor Registered:', vendorRes.data.vendorName);
            vendorToken = vendorRes.data.token;
            // Use the exposed userId which matches the socket event ID
            vendorId = vendorRes.data.userId;
        }

        // 2. Register Consumer
        console.log('\n2️⃣  Registering Consumer...');
        const consumerRes = await axios.post(`${API_URL}/auth/consumer/register`, testConsumer);
        if (consumerRes.status === 201) {
            console.log('✅ Consumer Registered:', consumerRes.data.name);
            consumerToken = consumerRes.data.token;
        }

        // 3. Connect Sockets
        console.log('\n3️⃣  Connecting Sockets...');

        // Consumer Socket
        const consumerSocket = io(SOCKET_URL);

        consumerSocket.on('connect', () => {
            console.log('✅ Consumer Socket Connected');
            // Auth Consumer
            consumerSocket.emit('auth', consumerToken);
        });

        consumerSocket.on('auth:success', () => {
            console.log('✅ Consumer Authenticated');
            // Join Room
            const roomData = { lat: 40.7128, lng: -74.0060 }; // Same area as vendor
            consumerSocket.emit('consumer:join-room', roomData);
        });

        // Listen for vendor updates
        const updatePromise = new Promise((resolve, reject) => {
            consumerSocket.on('vendor:location-move', (data) => {
                console.log('✅ RECEIVED LOCATION UPDATE in Consumer:', data);
                console.log(`🔎 Comparing IDs: Received "${data.vendorId}" vs Expected "${vendorId}"`);
                if (data.vendorId === vendorId) {
                    resolve();
                } else {
                    console.log('⚠️ ID Mismatch!');
                }
            });
            setTimeout(() => reject(new Error('Timeout waiting for location update')), 5000);
        });

        // Vendor Socket
        const vendorSocket = io(SOCKET_URL);

        vendorSocket.on('connect', () => {
            console.log('✅ Vendor Socket Connected');
            // Auth Vendor
            vendorSocket.emit('auth', vendorToken);
        });

        vendorSocket.on('auth:success', () => {
            console.log('✅ Vendor Authenticated');
            // 4. Emit Location Update
            console.log('\n4️⃣  Sending Vendor Location Update...');
            // Slight move
            vendorSocket.emit('vendor:location-update', { lat: 40.7129, lng: -74.0061 });
        });

        await updatePromise;
        console.log('\n🎉 TEST PASSED! Real-time tracking is working.');

        // Cleanup
        vendorSocket.disconnect();
        consumerSocket.disconnect();

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
};

runTest();
