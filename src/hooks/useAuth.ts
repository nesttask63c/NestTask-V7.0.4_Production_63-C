import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { loginUser, signupUser, logoutUser, resetPassword } from '../services/auth.service';
import type { User, LoginCredentials, SignupCredentials } from '../types/auth';

// LocalStorage key for saved credentials
const REMEMBER_ME_KEY = 'nesttask_remember_me';
const SAVED_EMAIL_KEY = 'nesttask_saved_email';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  useEffect(() => {
    // Load saved email from local storage if it exists
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
    if (savedEmail) {
      setSavedEmail(savedEmail);
    }
    
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await updateUserState(session.user);
      }
    } catch (err) {
      console.error('Session check error:', err);
      setError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthChange = async (_event: string, session: any) => {
    if (session?.user) {
      await updateUserState(session.user);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const updateUserState = async (authUser: any) => {
    try {
      setUser({
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
        role: authUser.user_metadata?.role || 'user',
        createdAt: authUser.created_at,
      });
    } catch (err) {
      console.error('Error updating user state:', err);
      setError('Failed to update user information');
    }
  };

  const login = async (credentials: LoginCredentials, rememberMe: boolean = false) => {
    try {
      setError(null);
      
      // Handle "Remember me" option
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
        localStorage.setItem(SAVED_EMAIL_KEY, credentials.email);
      } else {
        // Clear saved credentials if "Remember me" is not checked
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }
      
      const user = await loginUser(credentials);
      setUser(user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      setError(null);
      const user = await signupUser(credentials);
      setUser(user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await logoutUser();
      setUser(null);
      
      // Keep the saved email if "Remember me" was checked
      if (localStorage.getItem(REMEMBER_ME_KEY) !== 'true') {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      await resetPassword(email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    forgotPassword,
    savedEmail,
  };
}
