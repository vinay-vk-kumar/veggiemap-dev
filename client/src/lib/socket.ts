import { io, Socket } from "socket.io-client";

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
        socket.connect();
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
