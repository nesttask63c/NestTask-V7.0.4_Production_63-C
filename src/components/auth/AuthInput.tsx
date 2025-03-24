import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface AuthInputProps {
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  icon: LucideIcon;
  error?: string;
  required?: boolean;
  rightElement?: ReactNode;
  autocomplete?: string;
}

export function AuthInput({
  type,
  value,
  onChange,
  label,
  placeholder,
  icon: Icon,
  error,
  required = true,
  rightElement,
  autocomplete
}: AuthInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full pl-10 ${rightElement ? 'pr-10' : 'pr-4'} py-2.5 rounded-xl transition-colors
            ${error 
              ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
            }
            dark:bg-gray-700 dark:text-white
          `}
          placeholder={placeholder}
          required={required}
          autoComplete={autocomplete}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}