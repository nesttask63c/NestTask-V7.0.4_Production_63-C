import { useState, useEffect } from 'react';
import { Search, Trash2, CheckCircle, Clock, ListTodo, Edit2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TaskEditModal } from './TaskEditModal';
import type { Task } from '../../../types';

interface TaskTableProps {
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, task: Partial<Task>) => void;
}

export function TaskTable({ tasks, onDeleteTask, onUpdateTask }: TaskTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10);
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Check viewport width on mount and window resize
  useEffect(() => {
    const checkViewport = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Initial check
    checkViewport();
    
    // Add event listener
    window.addEventListener('resize', checkViewport);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkViewport);
  }, []);
  
  // Reset current page when tasks change
  useEffect(() => {
    setCurrentPage(1);
  }, [tasks.length]);

  // Filter tasks based on search term
  const filteredTasks = tasks.filter(task => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      task.name.toLowerCase().includes(term) ||
      task.category.toLowerCase().includes(term) ||
      task.description.toLowerCase().includes(term)
    );
  });
  
  // Calculate pagination
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  
  // Change page
  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };
  
  // Utility functions for status labels and icons
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'my-tasks': return 'To Do';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'my-tasks': return <ListTodo className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };
  
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'my-tasks': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };
  
  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Check if a date is overdue
  const isOverdue = (dateString: string, status: string): boolean => {
    if (status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // Truncate text for mobile view cards
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Tasks</h3>
        
        {/* Search Bar */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {tasks.length === 0 ? 'No tasks available' : 'No tasks match your search'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile card view */}
          {isMobileView ? (
            <div className="p-3">
              <div className="space-y-3">
                {currentTasks.map(task => (
                  <div 
                    key={task.id}
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white break-words pr-2">
                        {truncateText(task.name, 40)}
                      </h4>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)} shrink-0`}>
                        {getStatusIcon(task.status)}
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">Category:</span>
                        <span className="text-gray-700 dark:text-gray-300 capitalize">{task.category.replace(/-/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">Due Date:</span>
                        <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-300'}>
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => setEditingTask(task)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/10 rounded-lg transition-colors flex items-center gap-1 text-sm"
                        aria-label={`Edit ${task.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => setTaskToDelete(task.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 rounded-lg transition-colors flex items-center gap-1 text-sm"
                        aria-label={`Delete ${task.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Desktop table view */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Task Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentTasks.map(task => (
                    <tr 
                      key={task.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {task.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {task.category.replace(/-/g, ' ')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                          {formatDate(task.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          {getStatusLabel(task.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingTask(task)}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label={`Edit ${task.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTaskToDelete(task.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label={`Delete ${task.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Responsive Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-center sm:text-left text-sm text-gray-700 dark:text-gray-300">
                <p>
                  Showing <span className="font-medium">{indexOfFirstTask + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastTask, filteredTasks.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredTasks.length}</span> results
                </p>
              </div>
              
              <div className="flex items-center justify-center sm:justify-end gap-1">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${
                    currentPage === 1
                      ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  aria-label="First page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <polyline points="11 17 6 12 11 7"></polyline>
                    <polyline points="18 17 13 12 18 7"></polyline>
                  </svg>
                </button>
                
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${
                    currentPage === 1
                      ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="hidden xs:flex items-center">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    
                    // Show current page, one page before and after, first and last page
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => goToPage(pageNumber)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                            pageNumber === currentPage
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
                              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      (pageNumber === 2 && currentPage > 3) ||
                      (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      // Render ellipsis
                      return (
                        <span
                          key={pageNumber}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400"
                        >
                          ...
                        </span>
                      );
                    } else {
                      return null;
                    }
                  })}
                </div>
                
                <span className="xs:hidden text-sm text-gray-500 dark:text-gray-400">
                  {currentPage} / {totalPages}
                </span>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${
                    currentPage === totalPages
                      ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${
                    currentPage === totalPages
                      ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Last page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <polyline points="13 17 18 12 13 7"></polyline>
                    <polyline points="6 17 11 12 6 7"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdate={(updates) => {
            onUpdateTask(editingTask.id, updates);
            setEditingTask(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (taskToDelete) {
                    onDeleteTask(taskToDelete);
                    setTaskToDelete(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}