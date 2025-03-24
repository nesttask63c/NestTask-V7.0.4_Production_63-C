import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { Layout } from 'lucide-react';
import type { LoginCredentials, SignupCredentials } from '../../types/auth';

interface AuthPageProps {
  onLogin: (credentials: LoginCredentials) => void;
  onSignup: (credentials: SignupCredentials) => void;
  error?: string;
}

export function AuthPage({ onLogin, onSignup, error }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center opacity-5" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center mb-8">
          <Layout className="w-10 h-10 text-blue-600" />
          <h1 className="text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 ml-2">
            NestTask
          </h1>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
        {isLogin ? (
          <LoginForm
            onSubmit={onLogin}
            onSwitchToSignup={() => setIsLogin(false)}
            error={error}
          />
        ) : (
          <SignupForm
            onSubmit={onSignup}
            onSwitchToLogin={() => setIsLogin(true)}
            error={error}
          />
        )}
      </div>
    </div>
  );
}