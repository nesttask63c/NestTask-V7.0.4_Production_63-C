import { useState } from 'react';
import { Mail, ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { AuthError } from './AuthError';
import { AuthInput } from './AuthInput';
import { AuthSubmitButton } from './AuthSubmitButton';
import { validateEmail } from '../../utils/authErrors';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  onBackToLogin: () => void;
  error?: string;
}

export function ForgotPasswordForm({ onSubmit, onBackToLogin, error }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false });

  const validateForm = () => {
    if (!validateEmail(email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(email);
      setSuccessMessage('Password reset link sent to your email');
      setEmail('');
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    setTouched(prev => ({ ...prev, email: true }));
    setLocalError(null);
  };

  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-lg border border-gray-100 dark:border-gray-700 transition-all duration-300">
      {!successMessage ? (
        <>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Forgot Password
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter your email to receive a password reset link
            </p>
          </div>
          
          {(error || localError) && <AuthError message={error || localError || ''} />}

          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthInput
              type="email"
              value={email}
              onChange={handleInputChange}
              label="Email"
              placeholder="Enter your email"
              icon={Mail}
              error={touched.email && !validateEmail(email) ? 'Please enter a valid email' : ''}
            />

            <AuthSubmitButton 
              label={isLoading ? 'Sending...' : 'Send Reset Link'} 
              isLoading={isLoading}
              icon={isLoading ? Loader2 : undefined}
              disabled={!email || (touched.email && !validateEmail(email))}
            />
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center justify-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="text-center py-5">
          <div className="inline-flex items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 rounded-full mb-6">
            <MailCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Check your inbox</h3>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            We've sent a password reset link to <span className="font-medium">{email || 'your email'}</span>. 
            Please check your inbox and follow the instructions to reset your password.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            If you don't see the email, check your spam folder or try again.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
            >
              Try another email
            </button>
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center justify-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 