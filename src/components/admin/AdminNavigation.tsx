import { LogOut } from 'lucide-react';

interface AdminNavigationProps {
  onLogout: () => void;
}

export function AdminNavigation({ onLogout }: AdminNavigationProps) {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">NestTask Admin</div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}