import React, { createContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../types/socket.ts";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextType {
  socket: TypedSocket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socket = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Determine the server URL dynamically
    const getServerUrl = () => {
      // If in development and accessing via localhost, use localhost:3000
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        return "http://localhost:3000";
      }
      // Otherwise, use the same origin (works for Serveo and production)
      return window.location.origin;
    };

    const serverUrl = getServerUrl();
    console.log("Connecting socket to:", serverUrl);

    // Initialize socket connection to the API server
    socket.current = io(serverUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    }) as TypedSocket;

    socket.current.on("connect", () => {
      console.log("Socket connected:", socket.current?.id);
      console.log(
        "Socket transport:",
        socket.current?.io.engine.transport.name
      );
      setIsConnected(true);
    });

    socket.current.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socket.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
