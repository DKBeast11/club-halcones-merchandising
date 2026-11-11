'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Dialog from '@/components/ui/Dialog';

const AUTO_LOGOUT_MINUTES = process.env.NEXT_PUBLIC_AUTO_LOGOUT_MINUTES || '10';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Introduce el email y la contraseña.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        onClose();
      } else {
        setError('Email o contraseña incorrectos.');
        setPassword('');
      }
    } catch {
      setError('No se ha podido conectar. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Acceso admin"
      subtitle="Club Halcones · Panel de control"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="admin-email" className="legend-text text-[11px] text-legend-dim">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            data-autofocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field font-data text-[13px]"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="admin-password" className="legend-text text-[11px] text-legend-dim">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-11 font-data text-[13px]"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={isLoading}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-legend-dim transition-colors hover:text-legend"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="engraved flex items-center gap-2 border-signal-red/50 px-3 py-2 font-data text-[11px] text-signal-red"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={isLoading} className="btn-primary flex-1">
            {isLoading ? 'Verificando…' : 'Entrar'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary flex-1"
          >
            Cancelar
          </button>
        </div>

        <p className="font-data text-[10.5px] leading-relaxed text-legend-dim">
          La sesión se cierra sola tras {AUTO_LOGOUT_MINUTES} minutos sin actividad.
        </p>
      </form>
    </Dialog>
  );
};

export default LoginModal;
