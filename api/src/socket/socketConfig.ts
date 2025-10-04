import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import corsConfig from '../config/cors';
import { TypedServer, TypedSocket } from '../types/socket';

// Import socket handlers
import * as roomHandlersModule from './handlers/roomHandlers';
import * as gameHandlersModule from './handlers/gameHandlers';
import * as teacherHandlersModule from './handlers/teacherHandlers';

const roomHandlers = roomHandlersModule.default;
const gameHandlers = gameHandlersModule.default;
const teacherHandlers = teacherHandlersModule.default;

function initializeSocket(server: HttpServer, sessionMiddleware: any): TypedServer {
  const io = new SocketIOServer(server, {
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
  }) as TypedServer;

  // Share session middleware with Socket.IO
  io.use((socket: TypedSocket, next) => {
    sessionMiddleware(socket.request, (socket.request as any).res || {}, next);
  });

  // Note: IP-based rate limiting removed for classroom use
  // In classroom environments, all students connect from the same IP (school router)
  // Room codes and teacher authentication provide sufficient access control
  // If abuse becomes an issue, implement per-room connection limits instead

  // Connection handler
  io.on('connection', (socket: TypedSocket) => {
    console.log(`🔌 User connected: ${socket.id} from ${socket.handshake.address}`);

    // Register all socket event handlers
    roomHandlers.register(socket, io);
    gameHandlers.register(socket, io);
    teacherHandlers.register(socket, io);

    // Error handling
    socket.on('error', (error: Error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });

    // Disconnect handler
    socket.on('disconnect', (reason: string) => {
      console.log(`🔌 User disconnected: ${socket.id} (${reason})`);
      
      // Handle cleanup in respective handlers
      roomHandlers.handleDisconnect(socket, io);
      teacherHandlers.handleDisconnect(socket, io);
    });
  });

  return io;
}

export default {
  initialize: initializeSocket
};
