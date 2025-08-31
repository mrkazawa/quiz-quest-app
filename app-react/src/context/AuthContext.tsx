import React, { createContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  teacherId: string | null;
  login: (teacherId: string) => void;
  logout: () => void;
  checkAuthStatus: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  teacherId: null,
  login: () => {},
  logout: () => {},
  checkAuthStatus: () => false,
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Check authentication status on mount
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

  const login = (newTeacherId: string) => {
    localStorage.setItem('isTeacher', 'true');
    localStorage.setItem('teacherId', newTeacherId);
    setIsAuthenticated(true);
    setTeacherId(newTeacherId);
  };

  const logout = () => {
    localStorage.removeItem('isTeacher');
    localStorage.removeItem('teacherId');
    setIsAuthenticated(false);
    setTeacherId(null);
    
    // Also logout from server session
    fetch('/api/logout', { method: 'GET' }).catch(console.error);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      teacherId,
      login,
      logout,
      checkAuthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
