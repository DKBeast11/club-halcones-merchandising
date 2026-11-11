'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;
  user: { email: string; uuid: string } | null;
  /** Hay sesión de admin: muestra los controles de edición. */
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateActivity: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTO_LOGOUT_MINUTES = parseInt(process.env.NEXT_PUBLIC_AUTO_LOGOUT_MINUTES || '10');

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    lastActivity: Date.now()
  });
  const [user, setUser] = useState<{ email: string; uuid: string } | null>(null);

  // Login con Supabase Auth (correo y contraseña)
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      // Login con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data?.user) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        setUser(null);
        return false;
      }
      // Antes aquí el propio navegador se daba de alta en `admins` si no
      // estaba. Quién es admin se decide en la base de datos, no lo declara
      // el cliente.
      const uuid = data.user.id;
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        lastActivity: Date.now()
      });
      setUser({ email, uuid });
      return true;
    } catch (err) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      setUser(null);
      return false;
    }
  }, []);

  // Hay que cerrar la sesión de Supabase Auth, no solo el estado local. Antes
  // solo se hacía lo segundo: la interfaz volvía a modo visitante, pero el
  // token seguía guardado en el navegador y seguía valiendo para escribir y
  // para /api/admin. Lo mismo con el cierre automático por inactividad.
  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error al cerrar la sesión de Supabase:', error.message);
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      lastActivity: Date.now()
    });
    setUser(null);
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
    user,
    isAdmin: authState.isAuthenticated && !!user,
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
