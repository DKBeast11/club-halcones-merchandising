'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;
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
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Login usando Supabase y la tabla admins
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      // Buscar admin por email
      const { data: admin, error } = await supabase
        .from('admins')
        .select('id, password_hash')
        .eq('email', email)
        .single();
      console.log('Resultado consulta admin:', admin);
      if (error || !admin) {
        console.log('Error o admin no encontrado:', error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }
      console.log('Comparando:', admin.password_hash, password);
      // Verificar password (solo para demo, en producción usar hash seguro)
      if (admin.password_hash !== password) {
        console.log('Contraseña incorrecta');
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }
      // Crear sesión
      const sessionToken = Math.random().toString(36).substring(2) + Date.now();
      await supabase.from('admin_sessions').insert({
        admin_id: admin.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + AUTO_LOGOUT_MINUTES * 60 * 1000)
      });
      setSessionToken(sessionToken);
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        lastActivity: Date.now()
      });
      return true;
    } catch (err) {
      console.log('Error en login:', err);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  // Logout: eliminar sesión en Supabase
  const logout = useCallback(async () => {
    if (sessionToken) {
      await supabase.from('admin_sessions').delete().eq('session_token', sessionToken);
    }
    setSessionToken(null);
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      lastActivity: Date.now()
    });
  }, [sessionToken]);

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
