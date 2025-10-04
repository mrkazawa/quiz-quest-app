import * as AppModule from "./app";
import logger from "./utils/logger";

// Initialize the application
const App = AppModule.default;
const app = new App();
const server = app.getServer();
const io = app.getIO();

// Start the server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`📝 Log Level: ${logger.getLevel()}`);
  logger.debug(`🌐 CORS origins configured`);
  logger.debug(`📁 Static files served from client/dist`);
});

// Graceful shutdown handling
function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);

  // Close Socket.IO server first
  if (io) {
    io.close(() => {
      logger.debug("Socket.IO server closed");
    });
  }

  // Then close HTTP server
  server.close((err) => {
    if (err) {
      logger.error("Error during server shutdown:", err);
      process.exit(1);
    }
    logger.info("HTTP server closed");
    logger.info("Process terminated");
    process.exit(0);
  });

  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default server;
