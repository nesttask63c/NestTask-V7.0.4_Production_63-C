import { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import type { LoginCredentials, SignupCredentials } from '../types/auth';

interface AuthPageProps {
  onLogin: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  onSignup: (credentials: SignupCredentials) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  error?: string;
}

export function AuthPage({ onLogin, onSignup, onForgotPassword, error }: AuthPageProps) {
  const [authState, setAuthState] = useState<'login' | 'signup' | 'forgot-password'>('login');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          NestTask
        </h1>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {authState === 'login' && (
          <LoginForm
            onSubmit={onLogin}
            onSwitchToSignup={() => setAuthState('signup')}
            onForgotPassword={() => setAuthState('forgot-password')}
            error={error}
          />
        )}
        {authState === 'signup' && (
          <SignupForm
            onSubmit={onSignup}
            onSwitchToLogin={() => setAuthState('login')}
            error={error}
          />
        )}
        {authState === 'forgot-password' && (
          <ForgotPasswordForm
            onSubmit={onForgotPassword}
            onBackToLogin={() => setAuthState('login')}
            error={error}
          />
        )}
      </div>
    </div>
  );
}