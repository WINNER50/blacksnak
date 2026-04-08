import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Login from './auth/Login';
import Register from './auth/Register';
import ForgotPassword from './auth/ForgotPassword';

interface AuthFlowProps {
  onLogin: (user: any) => void;
}

export default function AuthFlow({ onLogin }: AuthFlowProps) {
  const [screen, setScreen] = useState<'login' | 'register' | 'forgot'>('login');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">Blacksnack</h1>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-purple-600 to-blue-500 rounded-full"></div>
        </div>

        {/* Contenu selon l'écran */}
        {screen === 'login' && (
          <Login
            onLogin={onLogin}
            onRegister={() => setScreen('register')}
            onForgotPassword={() => setScreen('forgot')}
          />
        )}

        {screen === 'register' && (
          <Register
            onBack={() => setScreen('login')}
            onLogin={onLogin}
          />
        )}

        {screen === 'forgot' && (
          <ForgotPassword
            onBack={() => setScreen('login')}
            onSuccess={() => setScreen('login')}
          />
        )}
      </div>
    </div>
  );
}
