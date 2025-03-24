import { useState } from 'react';
import { Mail, Lock, User, Phone, Car as IdCard, Loader2 } from 'lucide-react';
import { AuthError } from './AuthError';
import { AuthInput } from './AuthInput';
import { AuthSubmitButton } from './AuthSubmitButton';
import { validateEmail, validatePassword, validatePhone, validateStudentId } from '../../utils/authErrors';
import type { SignupCredentials } from '../../types/auth';

interface SignupFormProps {
  onSubmit: (credentials: SignupCredentials) => Promise<void>;
  onSwitchToLogin: () => void;
  error?: string;
}

export function SignupForm({ onSubmit, onSwitchToLogin, error }: SignupFormProps) {
  const [credentials, setCredentials] = useState<SignupCredentials>({
    name: '',
    email: '',
    password: '',
    phone: '',
    studentId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    phone: false,
    studentId: false
  });

  const validateForm = () => {
    if (!credentials.name.trim()) {
      setLocalError('Name is required');
      return false;
    }
    if (!validateEmail(credentials.email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    if (!validatePassword(credentials.password)) {
      setLocalError('Password must be at least 6 characters long');
      return false;
    }
    if (!validatePhone(credentials.phone)) {
      setLocalError('Please enter a valid phone number');
      return false;
    }
    if (!validateStudentId(credentials.studentId)) {
      setLocalError('Please enter a valid student ID');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(credentials);
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SignupCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    setLocalError(null);
  };

  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-lg border border-gray-100 dark:border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Create Account
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Join our community and start managing your tasks
        </p>
      </div>
      
      {(error || localError) && <AuthError message={error || localError || ''} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          type="text"
          value={credentials.name}
          onChange={(value) => handleInputChange('name', value)}
          label="Full Name"
          placeholder="Enter your full name"
          icon={User}
          error={touched.name && !credentials.name.trim() ? 'Name is required' : ''}
        />

        <AuthInput
          type="email"
          value={credentials.email}
          onChange={(value) => handleInputChange('email', value)}
          label="Email"
          placeholder="Enter your email"
          icon={Mail}
          error={touched.email && !validateEmail(credentials.email) ? 'Please enter a valid email' : ''}
        />

        <AuthInput
          type="text"
          value={credentials.phone}
          onChange={(value) => handleInputChange('phone', value)}
          label="Phone Number"
          placeholder="Enter your phone number"
          icon={Phone}
          error={touched.phone && !validatePhone(credentials.phone) ? 'Please enter a valid phone number' : ''}
        />

        <AuthInput
          type="text"
          value={credentials.studentId}
          onChange={(value) => handleInputChange('studentId', value)}
          label="Student ID"
          placeholder="Enter your student ID"
          icon={IdCard}
          error={touched.studentId && !validateStudentId(credentials.studentId) ? 'Please enter a valid student ID' : ''}
        />

        <AuthInput
          type="password"
          value={credentials.password}
          onChange={(value) => handleInputChange('password', value)}
          label="Password"
          placeholder="Choose a password"
          icon={Lock}
          error={touched.password && !validatePassword(credentials.password) ? 'Password must be at least 6 characters' : ''}
        />

        <AuthSubmitButton 
          label={isLoading ? 'Creating account...' : 'Create account'} 
          isLoading={isLoading}
          icon={isLoading ? Loader2 : undefined}
        />
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}