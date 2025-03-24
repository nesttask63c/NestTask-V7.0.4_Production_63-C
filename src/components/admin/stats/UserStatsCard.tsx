import { LucideIcon } from 'lucide-react';

interface UserStatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'indigo';
  onClick?: () => void;
  loading?: boolean;
}

export function UserStatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  onClick,
  loading = false 
}: UserStatsCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 hover:bg-blue-100';
      case 'green':
        return 'bg-green-50 text-green-600 hover:bg-green-100';
      case 'purple':
        return 'bg-purple-50 text-purple-600 hover:bg-purple-100';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        w-full bg-white rounded-2xl p-6 shadow-sm 
        transition-all duration-300 
        ${onClick ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : 'cursor-default'}
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl transition-colors ${getColorClasses()}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </button>
  );
}