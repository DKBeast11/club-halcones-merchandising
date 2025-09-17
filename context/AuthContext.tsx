'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;
  login: (password: string) => boolean;
  logout: () => void;
  updateActivity: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTO_LOGOUT_MINUTES = parseInt(process.env.NEXT_PUBLIC_AUTO_LOGOUT_MINUTES || '10');
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'F18-Eurofighter-2024';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    lastActivity: Date.now()
  });

  // Función de login
  const login = useCallback((password: string): boolean => {
    console.log('Login attempt with password:', password);
    console.log('Expected password:', ADMIN_PASSWORD);
    
    if (password === ADMIN_PASSWORD) {
      const now = Date.now();
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        lastActivity: now
      });
      console.log('Login successful');
      return true;
    }
    console.log('Login failed');
    return false;
  }, []);

  // Función de logout
  const logout = useCallback(() => {
    console.log('Logout called');
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      lastActivity: Date.now()
    });
  }, []);

  // Función para actualizar la actividad
  const updateActivity = useCallback(() => {
    if (authState.isAuthenticated) {
      const now = Date.now();
      setAuthState(prev => ({ ...prev, lastActivity: now }));
    }
  }, [authState.isAuthenticated]);

  // Detectar actividad del usuario
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [authState.isAuthenticated, updateActivity]);

  // Verificar inactividad cada minuto
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const checkInactivity = () => {
      const now = Date.now();
      const timeDiff = now - authState.lastActivity;
      const maxTime = AUTO_LOGOUT_MINUTES * 60 * 1000;

      if (timeDiff >= maxTime) {
        logout();
      }
    };

    const interval = setInterval(checkInactivity, 60000); // Verificar cada minuto
    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.lastActivity, logout]);

  const value: AuthContextType = {
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    lastActivity: authState.lastActivity,
    login,
    logout,
    updateActivity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
