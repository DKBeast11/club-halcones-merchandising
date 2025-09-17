'use client';

import React, { useState, useEffect } from 'react';
import { Clock, LogOut, AlertTriangle, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const AUTO_LOGOUT_MINUTES = parseInt(process.env.NEXT_PUBLIC_AUTO_LOGOUT_MINUTES || '10');

const SessionStatus: React.FC = () => {
  const { isAuthenticated, logout, lastActivity } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const updateTimeLeft = () => {
      const now = Date.now();
      const timeDiff = now - lastActivity;
      const maxTime = AUTO_LOGOUT_MINUTES * 60 * 1000;
      const remaining = Math.max(0, maxTime - timeDiff);
      const remainingMinutes = remaining / (60 * 1000);
      
      setTimeLeft(remainingMinutes);
      setShowWarning(remainingMinutes <= 2);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000); // Actualizar cada segundo

    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity]);

  if (!isAuthenticated) return null;

  const formatTime = (minutes: number) => {
    if (minutes <= 0) return '0:00';
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    logout();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <aside className={`fixed top-4 left-4 z-40 transition-all duration-300 ${
      showWarning ? 'animate-pulse' : ''
    }`} aria-live="polite" aria-label="Estado de sesión">
      <div className={`bg-gray-800 border rounded-lg shadow-lg transition-all duration-300 ${
        showWarning 
          ? 'border-red-500 bg-red-900/20' 
          : 'border-gray-700'
      } ${isMinimized ? 'p-2' : 'p-3'}`}>
        <div className="flex items-center space-x-2">
          {showWarning ? (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          ) : (
            <Clock className="w-4 h-4 text-blue-400" />
          )}
          
          {!isMinimized && (
            <div className="text-sm">
              <div className={`font-semibold ${
                showWarning ? 'text-red-400' : 'text-green-400'
              }`}>
                SESIÓN ACTIVA
              </div>
              <div className={`text-xs ${
                showWarning ? 'text-red-300' : 'text-gray-300'
              }`}>
                {showWarning ? 'Expira en' : 'Expira en'} {formatTime(timeLeft)}
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleMinimize}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title={isMinimized ? "Expandir" : "Minimizar"}
            >
              {isMinimized ? (
                <Maximize2 className="w-3 h-3 text-gray-400 hover:text-white" />
              ) : (
                <Minimize2 className="w-3 h-3 text-gray-400 hover:text-white" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SessionStatus;