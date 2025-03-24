import { TaskCategoryBadge } from './task/TaskCategoryBadge';
import type { Task } from '../types';

interface TaskCategoriesProps {
  tasks: Task[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function TaskCategories({ tasks, activeCategory, onCategoryChange }: TaskCategoriesProps) {
  const categories = [
    { id: 'my-tasks', label: 'To Do', icon: 'list' },
    { id: 'in-progress', label: 'In Progress', icon: 'clock' },
    { id: 'completed', label: 'Completed', icon: 'check' },
  ];

  const getCategoryCount = (categoryId: string) => {
    return tasks.filter(task => task.status === categoryId).length;
  };

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 px-1">Task Categories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {categories.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onCategoryChange(id)}
            className="w-full"
          >
            <TaskCategoryBadge
              category={label}
              icon={icon}
              isActive={activeCategory === id}
              count={getCategoryCount(id)}
            />
          </button>
        ))}
      </div>
    </div>
  );
}