import { Menu, X } from 'lucide-react';

interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function MobileMenuButton({ isOpen, onClick }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl shadow-lg 
        transition-all duration-300 transform
        ${isOpen 
          ? 'bg-white dark:bg-gray-800 rotate-90' 
          : 'bg-gradient-to-r from-blue-600 to-indigo-600'}
      `}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
    >
      {isOpen ? (
        <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      ) : (
        <Menu className="w-5 h-5 text-white" />
      )}
    </button>
  );
}