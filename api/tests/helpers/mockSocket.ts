import { TypedSocket, TypedServer } from '../../src/types/socket';

/**
 * Create a mock Socket.IO Socket object for testing
 */
export const mockSocket = (options: {
  id?: string;
  rooms?: Set<string>;
  handshake?: any;
  request?: any;
} = {}): Partial<TypedSocket> => {
  const socket: any = {
    id: options.id || 'test-socket-id',
    rooms: options.rooms || new Set(['test-socket-id']),
    handshake: options.handshake || {
      address: '127.0.0.1',
      headers: {},
    },
    request: options.request || {
      session: {},
    },
    listeners: new Map<string, Function[]>(),
  };

  socket.on = jest.fn((event: string, handler: Function) => {
    if (!socket.listeners.has(event)) {
      socket.listeners.set(event, []);
    }
    socket.listeners.get(event)!.push(handler);
    return socket;
  });

  socket.emit = jest.fn((event: string, ...args: any[]) => {
    return true;
  });

  socket.join = jest.fn((room: string | string[]) => {
    if (Array.isArray(room)) {
      room.forEach(r => socket.rooms.add(r));
    } else {
      socket.rooms.add(room);
    }
    return Promise.resolve();
  });

  socket.leave = jest.fn((room: string) => {
    socket.rooms.delete(room);
    return socket;
  });

  socket.to = jest.fn((room: string) => {
    return {
      emit: jest.fn((event: string, ...args: any[]) => {
        return true;
      }),
    };
  });

  socket.disconnect = jest.fn((close?: boolean) => {
    return socket;
  });

  // Helper to trigger events for testing
  socket.triggerEvent = (event: string, ...args: any[]) => {
    const handlers = socket.listeners.get(event) || [];
    handlers.forEach((handler: Function) => handler(...args));
  };

  return socket as Partial<TypedSocket>;
};

/**
 * Create a mock Socket.IO Server object for testing
 */
export const mockServer = (): Partial<TypedServer> => {
  const server: any = {
    sockets: {
      sockets: new Map(),
    },
    rooms: new Map<string, Set<string>>(),
  };

  server.on = jest.fn((event: string, handler: Function) => {
    return server;
  });

  server.emit = jest.fn((event: string, ...args: any[]) => {
    return true;
  });

  server.to = jest.fn((room: string | string[]) => {
    return {
      emit: jest.fn((event: string, ...args: any[]) => {
        return true;
      }),
      to: jest.fn((room: string) => {
        return {
          emit: jest.fn((event: string, ...args: any[]) => {
            return true;
          }),
        };
      }),
    };
  });

  server.in = jest.fn((room: string) => {
    return server.to(room);
  });

  server.socketsJoin = jest.fn((rooms: string | string[]) => {
    return Promise.resolve();
  });

  server.socketsLeave = jest.fn((rooms: string | string[]) => {
    return Promise.resolve();
  });

  server.disconnectSockets = jest.fn((close?: boolean) => {
    return server;
  });

  return server as Partial<TypedServer>;
};

/**
 * Create a mock teacher socket (with session)
 */
export const mockTeacherSocket = (options: {
  id?: string;
  teacherId?: string;
} = {}): Partial<TypedSocket> => {
  return mockSocket({
    ...options,
    request: {
      session: {
        isTeacher: true,
        teacherId: options.teacherId || 'teacher-123',
      },
    },
  });
};

/**
 * Create a mock student socket
 */
export const mockStudentSocket = (options: {
  id?: string;
  studentId?: string;
  playerName?: string;
} = {}): Partial<TypedSocket> => {
  return mockSocket({
    ...options,
    request: {
      session: {
        isTeacher: false,
        studentId: options.studentId || 'student-123',
        playerName: options.playerName || 'Test Student',
      },
    },
  });
};
