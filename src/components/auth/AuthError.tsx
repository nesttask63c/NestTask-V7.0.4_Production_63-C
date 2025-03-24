import { AlertCircle } from 'lucide-react';

interface AuthErrorProps {
  message: string;
}

export function AuthError({ message }: AuthErrorProps) {
  return (
    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm">{message}</span>
    </div>
  );
}