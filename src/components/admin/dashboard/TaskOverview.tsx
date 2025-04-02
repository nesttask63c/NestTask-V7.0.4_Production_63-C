import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical, MessageSquare, Users, Edit, Calendar, CheckCircle, XCircle, Pencil, AlertCircle } from 'lucide-react';
import type { Task } from '../../../types';
import { updateTask } from '../../../services/taskService';

interface TaskOverviewProps {
  tasks: Task[];
  onTaskUpdated?: (updatedTask: Task) => void;
}

export function TaskOverview({ tasks: initialTasks, onTaskUpdated }: TaskOverviewProps) {
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toLocaleDateString('en-US', { month: 'short' }));
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskData, setEditingTaskData] = useState<Partial<Task>>({});
  const [showEditSuccess, setShowEditSuccess] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Update local tasks when props change
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);
  
  // Format the current date for display (Sep 14, 2024)
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Generate days for the calendar (5 days centered around the selected date)
  const generateCalendarDays = () => {
    const days = [];
    const selected = new Date(currentDate);
    
    // Generate 2 days before, current day, and 2 days after
    for (let i = -2; i <= 2; i++) {
      const date = new Date(selected);
      date.setDate(selected.getDate() + i);
      
      const dayNum = date.getDate();
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const isSelected = i === 0;
      
      days.push({ date, dayNum, dayName, isSelected });
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  // Navigate to previous/next day
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };
  
  // Filter tasks for the selected day
  const getTasksForSelectedDay = () => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === currentDate.toDateString();
    }).sort((a, b) => {
      // Sort by status (in-progress first, then my-tasks, then completed)
      const statusOrder = { 'in-progress': 0, 'my-tasks': 1, 'completed': 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  };
  
  const selectedDayTasks = getTasksForSelectedDay();
  
  // Calculate days remaining for a task
  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    
    // Reset hours to get accurate day calculation
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Handle task edit click
  const handleEditClick = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskData({
      name: task.name,
      status: task.status,
      dueDate: task.dueDate,
      description: task.description,
      category: task.category
    });
  };

  // Handle task update fields
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingTaskData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save task changes
  const handleSaveEdit = async (taskId: string) => {
    try {
      // Optimistically update the UI
      const updatedTaskData = {
        ...editingTaskData
      } as Task;
      
      // Update the local tasks state immediately for responsive UI
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, ...updatedTaskData } : task
        )
      );
      
      // Send update to the server
      const result = await updateTask(taskId, editingTaskData);
      
      // Reset states
      setEditingTaskId(null);
      setShowEditSuccess(true);
      setTimeout(() => setShowEditSuccess(false), 3000);
      
      // Notify parent component if callback exists
      if (onTaskUpdated && result) {
        onTaskUpdated(result);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setEditError('Failed to update task. Please try again.');
      setTimeout(() => setEditError(null), 3000);
      
      // Revert to original data if there was an error
      setTasks(initialTasks);
    }
  };

  // Cancel task edit
  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskData({});
  };

  // Get task status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 text-xs rounded-full">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs rounded-full">Completed</span>;
      default:
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs rounded-full">To Do</span>;
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks Overview</h2>
        
        {/* Month selector dropdown */}
        <div className="relative">
          <select 
            value={currentMonth}
            onChange={(e) => {
              setCurrentMonth(e.target.value);
              // Implementation would ideally change the month view
            }}
            className="appearance-none bg-gray-100 dark:bg-gray-700 border-0 rounded-md py-1.5 pl-3 pr-8 text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer focus:ring-1 focus:ring-blue-500"
          >
            <option value="Jan">Jan</option>
            <option value="Feb">Feb</option>
            <option value="Mar">Mar</option>
            <option value="Apr">Apr</option>
            <option value="May">May</option>
            <option value="Jun">Jun</option>
            <option value="Jul">Jul</option>
            <option value="Aug">Aug</option>
            <option value="Sep">Sep</option>
            <option value="Oct">Oct</option>
            <option value="Nov">Nov</option>
            <option value="Dec">Dec</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Calendar date selector */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => navigateDay('prev')}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {formattedDate}
          </div>
          
          <button 
            onClick={() => navigateDay('next')}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Days of week */}
        <div className="flex justify-between space-x-2">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => setCurrentDate(day.date)}
              className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-lg transition-all ${
                day.isSelected 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="text-xs mb-1">{day.dayName}</div>
              <div className={`text-lg font-semibold ${day.isSelected ? 'text-white' : ''}`}>
                {day.dayNum}
              </div>
            </button>
          ))}
        </div>
      </div>

      {showEditSuccess && (
        <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm flex items-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          Task updated successfully!
        </div>
      )}

      {editError && (
        <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {editError}
        </div>
      )}
      
      {/* Task cards */}
      <div className="space-y-4">
        {selectedDayTasks.length > 0 ? (
          selectedDayTasks.map(task => {
            // Calculate progress color based on status
            let progressColor = 'bg-blue-500'; // default
            if (task.status === 'in-progress') progressColor = 'bg-purple-500';
            if (task.status === 'completed') progressColor = 'bg-green-500';
            
            // Calculate progress percentage
            let progressPercentage = 0;
            if (task.status === 'my-tasks') progressPercentage = 25;
            if (task.status === 'in-progress') progressPercentage = 75;
            if (task.status === 'completed') progressPercentage = 100;
            
            // Get days remaining
            const daysRemaining = getDaysRemaining(task.dueDate);
            
            return (
              <div key={task.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                {editingTaskId === task.id ? (
                  // Editing mode
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Edit Task</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCancelEdit()}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        name="name"
                        value={editingTaskData.name || ''}
                        onChange={handleEditChange}
                        className="w-full px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Task name"
                      />
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
                        <select
                          name="status"
                          value={editingTaskData.status || ''}
                          onChange={handleEditChange}
                          className="w-full px-3 py-1.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="my-tasks">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
                        <input
                          type="date"
                          name="dueDate"
                          value={editingTaskData.dueDate || ''}
                          onChange={handleEditChange}
                          className="w-full px-3 py-1.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => handleCancelEdit()}
                        className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(task.id)}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(task.status)}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {task.category.charAt(0).toUpperCase() + task.category.slice(1).replace('-', ' ')}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {task.name}
                        </h3>
                      </div>
                      <button 
                        onClick={() => handleEditClick(task)}
                        className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="mt-3 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div 
                        className={`${progressColor} h-1.5 rounded-full transition-all duration-500`} 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs mt-3 text-gray-500 dark:text-gray-400">
                      <div className="flex gap-3">
                        <div className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className={`
                        ${daysRemaining < 0 
                          ? 'text-red-500 dark:text-red-400' 
                          : daysRemaining <= 1 
                            ? 'text-orange-500 dark:text-orange-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }
                      `}>
                        {daysRemaining < 0 
                          ? `${Math.abs(daysRemaining)} days overdue` 
                          : daysRemaining === 0 
                            ? 'Due today' 
                            : daysRemaining === 1 
                              ? 'Due tomorrow' 
                              : `${daysRemaining} days left`
                        }
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-1">No tasks scheduled</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">There are no tasks scheduled for this day</p>
          </div>
        )}
      </div>
    </div>
  );
} 