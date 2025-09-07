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
    }
  });

  // Share session middleware with Socket.IO
  io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    // Register all socket event handlers
    roomHandlers.register(socket, io);
    gameHandlers.register(socket, io);
    teacherHandlers.register(socket, io);

    // Disconnect handler
    socket.on("disconnect", () => {
      console.log("🔌 User disconnected:", socket.id);
      
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
