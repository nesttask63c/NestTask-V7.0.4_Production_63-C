import { useState, useMemo, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay, parseISO, isAfter, isBefore, startOfDay, endOfDay, formatDistanceToNow } from 'date-fns';
import { Crown, Calendar, Clock, Tag, CheckCircle2, AlertCircle, BookOpen, FileText, PenTool, FlaskConical, GraduationCap, CalendarDays, Folder, Activity, Building, Users } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { TaskDetailsPopup } from '../components/task/TaskDetailsPopup';
import { MonthlyCalendar } from '../components/MonthlyCalendar';
import type { Task } from '../types';

interface UpcomingPageProps {
  tasks: Task[];
}

export function UpcomingPage() {
  const { user } = useAuth();
  const { tasks: allTasks, loading, error: taskError, updateTask } = useTasks(user?.id);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [isMonthlyCalendarOpen, setIsMonthlyCalendarOpen] = useState(false);
  // Flag to prevent auto-selection of tasks after date change
  const [preventTaskSelection, setPreventTaskSelection] = useState(false);

  // Create a reusable optimized date formatter
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
  };

  // Optimized function to check if two dates represent the same day
  const isSameDayOptimized = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Check for date in URL params when component mounts - optimized version
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get('selectedDate');
      
      if (dateParam) {
        // Parse the date directly from YYYY-MM-DD format
        const [year, month, day] = dateParam.split('-').map(Number);
        
        // Create noon time to avoid timezone issues
        const parsedDate = new Date(year, month - 1, day, 12, 0, 0);
        
        if (!isNaN(parsedDate.getTime())) {
          setSelectedDate(parsedDate);
        }
      }
    } catch (error) {
      console.error('Error parsing date from URL:', error);
    }
    
    // Listen for dateSelected events from Navigation component
    const handleDateSelectedEvent = (e: CustomEvent<{date: Date}>) => {
      const newDate = e.detail.date;
      if (newDate && !isNaN(newDate.getTime())) {
        setSelectedDate(newDate);
        if (process.env.NODE_ENV === 'development') {
          console.log('UpcomingPage: Received dateSelected event', newDate);
        }
      }
    };
    
    // Listen for preventAutoTaskSelect event - this ensures no task is auto-selected
    const handlePreventAutoSelectEvent = (e: CustomEvent<{date: Date}>) => {
      // Clear any selected task when a date is selected from the calendar
      setSelectedTask(null);
      // Set the flag to prevent task selection for a brief period
      setPreventTaskSelection(true);
      // Reset the flag after a delay
      setTimeout(() => {
        setPreventTaskSelection(false);
      }, 1000); // Prevent selection for 1 second
      
      if (process.env.NODE_ENV === 'development') {
        console.log('UpcomingPage: Preventing auto task selection');
      }
    };
    
    window.addEventListener('dateSelected', handleDateSelectedEvent as EventListener);
    window.addEventListener('preventAutoTaskSelect', handlePreventAutoSelectEvent as EventListener);
    
    return () => {
      window.removeEventListener('dateSelected', handleDateSelectedEvent as EventListener);
      window.removeEventListener('preventAutoTaskSelect', handlePreventAutoSelectEvent as EventListener);
    };
  }, []);

  // Update local tasks when allTasks changes
  useEffect(() => {
    if (allTasks) {
      // Type assertion to ensure compatibility
      setTasks(allTasks as any);
    } else {
      setTasks([]);
    }
  }, [allTasks]);

  // Generate week days with current date in middle - memoized and optimized
  const weekDays = useMemo(() => {
    const start = addDays(selectedDate, -3); // Start 3 days before selected date
    const today = new Date();
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      return {
        date,
        day: format(date, 'dd'),
        weekDay: format(date, 'EEE'),
        isSelected: isSameDayOptimized(date, selectedDate),
        isToday: isSameDayOptimized(date, today)
      };
    });
  }, [selectedDate]);

  // Filter tasks for selected date - optimized version
  const filteredTasks = useMemo(() => {
    // Early return if no tasks
    if (!tasks.length) return [];
    
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const selectedDay = selectedDate.getDate();
    
    return tasks.filter(task => {
      try {
        const taskDate = parseISO(task.dueDate);
        return (
          taskDate.getFullYear() === selectedYear &&
          taskDate.getMonth() === selectedMonth &&
          taskDate.getDate() === selectedDay
        );
      } catch (error) {
        return false;
      }
    });
  }, [tasks, selectedDate]);

  // Get task status
  const getTaskStatus = (task: Task) => {
    const dueDate = parseISO(task.dueDate);
    const currentDate = new Date();
    // Compare dates without time to determine if task is overdue
    const isOverdue = isBefore(endOfDay(dueDate), startOfDay(currentDate));

    if (task.status === 'completed') {
      return {
        label: 'Completed',
        color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 ring-green-500/20',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />
      };
    }
    
    if (isOverdue) {
      return {
        label: 'Overdue',
        color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 ring-red-500/20',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        cardStyle: 'border-l-[3px] border-l-red-500 bg-red-50/30 dark:bg-red-900/10'
      };
    }

    return {
      label: 'In Progress',
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 ring-blue-500/20',
      icon: <Clock className="w-3.5 h-3.5" />
    };
  };

  // Get category info with icon and color
  const getCategoryInfo = (category: string) => {
    const categories = {
      task: {
        icon: <BookOpen className="w-3 h-3 md:w-4 md:h-4" />,
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
      },
      presentation: {
        icon: <PenTool className="w-3 h-3 md:w-4 md:h-4" />,
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
      },
      project: {
        icon: <Folder className="w-3 h-3 md:w-4 md:h-4" />,
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
      },
      assignment: {
        icon: <FileText className="w-3 h-3 md:w-4 md:h-4" />,
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
      },
      quiz: {
        icon: <BookOpen className="w-3 h-3 md:w-4 md:h-4" />,
        color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
      },
      'lab-report': {
        icon: <FlaskConical className="w-3 h-3 md:w-4 md:h-4" />,
        color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
      },
      'lab-final': {
        icon: <GraduationCap className="w-3 h-3 md:w-4 md:h-4" />,
        color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      },
      'lab-performance': {
        icon: <Activity className="w-3 h-3 md:w-4 md:h-4" />,
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
      },
      'documents': {
        icon: <FileText className="w-3 h-3 md:w-4 md:h-4" />,
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
      },
      'blc': {
        icon: <Building className="w-3 h-3 md:w-4 md:h-4" />,
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
      },
      'groups': {
        icon: <Users className="w-3 h-3 md:w-4 md:h-4" />,
        color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300'
      },
      'others': {
        icon: <Tag className="w-3 h-3 md:w-4 md:h-4" />,
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
      },
      default: {
        icon: <Tag className="w-3 h-3 md:w-4 md:h-4" />,
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
      }
    };
    return categories[category as keyof typeof categories] || categories.default;
  };

  // Handle task status update
  const handleStatusUpdate = async (taskId: string, newStatus: Task['status']) => {
    try {
      setIsUpdating(true);
      setOperationError(null);

      // Find the task being updated
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (!taskToUpdate) {
        throw new Error('Task not found in current list');
      }

      // Store the original status
      const originalStatus = taskToUpdate.status;

      try {
        // Update the task
        const updatedTask = await updateTask(taskId, { status: newStatus });
        
        // Update local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? updatedTask : task
          )
        );

        // Update selected task if it's the one being updated
        if (selectedTask?.id === taskId) {
          setSelectedTask(updatedTask);
        }
      } catch (error) {
        // Revert to original status on error
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, status: originalStatus } : task
          )
        );
        throw error;
      }
    } catch (error: any) {
      setOperationError('Failed to update task status. Please try again.');
      console.error('Error updating task status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Error Alert */}
      {(taskError || operationError) ? (
        <div className="fixed top-4 right-4 z-50 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-lg animate-fade-in">
          <p className="text-sm font-medium">{taskError || operationError}</p>
        </div>
      ) : (
        // This empty div ensures the error alert space is reserved but not blocking interactions
        <div className="fixed top-4 right-4 z-50 pointer-events-none" style={{ opacity: 0 }}></div>
      )}

      {/* Loading Overlay */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl animate-scale-in">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Updating task...
            </p>
          </div>
        </div>
      )}

      {/* Calendar Strip */}
      <div className="max-w-full md:max-w-5xl mx-auto px-2 md:px-6 mb-6">
        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-4 py-3">
          <button 
            onClick={() => setSelectedDate(new Date())}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all duration-200"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></div>
            Today
          </button>

          <span 
            className="text-sm md:text-base font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            onClick={() => setIsMonthlyCalendarOpen(true)}
          >
            {format(selectedDate, 'MMMM yyyy')}
          </span>

          <div className="flex items-center bg-gray-100/80 dark:bg-gray-800/80 rounded-lg p-1">
            <button
              onClick={() => {
                const newDate = addDays(selectedDate, -7);
                setSelectedDate(newDate);
              }}
              className="p-1.5 rounded-md text-gray-600 hover:text-blue-600 hover:bg-white dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-700 transition-all duration-200"
              aria-label="Previous week"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={() => {
                const newDate = addDays(selectedDate, 7);
                setSelectedDate(newDate);
              }}
              className="p-1.5 rounded-md text-gray-600 hover:text-blue-600 hover:bg-white dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-700 transition-all duration-200"
              aria-label="Next week"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Date Boxes */}
        <div className="grid grid-cols-7 gap-2 md:gap-3 lg:gap-4 px-0 md:px-4">
          {weekDays.map((day) => (
            <button
              key={day.day}
              onClick={() => setSelectedDate(day.date)}
              className={`
                relative group
                flex flex-col items-center justify-center
                w-full aspect-square md:aspect-[3/4]
                p-1.5 md:p-3 lg:p-4 rounded-xl 
                border transition-all duration-300
                ${day.isSelected
                  ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 border-blue-400/50 shadow-md shadow-blue-500/20 dark:shadow-blue-600/20 scale-[1.02] -translate-y-0.5 md:scale-105'
                  : day.isToday
                  ? 'bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50 border-blue-200/70 dark:from-blue-900/50 dark:via-indigo-900/40 dark:to-purple-900/50 dark:border-blue-700/50'
                  : 'bg-white/90 dark:bg-gray-800/90 border-gray-200/50 dark:border-gray-700/50'
                }
                hover:shadow-md hover:-translate-y-0.5
                hover:border-blue-300/70 dark:hover:border-blue-600/70
                active:scale-95 touch-manipulation
                md:hover:shadow-lg md:hover:-translate-y-1
              `}
            >
              {/* Weekday */}
              <span className={`
                text-xs md:text-sm font-semibold tracking-wide
                transition-colors duration-200
                ${day.isSelected
                  ? 'text-blue-100'
                  : day.isToday
                  ? 'text-blue-600/90 dark:text-blue-400'
                  : 'text-gray-500 group-hover:text-blue-500 dark:text-gray-400 dark:group-hover:text-blue-400'
                }
                mb-1 md:mb-2
              `}>
                {day.weekDay}
              </span>

              {/* Day Number */}
              <span className={`
                text-lg md:text-3xl lg:text-4xl font-bold 
                transition-colors duration-200
                ${day.isSelected
                  ? 'text-white'
                  : day.isToday
                  ? 'text-blue-600/90 dark:text-blue-400'
                  : 'text-gray-700 group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400'
                }
              `}>
                {day.day}
              </span>

              {/* Today Indicator */}
              {day.isToday && !day.isSelected && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 animate-pulse shadow-lg shadow-blue-500/50"></div>
                </div>
              )}

              {/* Selected Indicator */}
              {day.isSelected && (
                <div className="absolute inset-0 rounded-xl ring-2 ring-blue-400/40 dark:ring-blue-500/40 animate-pulse"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List with Enhanced Cards */}
      <div className="px-4 md:max-w-4xl lg:max-w-5xl md:mx-auto pb-8">
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => {
              const status = getTaskStatus(task);
              const categoryInfo = getCategoryInfo(task.category);
              const dueDate = parseISO(task.dueDate);
              const currentDate = new Date();
              // Compare dates without time to determine if task is overdue
              const isOverdue = isBefore(endOfDay(dueDate), startOfDay(currentDate));
              
              return (
                <div
                  key={task.id}
                  onClick={() => {
                    // Only allow task selection if not prevented
                    if (!preventTaskSelection) {
                      setSelectedTask(task);
                    }
                  }}
                  className={`
                    group h-full bg-white dark:bg-gray-800/90 rounded-lg
                    shadow-sm hover:shadow-lg
                    border border-gray-100 dark:border-gray-700/50
                    hover:border-blue-200 dark:hover:border-blue-600/50
                    relative overflow-hidden ${preventTaskSelection ? '' : 'cursor-pointer'}
                    transition-all duration-200
                    transform ${preventTaskSelection ? '' : 'hover:-translate-y-1'}
                    flex flex-col
                    ${task.status === 'completed' 
                      ? 'opacity-80 hover:opacity-95' 
                      : isOverdue
                        ? 'border-l-[3px] border-l-red-500' 
                        : ''
                    }
                  `}
                >
                  <div className="p-4 flex-grow flex flex-col">
                    {/* Header Section without Category Tag */}
                    <div className="flex items-start mb-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <h3 className={`
                          text-base font-semibold leading-tight truncate
                          ${task.status === 'completed'
                            ? 'text-gray-500 dark:text-gray-400 line-through'
                            : isOverdue
                              ? 'text-red-800 dark:text-red-300'
                              : 'text-gray-800 dark:text-gray-100'
                          }
                        `}>
                          {task.name}
                        </h3>
                        {task.isAdminTask && (
                          <div className="flex-shrink-0 p-0.5 mt-0.5">
                            <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className={`
                      text-sm leading-relaxed line-clamp-2 mb-4 flex-grow
                      ${task.status === 'completed'
                        ? 'text-gray-500 dark:text-gray-400'
                        : isOverdue
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-gray-600 dark:text-gray-300'
                      }
                    `}>
                      {task.description}
                    </p>

                    {/* Footer Section */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50">
                      {/* Due Date */}
                      <div className="flex items-center gap-1.5">
                        <Calendar className={`
                          w-3.5 h-3.5
                          ${isOverdue && !task.status 
                            ? 'text-red-500 dark:text-red-400' 
                            : 'text-gray-500 dark:text-gray-400'
                          }`} 
                        />
                        <span className={`
                          text-xs font-medium
                          ${isOverdue && !task.status 
                            ? 'text-red-500 dark:text-red-400' 
                            : 'text-gray-500 dark:text-gray-400'
                          }`
                        }>
                          Due: {format(dueDate, 'MMM d')}
                        </span>
                      </div>
                      
                      {/* Status Badge and Category Tag */}
                      <div className="flex items-center gap-2">
                        {/* Status Badge - only show for Completed or Overdue */}
                        {(task.status === 'completed' || isOverdue) && (
                          <span className={`
                            inline-flex items-center gap-1
                            px-2 py-0.5
                            text-[10px] font-medium
                            rounded-full
                            ${task.status === 'completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            }
                            ${isOverdue && task.status !== 'completed' ? 'animate-pulse' : ''}
                          `}>
                            {status.icon}
                            <span>{status.label}</span>
                          </span>
                        )}
                        
                        {/* Category Tag - Professional Design */}
                        <span className={`
                          inline-flex items-center gap-1.5
                          px-2.5 py-0.5
                          text-[10px] font-medium tracking-wide
                          rounded-md border
                          ${categoryInfo.color.replace('bg-', 'bg-opacity-75 bg-').replace('text-', 'text-opacity-90 text-')}
                          transition-all duration-200
                          shadow-sm backdrop-blur-sm
                          border-opacity-30
                          ${categoryInfo.color.includes('blue') ? 'border-blue-200 dark:border-blue-700' :
                            categoryInfo.color.includes('purple') ? 'border-purple-200 dark:border-purple-700' :
                            categoryInfo.color.includes('emerald') ? 'border-emerald-200 dark:border-emerald-700' :
                            categoryInfo.color.includes('indigo') ? 'border-indigo-200 dark:border-indigo-700' :
                            categoryInfo.color.includes('green') ? 'border-green-200 dark:border-green-700' :
                            categoryInfo.color.includes('red') ? 'border-red-200 dark:border-red-700' :
                            categoryInfo.color.includes('yellow') ? 'border-yellow-200 dark:border-yellow-700' :
                            categoryInfo.color.includes('amber') ? 'border-amber-200 dark:border-amber-700' :
                            categoryInfo.color.includes('sky') ? 'border-sky-200 dark:border-sky-700' :
                            'border-gray-200 dark:border-gray-700'}
                          hover:shadow-md group-hover:shadow-md
                        `}>
                          <div className="flex-shrink-0">
                            {categoryInfo.icon}
                          </div>
                          <span className="capitalize whitespace-nowrap">
                            {task.category.replace('-', ' ')}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 mt-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-lg text-gray-900 dark:text-gray-100 font-medium">No tasks for {format(selectedDate, 'MMMM d')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isSameDay(selectedDate, new Date()) 
                ? "You're all caught up for today!" 
                : "Nothing scheduled for this day"}
            </p>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsPopup
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusUpdate={handleStatusUpdate}
          isUpdating={isUpdating}
        />
      )}

      {/* Monthly Calendar */}
      <MonthlyCalendar
        isOpen={isMonthlyCalendarOpen}
        onClose={() => setIsMonthlyCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          // Set selected date directly with debugging
          console.log('Date from calendar before setting:', date);
          
          // Ensure the date is valid
          if (!(date instanceof Date) || isNaN(date.getTime())) {
            console.error('Invalid date received from calendar:', date);
            return;
          }
          
          // Clear any selected task to prevent auto-selection
          setSelectedTask(null);
          
          // Set the flag to prevent task selection for a brief period
          setPreventTaskSelection(true);
          // Reset the flag after a delay
          setTimeout(() => {
            setPreventTaskSelection(false);
          }, 1000); // Prevent selection for 1 second
          
          setSelectedDate(date);
          setIsMonthlyCalendarOpen(false);
          
          // Update URL parameter efficiently
          try {
            const params = new URLSearchParams(window.location.search);
            params.set('selectedDate', formatDate(date));
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
          } catch (error) {
            console.error('Error setting date parameter:', error);
          }
        }}
        tasks={tasks}
      />
    </div>
  );
}
