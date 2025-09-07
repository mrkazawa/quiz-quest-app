const socketIO = require("socket.io");
const corsConfig = require("../config/cors");

// Import socket handlers
const roomHandlers = require("./handlers/roomHandlers");
const gameHandlers = require("./handlers/gameHandlers");
const teacherHandlers = require("./handlers/teacherHandlers");

function initializeSocket(server, sessionMiddleware) {
  const io = socketIO(server, {
    cors: {
      origin: corsConfig.origin,
      methods: corsConfig.methods,
      credentials: corsConfig.credentials,
      allowedHeaders: corsConfig.allowedHeaders
    },
    // Performance optimizations
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6, // 1MB limit
    allowRequest: (req, callback) => {
      // Add rate limiting for socket connections if needed
      callback(null, true);
    }
  });

  // Share session middleware with Socket.IO
  io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
  });

  // Connection rate limiting
  const connectionCounts = new Map();
  
  io.use((socket, next) => {
    const ip = socket.handshake.address;
    const count = connectionCounts.get(ip) || 0;
    
    if (count > 10) { // Max 10 connections per IP
      return next(new Error('Too many connections from this IP'));
    }
    
    connectionCounts.set(ip, count + 1);
    
    // Clean up after disconnect
    socket.on('disconnect', () => {
      const newCount = connectionCounts.get(ip) - 1;
      if (newCount <= 0) {
        connectionCounts.delete(ip);
      } else {
        connectionCounts.set(ip, newCount);
      }
    });
    
    next();
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id} from ${socket.handshake.address}`);

    // Register all socket event handlers
    roomHandlers.register(socket, io);
    gameHandlers.register(socket, io);
    teacherHandlers.register(socket, io);

    // Error handling
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });

    // Disconnect handler
    socket.on("disconnect", (reason) => {
      console.log(`🔌 User disconnected: ${socket.id} (${reason})`);
      
      // Handle cleanup in respective handlers
      roomHandlers.handleDisconnect(socket, io);
      teacherHandlers.handleDisconnect(socket, io);
    });
  });

  return io;
}

module.exports = {
  initialize: initializeSocket
};

module.exports = {
  initialize: initializeSocket
};
