import { Task } from '../types';
import { 
  Crown, 
  Calendar, 
  Clock,
  BookOpen,
  PenSquare,
  Presentation,
  Beaker,
  Microscope,
  Activity,
  FileText,
  Building,
  Users,
  GraduationCap,
  Tag,
  Folder,
  ChevronRight,
  CheckCircle2,
  MoreVertical,
  Trash2,
  WifiOff
} from 'lucide-react';
import { isOverdue } from '../utils/dateUtils';
import { parseLinks } from '../utils/linkParser';
import { useState, useMemo } from 'react';
import { TaskDetailsPopup } from './task/TaskDetailsPopup';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

interface TaskListProps {
  tasks: Task[];
  onDeleteTask?: (taskId: string) => void;
  showDeleteButton?: boolean;
}

export function TaskList({ tasks, onDeleteTask, showDeleteButton = false }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isOffline = useOfflineStatus();

  // Sort tasks to move completed tasks to the bottom and handle overdue tasks
  const sortedTasks = [...tasks].sort((a, b) => {
    // First, separate completed tasks from non-completed tasks
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;

    // For non-completed tasks, prioritize overdue tasks
    const aIsOverdue = isOverdue(a.dueDate);
    const bIsOverdue = isOverdue(b.dueDate);
    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;

    // Otherwise, sort by due date (earlier dates first)
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'quiz':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'assignment':
        return <PenSquare className="w-3.5 h-3.5" />;
      case 'presentation':
        return <Presentation className="w-3.5 h-3.5" />;
      case 'project':
        return <Folder className="w-3.5 h-3.5" />;
      case 'lab-report':
        return <Beaker className="w-3.5 h-3.5" />;
      case 'lab-final':
        return <Microscope className="w-3.5 h-3.5" />;
      case 'lab-performance':
        return <Activity className="w-3.5 h-3.5" />;
      case 'documents':
        return <FileText className="w-3.5 h-3.5" />;
      case 'blc':
        return <Building className="w-3.5 h-3.5" />;
      case 'groups':
        return <Users className="w-3.5 h-3.5" />;
      default:
        return <GraduationCap className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'quiz':
        return 'text-blue-600 dark:text-blue-400';
      case 'assignment':
        return 'text-orange-600 dark:text-orange-400';
      case 'presentation':
        return 'text-red-600 dark:text-red-400';
      case 'project':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'lab-report':
        return 'text-green-600 dark:text-green-400';
      case 'lab-final':
        return 'text-purple-600 dark:text-purple-400';
      case 'lab-performance':
        return 'text-pink-600 dark:text-pink-400';
      case 'documents':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'blc':
        return 'text-cyan-600 dark:text-cyan-400';
      case 'groups':
        return 'text-teal-600 dark:text-teal-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 animate-fade-in">
        <img
          src="https://images.unsplash.com/photo-1496115965489-21be7e6e59a0?auto=format&fit=crop&q=80&w=400"
          alt="Empty tasks"
          className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-2xl mx-auto mb-4 opacity-50 shadow-lg"
        />
        <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg font-medium">No tasks found in this category</p>
        <p className="text-gray-400 dark:text-gray-500 mt-2 text-sm sm:text-base">Time to add some new tasks!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isOffline && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2 text-sm text-blue-700 border border-blue-100">
          <WifiOff className="h-4 w-4 text-blue-500" />
          <p>You're offline. Showing cached tasks.</p>
        </div>
      )}
      
      <div className="w-full max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 md:bg-transparent">
        {/* Mobile-optimized container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3 md:gap-4 lg:gap-6 md:p-4 lg:p-6">
          {sortedTasks.map((task, index) => {
            const overdue = isOverdue(task.dueDate);
            const parsedLinks = parseLinks(task.description);
            const hasLinks = parsedLinks.some(part => part.type === 'link');

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`relative bg-white dark:bg-gray-800 md:bg-white md:dark:bg-gray-800
                  rounded-2xl md:rounded-lg
                  shadow-sm md:hover:shadow-lg
                  border border-gray-100 dark:border-gray-700/50
                  p-4 md:p-4 lg:p-5
                  transition-all duration-300 ease-in-out
                  active:scale-[0.98] md:active:scale-100 md:hover:-translate-y-1
                  active:bg-gray-50 dark:active:bg-gray-800/90 md:active:bg-white
                  touch-manipulation md:touch-auto
                  ${task.status === 'completed'
                    ? 'md:border-green-200 md:dark:border-green-900/80 bg-green-50 dark:bg-gray-800 md:bg-white md:dark:bg-gray-800'
                    : overdue
                      ? 'md:border-red-200 md:dark:border-red-900/80 bg-red-50 dark:bg-gray-800 md:bg-white md:dark:bg-gray-800'
                      : 'md:border-sky-100 md:dark:border-sky-800/30 md:hover:border-sky-200 md:dark:hover:border-sky-700/50'}
                  motion-safe:animate-fade-in motion-safe:animate-duration-500`}
                style={{ 
                  animationDelay: `${index * 50}ms`
                }}
              >
                {/* Category Tag - Desktop */}
                <div className="hidden md:flex items-start justify-between mb-3.5 md:mb-2">
                  <span className={`inline-flex items-center gap-1.5 
                    px-2.5 py-1 md:px-2 md:py-0.5
                    rounded-full text-sm md:text-xs font-medium
                    bg-white dark:bg-gray-800
                    shadow-sm md:hover:shadow
                    border border-gray-100 dark:border-gray-700/50
                    transition-all duration-200
                    md:hover:-translate-y-0.5
                    ${getCategoryColor(task.category)}`}
                  >
                    <span className="w-3.5 h-3.5 md:w-3 md:h-3">
                      {getCategoryIcon(task.category)}
                    </span>
                    <span className="truncate max-w-[130px] md:max-w-[100px] lg:max-w-[160px]">
                      {task.category.replace(/-/g, ' ')}
                    </span>
                  </span>

                  {task.isAdminTask && (
                    <Crown className="w-5 h-5 md:w-4 md:h-4 text-amber-500 animate-pulse md:ml-2 hidden md:block" />
                  )}
                </div>

                {/* Task Content with Mobile Tag */}
                <div className="space-y-2.5 md:space-y-2">
                  {/* Title and Tag Container for Mobile */}
                  <div className="flex items-start justify-between md:block">
                    <h3 className="text-base md:text-sm lg:text-base font-semibold 
                      text-gray-900 dark:text-gray-100 
                      leading-snug md:leading-tight
                      line-clamp-2 flex-1 md:flex-none"
                    >
                      {task.name}
                    </h3>
                    
                    {/* Mobile-only Tag */}
                    <span className={`md:hidden inline-flex items-center gap-1.5 
                      px-2 py-0.5
                      rounded-full text-xs font-medium
                      bg-white dark:bg-gray-800
                      shadow-sm
                      border border-gray-100 dark:border-gray-700/50
                      ml-2
                      ${getCategoryColor(task.category)}`}
                    >
                      <span className="w-3 h-3">
                        {getCategoryIcon(task.category)}
                      </span>
                      <span className="truncate max-w-[80px]">
                        {task.category.replace(/-/g, ' ')}
                      </span>
                    </span>
                  </div>

                  <p className="text-[15px] md:text-sm 
                    text-gray-600 dark:text-gray-300 
                    leading-relaxed 
                    line-clamp-2"
                  >
                    {parsedLinks.map((part, i) => 
                      part.type === 'link' ? (
                        <a
                          key={i}
                          href={part.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sky-600 dark:text-sky-400 
                            active:text-sky-800 md:hover:text-sky-700
                            underline-offset-2 decoration-1
                            px-0.5 -mx-0.5 rounded"
                        >
                          {part.content}
                        </a>
                      ) : (
                        <span key={i}>{part.content}</span>
                      )
                    )}
                    {hasLinks && ' [Has attachments]'}
                  </p>
                </div>

                {/* Mobile-optimized footer */}
                <div className="flex items-center justify-between 
                  mt-3 pt-3
                  border-t border-gray-100 dark:border-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    {/* Mobile-optimized status indicator */}
                    <span className={`inline-flex items-center gap-1.5 
                      text-sm md:text-xs font-medium
                      ${task.status === 'completed'
                        ? 'text-green-600 dark:text-green-400'
                        : overdue
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-sky-600 dark:text-sky-400'}`}
                    >
                      <span className="relative flex h-2.5 w-2.5 md:h-2 md:w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                          ${task.status === 'completed'
                            ? 'bg-green-500'
                            : overdue
                              ? 'bg-red-500'
                              : 'bg-sky-500'}`} 
                        />
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 md:h-2 md:w-2
                          ${task.status === 'completed'
                            ? 'bg-green-500'
                            : overdue
                              ? 'bg-red-500'
                              : 'bg-sky-500'}`}
                        />
                      </span>
                      {task.status === 'completed' ? 'Complete' : overdue ? 'Overdue' : 'In Progress'}
                    </span>
                  </div>

                </div>

                {/* Mobile-only touch feedback */}
                <div className="md:hidden absolute inset-0 rounded-2xl pointer-events-none
                  bg-gray-900/0 active:bg-gray-900/[0.03] dark:active:bg-gray-900/[0.1]
                  transition-colors duration-200" 
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile-optimized modal */}
      {selectedTask && (
        <TaskDetailsPopup
          task={selectedTask}
          tasks={sortedTasks}
          onClose={() => setSelectedTask(null)}
          onDelete={onDeleteTask}
          showDeleteButton={showDeleteButton}
        />
      )}
    </div>
  );
}
