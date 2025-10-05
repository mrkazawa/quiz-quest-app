# Custom Hooks

Custom React hooks provide reusable logic for accessing context and managing state across the application.

---

## 🎯 Purpose

Custom hooks are responsible for:
- ✅ Encapsulating reusable logic
- ✅ Accessing React context
- ✅ Managing side effects
- ✅ Providing clean APIs for components
- ❌ **NOT** direct DOM manipulation
- ❌ **NOT** component rendering

---

## 📁 File Structure

```
hooks/
├── useSocket.ts    # Access Socket.IO connection
└── useAuth.ts      # Access authentication state
```

---

## 🔌 useSocket Hook

Provides access to Socket.IO connection and connection status.

### Usage

```typescript
import { useSocket } from '../hooks/useSocket';

const MyComponent = () => {
  const { socket, isConnected } = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    // Listen for events
    socket.on('event_name', (data) => {
      console.log('Received:', data);
    });
    
    // Cleanup
    return () => {
      socket.off('event_name');
    };
  }, [socket]);
  
  const handleAction = () => {
    if (socket && isConnected) {
      socket.emit('action', { data: 'value' });
    }
  };
  
  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
};
```

### Return Values

```typescript
interface SocketContextType {
  socket: TypedSocket | null;   // Socket.IO instance (null until connected)
  isConnected: boolean;          // Connection status
}
```

### Implementation

```typescript
import { useContext } from 'react';
import SocketContext from '../context/SocketContext';

export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
};
```

### Socket Context Provider

The `SocketProvider` must wrap your app to provide socket access:

```typescript
// In App.tsx or main.tsx
<SocketProvider>
  <YourApp />
</SocketProvider>
```

**What SocketProvider Does:**

1. **Establishes Connection**
```typescript
const serverUrl = getServerUrl(); // localhost:3000 or current origin
socket.current = io(serverUrl, {
  withCredentials: true,
  transports: ['websocket', 'polling']
});
```

2. **Manages Connection State**
```typescript
socket.on('connect', () => setIsConnected(true));
socket.on('disconnect', () => setIsConnected(false));
socket.on('connect_error', (error) => console.error(error));
```

3. **Automatic Server URL Detection**
```typescript
const getServerUrl = () => {
  // Development: Use localhost:3000
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // Production: Use same origin (works with Serveo, Docker, etc.)
  return window.location.origin;
};
```

4. **Cleanup on Unmount**
```typescript
return () => {
  if (socket.current) {
    socket.current.disconnect();
  }
};
```

### Common Patterns

#### Listening to Events

```typescript
useEffect(() => {
  if (!socket) return;
  
  const handleEvent = (data: EventData) => {
    // Handle event
  };
  
  socket.on('event_name', handleEvent);
  
  // Cleanup: Remove listener
  return () => {
    socket.off('event_name', handleEvent);
  };
}, [socket]);
```

#### Emitting Events

```typescript
const handleAction = () => {
  if (!socket || !isConnected) {
    console.warn('Socket not connected');
    return;
  }
  
  socket.emit('action_name', { 
    field1: value1,
    field2: value2
  });
};
```

#### Conditional Rendering Based on Connection

```typescript
if (!isConnected) {
  return <div>Connecting to server...</div>;
}

return <div>Ready to play!</div>;
```

---

## 🔐 useAuth Hook

Provides access to authentication state and methods.

### Usage

```typescript
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { isAuthenticated, teacherId, login, logout } = useAuth();
  
  const handleLogin = async () => {
    await login('teacher-123');
    navigate('/dashboard');
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, Teacher {teacherId}</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
};
```

### Return Values

```typescript
interface AuthContextType {
  isAuthenticated: boolean;                 // Auth status
  teacherId: string | null;                 // Teacher ID (null if not logged in)
  login: (teacherId: string) => void;       // Login method
  logout: () => void;                       // Logout method
  checkAuthStatus: () => boolean;           // Check current auth status
}
```

### Implementation

```typescript
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
```

### Auth Context Provider

The `AuthProvider` must wrap your app to provide auth access:

```typescript
// In App.tsx or main.tsx
<AuthProvider>
  <YourApp />
</AuthProvider>
```

**What AuthProvider Does:**

1. **Initializes from localStorage**
```typescript
const [isAuthenticated, setIsAuthenticated] = useState(() => {
  const storedAuth = localStorage.getItem('isTeacher');
  const storedTeacherId = localStorage.getItem('teacherId');
  return storedAuth === 'true' && !!storedTeacherId;
});
```

2. **Provides Login Method**
```typescript
const login = (newTeacherId: string) => {
  // Save to localStorage
  localStorage.setItem('isTeacher', 'true');
  localStorage.setItem('teacherId', newTeacherId);
  
  // Update state
  setIsAuthenticated(true);
  setTeacherId(newTeacherId);
};
```

3. **Provides Logout Method**
```typescript
const logout = () => {
  // Clear localStorage
  localStorage.removeItem('isTeacher');
  localStorage.removeItem('teacherId');
  
  // Update state
  setIsAuthenticated(false);
  setTeacherId(null);
  
  // Logout from server session
  fetch('/api/logout', { method: 'GET' }).catch(console.error);
};
```

4. **Checks Auth on Mount**
```typescript
useEffect(() => {
  checkAuthStatus();
}, []);

const checkAuthStatus = (): boolean => {
  const storedAuth = localStorage.getItem('isTeacher');
  const storedTeacherId = localStorage.getItem('teacherId');
  
  if (storedAuth === 'true' && storedTeacherId) {
    setIsAuthenticated(true);
    setTeacherId(storedTeacherId);
    return true;
  }
  
  return false;
};
```

### Common Patterns

#### Protected Content

```typescript
const { isAuthenticated } = useAuth();

if (!isAuthenticated) {
  return <Navigate to="/" replace />;
}

return <TeacherDashboard />;
```

#### Conditional Navigation

```typescript
const { isAuthenticated } = useAuth();
const navigate = useNavigate();

useEffect(() => {
  if (!isAuthenticated) {
    navigate('/');
  }
}, [isAuthenticated, navigate]);
```

#### Login Flow

```typescript
const { login } = useAuth();

const handleLogin = async (password: string) => {
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      login(data.teacherId || 'teacher');
      navigate('/teacher/dashboard');
    } else {
      setError('Incorrect password');
    }
  } catch (err) {
    setError('Login failed');
  }
};
```

---

## 🏗️ Creating Custom Hooks

### Hook Pattern

```typescript
import { useState, useEffect } from 'react';

interface HookOptions {
  option1: string;
  option2?: number;
}

export const useCustomHook = (options: HookOptions) => {
  const [state, setState] = useState<StateType>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Side effects
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchSomething(options.option1);
        setState(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Cleanup
    return () => {
      // Cleanup logic
    };
  }, [options.option1]);
  
  const doSomething = (param: string) => {
    // Custom method
  };
  
  return {
    state,
    loading,
    error,
    doSomething
  };
};
```

### Usage

```typescript
const MyComponent = () => {
  const { state, loading, error, doSomething } = useCustomHook({
    option1: 'value',
    option2: 123
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <p>{state}</p>
      <button onClick={() => doSomething('param')}>Action</button>
    </div>
  );
};
```

---

## 🎯 Hook Best Practices

### ✅ DO:

```typescript
// Always name hooks starting with "use"
export const useAuth = () => { ... };

// Throw error if used outside provider
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  
  return context;
};

// Clean up effects
useEffect(() => {
  socket.on('event', handler);
  
  return () => {
    socket.off('event', handler);
  };
}, [socket]);

// Return objects for multiple values
return {
  socket,
  isConnected,
  error
};

// Define TypeScript interfaces
interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
}
```

### ❌ DON'T:

```typescript
// Don't forget cleanup
useEffect(() => {
  socket.on('event', handler);
  // ❌ Missing cleanup
}, [socket]);

// Don't call hooks conditionally
if (condition) {
  const { socket } = useSocket(); // ❌
}

// Don't call hooks in loops
for (let i = 0; i < 10; i++) {
  const { socket } = useSocket(); // ❌
}

// Don't call hooks in callbacks
const handleClick = () => {
  const { socket } = useSocket(); // ❌
};

// Instead, call at top level
const MyComponent = () => {
  const { socket } = useSocket(); // ✅
  
  const handleClick = () => {
    // Use socket here
  };
};
```

---

## 🔄 Hook Dependencies

### Dependency Array Rules

```typescript
// Run once on mount
useEffect(() => {
  console.log('Component mounted');
}, []); // Empty array

// Run when dependencies change
useEffect(() => {
  console.log('Socket or roomId changed');
}, [socket, roomId]); // Dependency array

// Run on every render
useEffect(() => {
  console.log('Component rendered');
}); // No array (usually avoid this)
```

### Common Dependency Mistakes

```typescript
// ❌ Missing dependencies
useEffect(() => {
  socket.emit('event', { roomId }); // Uses roomId
}, [socket]); // Missing roomId!

// ✅ Include all dependencies
useEffect(() => {
  socket.emit('event', { roomId });
}, [socket, roomId]);

// ❌ Object/array dependencies (causes re-render)
useEffect(() => {
  // ...
}, [{ roomId }]); // New object every render!

// ✅ Use primitive values
useEffect(() => {
  // ...
}, [roomId]); // Primitive value
```

---

## 📋 Checklist for New Hook

- [ ] Create `.ts` file in `hooks/` folder
- [ ] Name starting with "use" (e.g., `useCustomHook`)
- [ ] Define TypeScript interface for return type
- [ ] Implement hook logic
- [ ] Add error handling
- [ ] Clean up effects (return cleanup function)
- [ ] Test hook in component
- [ ] Document in this README
- [ ] Export from hooks folder

---

## 🧪 Testing Custom Hooks

### With React Testing Library

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { AuthProvider } from '../context/AuthContext';

describe('useAuth', () => {
  const wrapper = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );
  
  it('should initialize with not authenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.teacherId).toBeNull();
  });
  
  it('should login successfully', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.login('teacher-123');
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.teacherId).toBe('teacher-123');
  });
  
  it('should logout successfully', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.login('teacher-123');
      result.current.logout();
    });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.teacherId).toBeNull();
  });
});
```

---

## 📚 Related Documentation

- **Pages:** [../pages/README.md](../pages/README.md)
- **Components:** [../components/README.md](../components/README.md)
- **Context:** [../context/](../context/)
- **Socket.IO Client:** [https://socket.io/docs/v4/client-api/](https://socket.io/docs/v4/client-api/)
- **React Hooks:** [https://react.dev/reference/react](https://react.dev/reference/react)

---

## 🎓 Context vs Hooks

### Context (Providers)

**Purpose:** Store and share state across the component tree

```typescript
// AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**When to Use:**
- Need to share state across many components
- Avoid prop drilling
- Global application state

### Hooks

**Purpose:** Access context or encapsulate reusable logic

```typescript
// useAuth.ts
export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};
```

**When to Use:**
- Access context values
- Reusable stateful logic
- Side effect management

### Together

```typescript
// App.tsx
<AuthProvider>         {/* Context: Provides state */}
  <SocketProvider>     {/* Context: Provides socket */}
    <MyComponent />    {/* Uses: useAuth, useSocket */}
  </SocketProvider>
</AuthProvider>

// MyComponent.tsx
const MyComponent = () => {
  const { isAuthenticated } = useAuth();      // Hook: Access auth
  const { socket } = useSocket();             // Hook: Access socket
  // ...
};
```

---

**Last Updated:** October 5, 2025  
**Total Hooks:** 2 (useSocket, useAuth)  
**Context Providers:** 2 (SocketProvider, AuthProvider)
