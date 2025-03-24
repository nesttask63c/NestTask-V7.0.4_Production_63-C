import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../utils/authErrors';
import type { LoginCredentials, SignupCredentials, User } from '../types/auth';
import type { Database } from '../types/supabase';

type DbUser = Database['public']['Tables']['users']['Row'];
type DbUserInsert = Database['public']['Tables']['users']['Insert'];

// Check if "Remember me" is enabled
const isRememberMeEnabled = () => localStorage.getItem('nesttask_remember_me') === 'true';

export async function loginUser({ email, password }: LoginCredentials): Promise<User> {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Set session persistence by ensuring we have a clean session state
    await supabase.auth.setSession({
      access_token: '',
      refresh_token: ''
    });

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
      email, 
      password
    });
    
    if (authError) throw authError;
    if (!authData?.user) throw new Error('No user data received');

    // Store the session in localStorage for persistence
    if (authData.session) {
      localStorage.setItem('supabase.auth.token', JSON.stringify(authData.session));
    }

    // Wait briefly for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select()
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    if (!profile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          email: authData.user.email!,
          name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || '',
          role: authData.user.user_metadata?.role || 'user',
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        } as Partial<DbUser>)
        .select()
        .single();

      if (createError) {
        throw new Error('Failed to create user profile');
      }

      if (!newProfile) {
        throw new Error('No profile data received after creation');
      }

      return {
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name || '',
        role: newProfile.role as 'user' | 'admin',
        createdAt: newProfile.created_at,
        lastActive: newProfile.last_active
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name || '',
      role: profile.role as 'user' | 'admin',
      createdAt: profile.created_at,
      lastActive: profile.last_active
    };
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(getAuthErrorMessage(error));
  }
}

export async function signupUser({ email, password, name, phone, studentId }: SignupCredentials): Promise<User> {
  try {
    if (!email || !password || !name || !phone || !studentId) {
      throw new Error('All fields are required');
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'user',
          phone,
          studentId
        },
      },
    });
    
    if (authError) throw authError;
    if (!authData?.user) throw new Error('No user data received');

    // Wait for the trigger to create the user profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get or create the user profile
    const { data: profiles, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id);

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = profiles?.[0];
    if (!profile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          name,
          role: 'user',
          phone,
          student_id: studentId
        })
        .select()
        .single();

      if (createError) {
        await supabase.auth.signOut();
        throw new Error('Failed to create user profile');
      }

      return {
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name,
        phone: newProfile.phone,
        studentId: newProfile.student_id,
        role: newProfile.role,
        createdAt: newProfile.created_at
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      studentId: profile.student_id,
      role: profile.role,
      createdAt: profile.created_at
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error.message?.includes('duplicate key') || 
        error.message?.includes('already registered')) {
      throw new Error('Email already registered');
    }
    throw new Error(getAuthErrorMessage(error));
  }
}

export async function logoutUser(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut({
      scope: 'local' // Only clear the local session
    });
    if (error) throw error;
    
    // Clear only specific auth-related items
    localStorage.removeItem('nesttask_remember_me');
    localStorage.removeItem('nesttask_saved_email');
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    if (!email) {
      throw new Error('Email is required');
    }
    
    console.log('Sending password reset email to:', email);
    
    // The redirectTo URL must be added to the "Additional Redirect URLs" in the Supabase Dashboard
    // under Authentication -> URL Configuration
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Add the hash fragment to force our app to show the reset password UI
      redirectTo: `${window.location.origin}/#auth/recovery`,
    });
    
    if (error) {
      console.error('Supabase resetPasswordForEmail error:', error);
      throw error;
    }
    
    console.log('Password reset email sent successfully');
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(getAuthErrorMessage(error) || 'Failed to send password reset email. Please try again.');
  }
}

// Helper function to map database user to User type
function mapDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name || '',
    role: dbUser.role as 'user' | 'admin',
    createdAt: dbUser.created_at,
    lastActive: dbUser.last_active
  };
}