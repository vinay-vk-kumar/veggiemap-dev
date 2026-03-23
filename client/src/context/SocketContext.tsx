"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    isAuthenticated: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
    const { token, user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Only connect if we have a token (user is logged in) - OR if we are a consumer (maybe anonymous?)
        // The backend requires 'auth' event with token for vendors. Consumers might need it too or be anonymous. 
        // Based on server.js: Consumers join rooms but might not HAVE to be auth'd to just listen? 
        // Wait, server.js says: socket.on('auth', ...) checks if user is Vendor or Consumer.
        // So Consumers DO need to authenticate to be identified.

        if (token && user) {
            const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
            const newSocket = io(SOCKET_URL, {
                autoConnect: true,
                transports: ["websocket"],
            });

            newSocket.on("connect", () => {
                console.log("Socket connected:", newSocket.id);
                // Authenticate immediately upon connection
                newSocket.emit("auth", token);
                setIsConnected(true);
            });

            newSocket.on("disconnect", () => {
                console.log("Socket disconnected");
                setIsConnected(false);
                setIsAuthenticated(false);
            });

            newSocket.on("auth:success", (data) => {
                console.log("Socket authenticated:", data);
                setIsAuthenticated(true);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            // Cleanup if logged out
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
                setIsAuthenticated(false);
            }
        }
    }, [token, user?._id]); // Re-run only if token or user ID changes (not other user props)

    return (
        <SocketContext.Provider value={{ socket, isConnected, isAuthenticated }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
}
