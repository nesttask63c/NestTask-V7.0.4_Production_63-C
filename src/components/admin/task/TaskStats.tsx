import { useState, useEffect } from 'react';
import { BarChart2, PieChart, Clock, CheckCircle, ListTodo, Calendar, TrendingUp, Archive, AlertCircle } from 'lucide-react';
import type { Task } from '../../../types';

interface TaskStatsProps {
  tasks: Task[];
}

export function TaskStats({ tasks }: TaskStatsProps) {
  const [activeChart, setActiveChart] = useState<'status' | 'category' | 'timeline'>('status');
  const [animateChart, setAnimateChart] = useState(false);
  
  // Trigger animation when chart changes
  useEffect(() => {
    setAnimateChart(false);
    const timer = setTimeout(() => {
      setAnimateChart(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [activeChart]);
  
  // Calculate statistics
  const statusStats = {
    todo: tasks.filter(task => task.status === 'my-tasks' && !isOverdue(task.dueDate)).length,
    inProgress: tasks.filter(task => task.status === 'in-progress' && !isOverdue(task.dueDate)).length,
    completed: tasks.filter(task => task.status === 'completed').length,
    overdue: tasks.filter(task => isOverdue(task.dueDate) && task.status !== 'completed').length
  };

  // Helper function to check if a task is overdue
  function isOverdue(dueDate: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  }

  // Get unique categories and count tasks in each
  const categoryStats: Record<string, number> = {};
  tasks.forEach(task => {
    if (!categoryStats[task.category]) {
      categoryStats[task.category] = 0;
    }
    categoryStats[task.category]++;
  });

  // Calculate timeline statistics - improved date handling
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const timelineStats = {
    today: tasks.filter(task => {
      try {
        const dueDate = new Date(task.dueDate);
        return dueDate.toDateString() === today.toDateString();
      } catch (e) {
        console.error("Invalid date format:", task.dueDate);
        return false;
      }
    }).length,
    tomorrow: tasks.filter(task => {
      try {
        const dueDate = new Date(task.dueDate);
        return dueDate.toDateString() === tomorrow.toDateString();
      } catch (e) {
        return false;
      }
    }).length,
    thisWeek: tasks.filter(task => {
      try {
        const dueDate = new Date(task.dueDate);
        return dueDate > today && dueDate < nextWeek;
      } catch (e) {
        return false;
      }
    }).length,
    later: tasks.filter(task => {
      try {
        const dueDate = new Date(task.dueDate);
        return dueDate >= nextWeek;
      } catch (e) {
        return false;
      }
    }).length,
    overdue: tasks.filter(task => {
      try {
        const dueDate = new Date(task.dueDate);
        return dueDate < today && task.status !== 'completed';
      } catch (e) {
        return false;
      }
    }).length,
  };

  // Get category name display versions
  const getCategoryName = (key: string): string => {
    const map: Record<string, string> = {
      'assignment': 'Assignment',
      'blc': 'BLC',
      'documents': 'Documents',
      'final-exam': 'Final Exam',
      'groups': 'Groups',
      'lab-final': 'Lab Final',
      'lab-performance': 'Lab Performance',
      'lab-report': 'Lab Report',
      'midterm': 'Midterm',
      'presentation': 'Presentation',
      'project': 'Project',
      'quiz': 'Quiz',
      'task': 'Task',
      'others': 'Others'
    };
    return map[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');
  };

  // Calculate percentages for the chart
  const getPercentage = (value: number) => {
    if (tasks.length === 0) return 0;
    return Math.round((value / tasks.length) * 100);
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'todo': 'bg-blue-500',
      'inProgress': 'bg-yellow-500',
      'completed': 'bg-green-500',
      'overdue': 'bg-red-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  const getTimelineColor = (timeline: string) => {
    const colorMap: Record<string, string> = {
      'today': 'bg-red-500',
      'tomorrow': 'bg-orange-500',
      'thisWeek': 'bg-yellow-500',
      'later': 'bg-blue-500',
      'overdue': 'bg-purple-500',
    };
    return colorMap[timeline] || 'bg-gray-500';
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-emerald-500',
      'bg-lime-500',
    ];
    return colors[index % colors.length];
  };

  // Calculate completion trend
  const completionRate = tasks.length > 0 
    ? Math.round((statusStats.completed / tasks.length) * 100) 
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-lg">
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white">Task Analytics</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {tasks.length} total task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100/80 dark:bg-gray-700/50 p-0.5 rounded-lg">
          <button 
            className={`p-1.5 rounded-md transition-all duration-150 ${
              activeChart === 'status' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveChart('status')}
            title="Status Distribution"
          >
            <PieChart className="w-4 h-4" />
          </button>
          <button 
            className={`p-1.5 rounded-md transition-all duration-150 ${
              activeChart === 'category' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveChart('category')}
            title="Category Distribution"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
          <button 
            className={`p-1.5 rounded-md transition-all duration-150 ${
              activeChart === 'timeline' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveChart('timeline')}
            title="Timeline Distribution"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-10">
            <Archive className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No tasks available</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create tasks to see analytics</p>
          </div>
        ) : (
          <div className={`transition-opacity duration-300 ${animateChart ? 'opacity-100' : 'opacity-0'}`}>
            {/* Status Chart */}
            {activeChart === 'status' && (
              <div className="space-y-3 xs:space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300">Status Distribution</h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 py-0.5 xs:py-1 px-1.5 xs:px-2 rounded-md">
                    <span className="text-[10px] xs:text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center">
                      <TrendingUp className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-0.5 xs:mr-1" />
                      {completionRate}% Complete
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center h-40 sm:h-44 md:h-48 relative">
                  {/* Professional donut chart representation */}
                  <div className="relative w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 md:w-36 md:h-36">
                    <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md" aria-hidden="true">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="15"
                        className="dark:stroke-gray-700"
                      />
                      
                      {/* Dynamic segments - using stroke-dasharray and stroke-dashoffset for precise control */}
                      {tasks.length > 0 && (
                        <>
                          {/* To Do segment */}
                          {statusStats.todo > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke="url(#status-blueGradient)" // blue gradient
                              strokeWidth="15"
                              strokeDasharray={`${statusStats.todo / tasks.length * 238.8} 238.8`}
                              strokeDashoffset="0"
                              transform="rotate(-90 50 50)"
                              className="transition-all duration-700 ease-out"
                              style={{ strokeDasharray: animateChart ? `${statusStats.todo / tasks.length * 238.8} 238.8` : '0 238.8' }}
                            />
                          )}
                          
                          {/* In Progress segment */}
                          {statusStats.inProgress > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke="url(#status-yellowGradient)" // yellow gradient
                              strokeWidth="15"
                              strokeDasharray={`${statusStats.inProgress / tasks.length * 238.8} 238.8`}
                              strokeDashoffset={`${-1 * (statusStats.todo / tasks.length * 238.8)}`}
                              transform="rotate(-90 50 50)"
                              className="transition-all duration-700 ease-out"
                              style={{ 
                                strokeDasharray: animateChart ? `${statusStats.inProgress / tasks.length * 238.8} 238.8` : '0 238.8',
                                strokeDashoffset: animateChart ? `${-1 * (statusStats.todo / tasks.length * 238.8)}` : '0'
                              }}
                            />
                          )}
                          
                          {/* Overdue segment */}
                          {statusStats.overdue > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke="url(#status-redGradient)" // red gradient
                              strokeWidth="15"
                              strokeDasharray={`${statusStats.overdue / tasks.length * 238.8} 238.8`}
                              strokeDashoffset={`${-1 * ((statusStats.todo + statusStats.inProgress) / tasks.length * 238.8)}`}
                              transform="rotate(-90 50 50)"
                              className="transition-all duration-700 ease-out"
                              style={{ 
                                strokeDasharray: animateChart ? `${statusStats.overdue / tasks.length * 238.8} 238.8` : '0 238.8',
                                strokeDashoffset: animateChart ? `${-1 * ((statusStats.todo + statusStats.inProgress) / tasks.length * 238.8)}` : '0'
                              }}
                            />
                          )}
                          
                          {/* Completed segment */}
                          {statusStats.completed > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke="url(#status-greenGradient)" // green gradient
                              strokeWidth="15"
                              strokeDasharray={`${statusStats.completed / tasks.length * 238.8} 238.8`}
                              strokeDashoffset={`${-1 * ((statusStats.todo + statusStats.inProgress + statusStats.overdue) / tasks.length * 238.8)}`}
                              transform="rotate(-90 50 50)"
                              className="transition-all duration-700 ease-out"
                              style={{ 
                                strokeDasharray: animateChart ? `${statusStats.completed / tasks.length * 238.8} 238.8` : '0 238.8',
                                strokeDashoffset: animateChart ? `${-1 * ((statusStats.todo + statusStats.inProgress + statusStats.overdue) / tasks.length * 238.8)}` : '0'
                              }}
                            />
                          )}
                        </>
                      )}
                      
                      {/* Define gradients with unique IDs to prevent conflicts */}
                      <defs>
                        <linearGradient id="status-blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                        <linearGradient id="status-yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="status-greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="status-redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                      </defs>
                    </svg>
                    
                    {/* Center content */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center bg-white dark:bg-gray-800 rounded-full w-14 h-14 xs:w-16 xs:h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 flex flex-col items-center justify-center shadow-inner">
                        <span className="block text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{tasks.length}</span>
                        <span className="text-[8px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Tasks</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status legend and details */}
                <div className="grid grid-cols-4 gap-2 xs:gap-3 mt-2">
                  <div className="flex flex-col items-center p-1.5 xs:p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="bg-blue-500 w-2.5 h-2.5 xs:w-3 xs:h-3 rounded-full mb-0.5 xs:mb-1"></div>
                    <span className="text-[10px] xs:text-xs font-medium text-gray-700 dark:text-gray-300 text-center">To Do</span>
                    <span className="text-xs xs:text-sm font-bold text-gray-800 dark:text-white">{statusStats.todo}</span>
                    <span className="text-[8px] xs:text-[10px] text-blue-600 dark:text-blue-400">{getPercentage(statusStats.todo)}%</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-1.5 xs:p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="bg-yellow-500 w-2.5 h-2.5 xs:w-3 xs:h-3 rounded-full mb-0.5 xs:mb-1"></div>
                    <span className="text-[10px] xs:text-xs font-medium text-gray-700 dark:text-gray-300 text-center">In Progress</span>
                    <span className="text-xs xs:text-sm font-bold text-gray-800 dark:text-white">{statusStats.inProgress}</span>
                    <span className="text-[8px] xs:text-[10px] text-yellow-600 dark:text-yellow-400">{getPercentage(statusStats.inProgress)}%</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-1.5 xs:p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="bg-red-500 w-2.5 h-2.5 xs:w-3 xs:h-3 rounded-full mb-0.5 xs:mb-1"></div>
                    <span className="text-[10px] xs:text-xs font-medium text-gray-700 dark:text-gray-300 text-center">Due Tasks</span>
                    <span className="text-xs xs:text-sm font-bold text-gray-800 dark:text-white">{statusStats.overdue}</span>
                    <span className="text-[8px] xs:text-[10px] text-red-600 dark:text-red-400">{getPercentage(statusStats.overdue)}%</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-1.5 xs:p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="bg-green-500 w-2.5 h-2.5 xs:w-3 xs:h-3 rounded-full mb-0.5 xs:mb-1"></div>
                    <span className="text-[10px] xs:text-xs font-medium text-gray-700 dark:text-gray-300 text-center">Completed</span>
                    <span className="text-xs xs:text-sm font-bold text-gray-800 dark:text-white">{statusStats.completed}</span>
                    <span className="text-[8px] xs:text-[10px] text-green-600 dark:text-green-400">{getPercentage(statusStats.completed)}%</span>
                  </div>
                </div>

                {/* Completion meter */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{completionRate}% Complete</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full relative overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-yellow-500 to-green-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: animateChart ? `${completionRate}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Category Chart */}
            {activeChart === 'category' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Category Distribution</h4>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {Object.keys(categoryStats).length} categories
                  </div>
                </div>
                
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                  {Object.entries(categoryStats)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, count], index) => (
                      <div key={category} className="bg-gray-50 dark:bg-gray-800/80 p-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${getCategoryColor(index)} mr-2`}></div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[170px]">
                              {getCategoryName(category)}
                            </span>
                          </div>
                          <div className="flex items-center bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded-md shadow-sm">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-1">{count}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">({getPercentage(count)}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getCategoryColor(index)} transition-all duration-1000 ease-out`} 
                            style={{ width: animateChart ? `${getPercentage(count)}%` : '0%' }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Timeline Chart */}
            {activeChart === 'timeline' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date Distribution</h4>
                  {timelineStats.overdue > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 py-1 px-2 rounded-md">
                      <span className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {timelineStats.overdue} Overdue
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-red-500 dark:text-red-400 mr-1.5" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Today</span>
                      </div>
                      <span className="text-lg font-bold text-gray-800 dark:text-white">{timelineStats.today}</span>
                    </div>
                    <div className="w-full bg-red-200/50 dark:bg-red-900/30 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-1000 ease-out" 
                        style={{ width: animateChart ? `${getPercentage(timelineStats.today)}%` : '0%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-orange-500 dark:text-orange-400 mr-1.5" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Tomorrow</span>
                      </div>
                      <span className="text-lg font-bold text-gray-800 dark:text-white">{timelineStats.tomorrow}</span>
                    </div>
                    <div className="w-full bg-orange-200/50 dark:bg-orange-900/30 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-1000 ease-out" 
                        style={{ width: animateChart ? `${getPercentage(timelineStats.tomorrow)}%` : '0%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-yellow-500 dark:text-yellow-400 mr-1.5" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">This Week</span>
                      </div>
                      <span className="text-lg font-bold text-gray-800 dark:text-white">{timelineStats.thisWeek}</span>
                    </div>
                    <div className="w-full bg-yellow-200/50 dark:bg-yellow-900/30 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-1000 ease-out" 
                        style={{ width: animateChart ? `${getPercentage(timelineStats.thisWeek)}%` : '0%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-1.5" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Later</span>
                      </div>
                      <span className="text-lg font-bold text-gray-800 dark:text-white">{timelineStats.later}</span>
                    </div>
                    <div className="w-full bg-blue-200/50 dark:bg-blue-900/30 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out" 
                        style={{ width: animateChart ? `${getPercentage(timelineStats.later)}%` : '0%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-900/30 shadow-sm sm:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-purple-500 dark:text-purple-400 mr-1.5" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Overdue</span>
                      </div>
                      <span className="text-lg font-bold text-gray-800 dark:text-white">{timelineStats.overdue}</span>
                    </div>
                    <div className="w-full bg-purple-200/50 dark:bg-purple-900/30 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-1000 ease-out" 
                        style={{ width: animateChart ? `${getPercentage(timelineStats.overdue)}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* CSS for custom scrollbar and xs breakpoint */}
      <style>
        {`
        @media (min-width: 480px) {
          .xs\\:space-y-4 {
            margin-top: 1rem;
          }
          .xs\\:w-28 {
            width: 7rem;
          }
          .xs\\:h-28 {
            height: 7rem;
          }
          .xs\\:w-16 {
            width: 4rem;
          }
          .xs\\:h-16 {
            height: 4rem;
          }
          .xs\\:text-lg {
            font-size: 1.125rem;
            line-height: 1.75rem;
          }
          .xs\\:p-2 {
            padding: 0.5rem;
          }
          .xs\\:gap-3 {
            gap: 0.75rem;
          }
          .xs\\:mb-1 {
            margin-bottom: 0.25rem;
          }
          .xs\\:text-xs {
            font-size: 0.75rem;
            line-height: 1rem;
          }
          .xs\\:text-sm {
            font-size: 0.875rem;
            line-height: 1.25rem;
          }
          .xs\\:w-3 {
            width: 0.75rem;
          }
          .xs\\:h-3 {
            height: 0.75rem;
          }
          .xs\\:py-1 {
            padding-top: 0.25rem;
            padding-bottom: 0.25rem;
          }
          .xs\\:px-2 {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
          .xs\\:mr-1 {
            margin-right: 0.25rem;
          }
          .xs\\:text-\\[10px\\] {
            font-size: 10px;
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        `}
      </style>
    </div>
  );
} 