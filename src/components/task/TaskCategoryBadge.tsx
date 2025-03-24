import { CheckCircle, Clock, ListTodo } from 'lucide-react';

interface TaskCategoryBadgeProps {
  category: string;
  icon: string;
  isActive: boolean;
  count: number;
}

export function TaskCategoryBadge({ category, icon, isActive, count }: TaskCategoryBadgeProps) {
  const getIcon = () => {
    switch (icon) {
      case 'check':
        return <CheckCircle className="w-5 h-5" />;
      case 'clock':
        return <Clock className="w-5 h-5" />;
      default:
        return <ListTodo className="w-5 h-5" />;
    }
  };

  return (
    <div 
      className={`
        flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-primary-600 text-white shadow-sm scale-102' 
          : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-primary-600 shadow-sm'
        }
      `}
    >
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="font-medium text-sm">{category}</span>
      </div>
      <span className={`
        px-2 py-0.5 text-xs font-medium rounded-full
        ${isActive 
          ? 'bg-white/10' 
          : 'bg-primary-50/80 text-primary-700'
        }
      `}>
        {count}
      </span>
    </div>
  );
}