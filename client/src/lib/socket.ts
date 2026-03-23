import { io, Socket } from "socket.io-client";

// Define the socket URL — in prod this is the same domain (nginx proxies /socket.io → backend)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false, // We'll connect manually when the user is authenticated
            transports: ["websocket"],
        });
    }
    return socket;
};

export const connectSocket = (token: string) => {
    const socket = getSocket();

    if (!socket.connected) {
        // Pass the token for authentication (the backend is expecting it in the 'auth' event, 
        // but standard practice is often handshake auth. Based on server.js, 
        // it seems the backend listens for a custom 'auth' event AFTER connection)
        socket.connect();

        // Custom auth flow per server.js
        socket.emit("auth", token);
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
