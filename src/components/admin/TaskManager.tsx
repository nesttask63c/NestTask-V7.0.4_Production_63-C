import { useState, useEffect } from 'react';
import { TaskForm } from './task/TaskForm';
import { TaskTable } from './task/TaskTable';
import { TaskStats } from './task/TaskStats';
import { 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Download,
  Search,
  X
} from 'lucide-react';
import type { Task } from '../../types';
import type { NewTask } from '../../types/task';

interface TaskManagerProps {
  tasks: Task[];
  onCreateTask: (task: NewTask) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  showTaskForm?: boolean;
}

export function TaskManager({ 
  tasks, 
  onCreateTask, 
  onDeleteTask, 
  onUpdateTask,
  showTaskForm: initialShowTaskForm = false
}: TaskManagerProps) {
  const [showTaskForm, setShowTaskForm] = useState(initialShowTaskForm);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate' | 'name' | 'category'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Update showTaskForm when the prop changes
  useEffect(() => {
    setShowTaskForm(initialShowTaskForm);
  }, [initialShowTaskForm]);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Category filter
    if (categoryFilter !== 'all' && task.category !== categoryFilter) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        task.name.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'dueDate') {
      comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'category') {
      comparison = a.category.localeCompare(b.category);
    } else if (sortBy === 'createdAt') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Export tasks to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Due Date', 'Status', 'Description'];
    
    // Format task data for CSV
    const csvData = sortedTasks.map(task => [
      `"${task.name.replace(/"/g, '""')}"`, // Escape double quotes
      `"${task.category.replace(/"/g, '""')}"`,
      `"${new Date(task.dueDate).toLocaleDateString()}"`,
      `"${task.status === 'my-tasks' ? 'To Do' : 
          task.status === 'in-progress' ? 'In Progress' : 'Completed'}"`,
      `"${task.description.replace(/"/g, '""')}"`
    ]);
    
    // Add headers
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <button
            className="flex-1 sm:flex-none px-3 py-2.5 sm:py-2 sm:px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base font-medium shadow-sm whitespace-nowrap"
            onClick={() => setShowTaskForm(!showTaskForm)}
          >
            {showTaskForm ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
            {showTaskForm ? 'Hide Form' : 'Create Task'}
          </button>
          
          <button
            className={`
              flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm sm:text-base
              ${showFilters ? 
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}
            `}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            <span className="sm:inline">Filters</span>
          </button>
          
          <div className="relative flex-1 sm:flex-none group">
            <button
              className="w-full px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
              <span className="sm:inline">Sort</span>
            </button>
            
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden z-10 border border-gray-200 dark:border-gray-700 hidden group-hover:block group-focus-within:block">
              <div className="p-2">
                <button
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    sortBy === 'createdAt' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSortBy('createdAt')}
                >
                  Creation Date
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    sortBy === 'dueDate' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSortBy('dueDate')}
                >
                  Due Date
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    sortBy === 'name' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSortBy('name')}
                >
                  Task Name
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    sortBy === 'category' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSortBy('category')}
                >
                  Category
                </button>
              </div>
            </div>
          </div>
          
          <button
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
            onClick={exportToCSV}
          >
            <Download className="w-4 h-4" />
            <span className="sm:inline">Export</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 sm:p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Filter Tasks</h3>
            <button 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              onClick={() => setShowFilters(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">All Categories</option>
                <option value="assignment">Assignment</option>
                <option value="blc">BLC</option>
                <option value="documents">Documents</option>
                <option value="final-exam">Final Exam</option>
                <option value="groups">Groups</option>
                <option value="lab-final">Lab Final</option>
                <option value="lab-performance">Lab Performance</option>
                <option value="lab-report">Lab Report</option>
                <option value="midterm">Midterm</option>
                <option value="presentation">Presentation</option>
                <option value="project">Project</option>
                <option value="quiz">Quiz</option>
                <option value="task">Task</option>
                <option value="others">Others</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="my-tasks">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => {
                setCategoryFilter('all');
                setStatusFilter('all');
                setSearchTerm('');
                setSortBy('createdAt');
                setSortOrder('desc');
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {showTaskForm && (
        <TaskForm onSubmit={onCreateTask} />
      )}
      
      {/* Task Analytics - moved to appear after the task form */}
      <div className="mb-6">
        <TaskStats tasks={tasks} />
      </div>

      {/* Task Table */}
      <div>
        <TaskTable 
          tasks={sortedTasks} 
          onDeleteTask={onDeleteTask} 
          onUpdateTask={onUpdateTask} 
        />
      </div>
    </div>
  );
} 