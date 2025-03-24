export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  studentId?: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastActive?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name: string;
  phone: string;
  studentId: string;
}
