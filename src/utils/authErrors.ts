export const AUTH_ERROR_MESSAGES = {
  invalid_credentials: 'Invalid email or password. Please try again.',
  email_taken: 'This email is already registered. Please try logging in instead.',
  weak_password: 'Password must be at least 6 characters long.',
  invalid_email: 'Please enter a valid email address.',
  invalid_phone: 'Please enter a valid phone number.',
  invalid_student_id: 'Please enter a valid student ID.',
  'Invalid login credentials': 'Invalid email or password. Please try again.',
  'Email already registered': 'This email is already registered. Please try logging in instead.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
  'Invalid email format': 'Please enter a valid email address.',
  default: 'An error occurred. Please try again.'
} as const;

export function getAuthErrorMessage(error: any): string {
  if (!error) return '';
  
  const message = error.message || error.error_description || error.code;
  return AUTH_ERROR_MESSAGES[message as keyof typeof AUTH_ERROR_MESSAGES] || 
         AUTH_ERROR_MESSAGES.default;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

export function validatePhone(phone: string): boolean {
  // Allows formats: +880123456789 or 01234567890
  const phoneRegex = /^(?:\+880|0)\d{10}$/;
  return phoneRegex.test(phone);
}

export function validateStudentId(studentId: string): boolean {
  // Accept any non-empty string of numbers
  return /^\d+$/.test(studentId);
}