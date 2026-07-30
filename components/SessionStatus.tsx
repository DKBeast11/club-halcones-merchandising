'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const AUTO_LOGOUT_MINUTES = parseInt(process.env.NEXT_PUBLIC_AUTO_LOGOUT_MINUTES || '10');

/** Por debajo de esto el testigo pasa a ámbar. */
const WARNING_MINUTES = 2;

const SessionStatus: React.FC = () => {
  const { isAuthenticated, logout, lastActivity } = useAuth();
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const tick = () => {
      const elapsed = Date.now() - lastActivity;
      const remaining = Math.max(0, AUTO_LOGOUT_MINUTES * 60 * 1000 - elapsed);
      setMinutesLeft(remaining / 60000);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity]);

  if (!isAuthenticated) return null;

  const warning = minutesLeft <= WARNING_MINUTES;

  const mins = Math.floor(minutesLeft);
  const secs = Math.floor((minutesLeft - mins) * 60);
  const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <aside
      className="fixed left-4 top-4 z-40"
      aria-live="polite"
      aria-label="Estado de la sesión"
    >
      <div
        className={`engraved flex items-center gap-3 px-3 py-2 ${
          warning ? 'border-signal-amber/60' : ''
        }`}
      >
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            warning
              ? 'bg-signal-amber shadow-[0_0_7px_#E8A33D]'
              : 'bg-signal-green shadow-[0_0_7px_#7FB069]'
          }`}
        />

        {!isMinimized && (
          <div className="flex flex-col gap-0.5">
            <span
              className={`legend-text text-[11px] leading-none ${
                warning ? 'text-signal-amber' : 'text-signal-green'
              }`}
            >
              Sesión activa
            </span>
            <span className="font-data text-[10px] tabular text-legend-dim">
              Expira en {formatted}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized((v) => !v)}
            aria-label={isMinimized ? 'Mostrar detalles de la sesión' : 'Minimizar'}
            className="p-1 text-legend-dim transition-colors hover:text-legend"
          >
            {isMinimized ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            className="p-1 text-legend-dim transition-colors hover:text-signal-red"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SessionStatus;
