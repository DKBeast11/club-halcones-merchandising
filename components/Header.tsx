'use client';

import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';

const Header: React.FC = () => {
  const { isAdmin, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <header className="surface border-x-0 border-t-0">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <h1 className="legend-text text-2xl leading-none text-legend">Club Halcones</h1>
          <p className="mt-1.5 font-data text-[9.5px] uppercase tracking-[0.16em] text-legend-dim">
            F-18 · Eurofighter · Equipación oficial
          </p>
        </div>

        <button
          type="button"
          onClick={() => (isAdmin ? logout() : setShowLogin(true))}
          className="engraved legend-text flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-legend-dim transition-colors hover:text-legend"
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              isAdmin ? 'bg-signal-green shadow-[0_0_7px_#7FB069]' : 'bg-panel-edge'
            }`}
          />
          {isAdmin ? (
            <>
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </>
          ) : (
            'Acceso admin'
          )}
        </button>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </header>
  );
};

export default Header;
