'use client';

import React, { useState } from 'react';
import { Plane, Lock, LogOut } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';

const Header: React.FC = () => {
  const { isAdmin } = useProducts();
  const { logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <div className="bg-gray-800 shadow-lg border-b-2 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <Plane className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-blue-400">Club Halcones</h1>
                <p className="text-gray-300 text-sm">Merchandising Oficial F-18 & Eurofighter</p>
              </div>
            </div>
            
            <button
              onClick={() => isAdmin ? logout() : setShowLoginModal(true)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
                isAdmin 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isAdmin ? (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Admin Login</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
};

export default Header;

