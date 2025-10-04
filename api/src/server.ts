import * as AppModule from "./app";

// Initialize the application
const App = AppModule.default;
const app = new App();
const server = app.getServer();
const io = app.getIO();

// Start the server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 CORS origins configured`);
  console.log(`📁 Static files served from client/dist`);
});

// Graceful shutdown handling
function gracefulShutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully`);

  // Close Socket.IO server first
  if (io) {
    io.close(() => {
      console.log("Socket.IO server closed");
    });
  }

  // Then close HTTP server
  server.close((err) => {
    if (err) {
      console.error("Error during server shutdown:", err);
      process.exit(1);
    }
    console.log("HTTP server closed");
    console.log("Process terminated");
    process.exit(0);
  });

  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default server;
