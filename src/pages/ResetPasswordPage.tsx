import { useState, useEffect } from 'react';
import { Lock, Check, X, EyeOff, Eye, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthError } from '../components/auth/AuthError';
import { AuthInput } from '../components/auth/AuthInput';
import { AuthSubmitButton } from '../components/auth/AuthSubmitButton';
import { validatePassword } from '../utils/authErrors';

// Password strength criteria and scoring
type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';

const getPasswordStrength = (password: string): { strength: PasswordStrength; score: number } => {
  if (!password) return { strength: 'weak', score: 0 };
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Complexity checks
  if (/[A-Z]/.test(password)) score += 1;  // Has uppercase
  if (/[a-z]/.test(password)) score += 1;  // Has lowercase
  if (/[0-9]/.test(password)) score += 1;  // Has number
  if (/[^A-Za-z0-9]/.test(password)) score += 1;  // Has special char
  
  let strength: PasswordStrength = 'weak';
  if (score >= 5) strength = 'very-strong';
  else if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  return { strength, score: Math.min(score, 6) };
};

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Password strength calculation
  const { strength, score } = getPasswordStrength(password);
  
  // Color mapping for password strength
  const strengthColors = {
    'weak': 'bg-red-500',
    'medium': 'bg-yellow-500',
    'strong': 'bg-green-500',
    'very-strong': 'bg-emerald-500'
  };
  
  // Check for auth session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // This ensures we're working with a valid session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('No active session found for password reset');
          setError('Your password reset link appears to be invalid or has expired. Please request a new link.');
        } else {
          console.log('Valid session found for password reset');
        }
      } catch (err) {
        console.error('Session check error:', err);
        setError('Unable to verify your session. Please try again or request a new reset link.');
      }
    };
    
    checkSession();
  }, []);

  // Countdown timer for redirect after success
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      // Redirect to login
      window.location.href = '/';
    }
  }, [success, countdown]);

  const validateForm = () => {
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (strength === 'weak') {
      setError('Your password is too weak. Please choose a stronger password.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('Attempting to update password');
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({ 
        password 
      });
      
      if (error) {
        console.error('Password update error:', error);
        throw error;
      }
      
      console.log('Password updated successfully');
      setSuccess(true);
      
      // Clear the recovery hash from URL
      if (window.history.pushState) {
        window.history.pushState("", "", '/');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'An error occurred while resetting your password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'password' | 'confirmPassword', value: string) => {
    if (field === 'password') {
      setPassword(value);
    } else {
      setConfirmPassword(value);
    }
    setTouched(prev => ({ ...prev, [field]: true }));
    setError(null);
  };

  // Handle going back to login
  const handleBackToLogin = () => {
    // Clear the recovery hash from URL
    if (window.history.pushState) {
      window.history.pushState("", "", '/');
    }
    window.location.reload();
  };

  const renderPasswordRequirements = () => (
    <div className="mt-4 space-y-2 text-sm">
      <p className="font-medium text-gray-700 dark:text-gray-300">Password requirements:</p>
      <ul className="space-y-1 pl-1">
        <li className={`flex items-center ${password.length >= 6 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {password.length >= 6 ? <Check size={16} className="mr-2 flex-shrink-0" /> : <X size={16} className="mr-2 flex-shrink-0" />}
          At least 6 characters
        </li>
        <li className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {/[A-Z]/.test(password) ? <Check size={16} className="mr-2 flex-shrink-0" /> : <X size={16} className="mr-2 flex-shrink-0" />}
          At least one uppercase letter
        </li>
        <li className={`flex items-center ${/[0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {/[0-9]/.test(password) ? <Check size={16} className="mr-2 flex-shrink-0" /> : <X size={16} className="mr-2 flex-shrink-0" />}
          At least one number
        </li>
        <li className={`flex items-center ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {/[^A-Za-z0-9]/.test(password) ? <Check size={16} className="mr-2 flex-shrink-0" /> : <X size={16} className="mr-2 flex-shrink-0" />}
          At least one special character
        </li>
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
          NestTask
        </h1>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-lg border border-gray-100 dark:border-gray-700 transition-all duration-300">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
              <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Reset Password
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create a new secure password for your account
            </p>
          </div>
          
          {error && <AuthError message={error} />}
          
          {success ? (
            <div className="mb-4 p-6 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-center transition-all duration-300">
              <div className="inline-flex items-center justify-center p-2 bg-green-100 dark:bg-green-800 rounded-full mb-4">
                <Check className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Password Reset Successful!</h3>
              <p className="mb-4">Your password has been changed successfully.</p>
              <p>Redirecting to login in <span className="font-bold">{countdown}</span> seconds...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <AuthInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(value) => handleInputChange('password', value)}
                  label="New Password"
                  placeholder="Enter your new password"
                  icon={Lock}
                  error={touched.password && !validatePassword(password) ? 'Password must be at least 6 characters' : ''}
                  rightElement={
                    <button 
                      type="button"
                      className="text-gray-400 hover:text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                
                {touched.password && password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">
                        {strength} password
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${strengthColors[strength]} transition-all duration-300`} 
                        style={{ width: `${(score / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {touched.password && password && strength === 'weak' && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    Choose a stronger password for better security
                  </p>
                )}
              </div>

              <AuthInput
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(value) => handleInputChange('confirmPassword', value)}
                label="Confirm Password"
                placeholder="Confirm your new password"
                icon={Lock}
                error={touched.confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
                rightElement={
                  <button 
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              
              {touched.password && password && renderPasswordRequirements()}

              <AuthSubmitButton 
                label={isLoading ? 'Resetting Password...' : 'Reset Password'} 
                isLoading={isLoading}
                icon={isLoading ? Loader2 : undefined}
                disabled={!password || !confirmPassword || password !== confirmPassword || strength === 'weak'}
              />
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="inline-flex items-center justify-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 