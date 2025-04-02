import { useState, useEffect } from 'react';
import { 
  Activity, Users, Filter, Calendar, PieChart, Zap, TrendingUp, BarChart2, 
  BookOpen, Clock, Star, Award, Briefcase, CreditCard, CheckCircle, FileText
} from 'lucide-react';
import { UserActivity } from '../UserActivity';
import { UserGraph } from './UserGraph';
import { TaskOverview } from './TaskOverview';
import type { User } from '../../../types/auth';
import type { Task } from '../../../types';
import { fetchTasks } from '../../../services/taskService';

interface DashboardProps {
  users: User[];
  tasks: Task[];
}

export function Dashboard({ users, tasks: initialTasks }: DashboardProps) {
  const [filterValue, setFilterValue] = useState('All');
  const [currentDate, setCurrentDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState('');
  const [greetingTime, setGreetingTime] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  // Projects Overview chart controls
  const [selectedMonthView, setSelectedMonthView] = useState('Monthly');
  
  // User Analytics controls
  const [chartType, setChartType] = useState<'bar' | 'line'>('line');
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'year' | '6months' | '30days'>('6months');

  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [showCategoryTooltip, setShowCategoryTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipData, setTooltipData] = useState<{ category: string, count: number, percentage: number } | null>(null);

  const [userData, setUserData] = useState({
    totalUsers: 0,
    activeToday: 0,
    newThisWeek: 0,
  });
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  useEffect(() => {
    // Check if mobile view and update when window resizes
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Format current date
    const now = new Date();
    setCurrentMonth(now.toLocaleDateString('en-US', { month: 'long' }));
    
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: isMobile ? 'short' : 'long', 
      year: 'numeric', 
      month: isMobile ? 'short' : 'long', 
      day: 'numeric' 
    };
    setCurrentDate(now.toLocaleDateString('en-US', dateOptions));
    
    // Set greeting based on time of day
    const hours = now.getHours();
    let greeting = '';
    if (hours < 12) {
      greeting = 'Good Morning';
    } else if (hours < 18) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }
    setGreetingTime(greeting);
  }, [isMobile]);

  // Update tasks when initialTasks prop changes
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Filter users based on selected filter
  const getFilteredUsers = () => {
    if (filterValue === 'All') return users;
    return users.filter(user => user.role === filterValue.toLowerCase());
  };
  
  const filteredUsers = getFilteredUsers();
  const adminUser = users.find(user => user.role === 'admin');

  // Calculate stats
  const activeUsers = users.filter(user => user.lastActive).length;
  const activePercentage = Math.round((activeUsers / users.length) * 100) || 0;
  const newUsersThisWeek = users.filter(user => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(user.createdAt) >= weekAgo;
  }).length;

  // Calculate completion rate change
  const completionRate = tasks.length 
    ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) 
    : 0;
  const completionTrend = "+8%";
  
  // Calculate task categories distribution
  const taskCategories = tasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter tasks based on the selected time range
  const getFilteredTasksByTimeRange = () => {
    const now = new Date();
    
    switch(selectedTimeRange) {
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return tasks.filter(task => new Date(task.createdAt) >= weekAgo);
      
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return tasks.filter(task => new Date(task.createdAt) >= monthAgo);
      
      case 'all':
      default:
        return tasks;
    }
  };

  // Get filtered tasks based on time range
  const filteredTasksByTimeRange = getFilteredTasksByTimeRange();

  // Calculate filtered task categories
  const filteredTaskCategories = filteredTasksByTimeRange.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Handle task updates from TaskOverview
  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prevTasks: Task[]) => 
      prevTasks.map((task: Task) => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-center">
          <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{users.length}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
        </div>
      </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Today</h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{activeUsers}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/10 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-green-500 dark:text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">New This Week</h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{newUsersThisWeek}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/10 flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{tasks.length}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/10 flex items-center justify-center shadow-sm">
              <Briefcase className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Analytics Section - 2/3 width on desktop */}
        <div className="lg:col-span-2">
          <div>
          {/* Analytics Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Analytics</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Track user growth and activities</p>
            </div>
            
            <div className="flex justify-end items-center gap-2 mt-2 sm:mt-0">
              <button 
                className={`p-2 rounded-lg ${
                  chartType === 'bar' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                } transition-colors`}
                onClick={() => setChartType('bar')}
                title="Bar Chart"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
              <button 
                className={`p-2 rounded-lg ${
                  chartType === 'line' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                } transition-colors`}
                onClick={() => setChartType('line')}
                title="Line Chart"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
              <select
                className="ml-2 text-sm bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-gray-600 dark:text-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
                value={analyticsTimeRange}
                onChange={(e) => setAnalyticsTimeRange(e.target.value as 'year' | '6months' | '30days')}
              >
                <option value="year">Last 12 months</option>
                <option value="6months">Last 6 months</option>
                <option value="30days">Last 30 days</option>
              </select>
            </div>
          </div>

          {/* Analytics Chart */}
          <UserGraph 
            users={users} 
            chartType={chartType} 
            timeRange={analyticsTimeRange}
          />
        </div>
          </div>
            
        {/* Tasks Overview Section - 1/3 width on desktop */}
        <div className="lg:col-span-1 animate-slide-up" style={{animationDelay: '0.3s'}}>
          {isLoadingTasks ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-5 sm:p-6 h-[560px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <TaskOverview 
              tasks={tasks} 
              onTaskUpdated={handleTaskUpdated} 
            />
          )}
        </div>
      </div>

      {/* Task Category Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 sm:p-6 animate-fade-in" style={{animationDelay: '0.5s'}}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Task Categories</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Distribution of tasks by category 
              {selectedTimeRange === 'week' 
                ? ' (Last 7 days)' 
                : selectedTimeRange === 'month' 
                  ? ' (Last 30 days)' 
                  : ' (All time)'}
            </p>
          </div>
          
          <div className="mt-2 sm:mt-0 flex items-center gap-2">
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <button 
                className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                  selectedTimeRange === 'week' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSelectedTimeRange('week')}
              >
                Week
              </button>
              <button 
                className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                  selectedTimeRange === 'month' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSelectedTimeRange('month')}
              >
                Month
              </button>
              <button 
                className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                  selectedTimeRange === 'all' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSelectedTimeRange('all')}
              >
                All Time
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
            <div className="h-52 flex items-center justify-center relative">
              {/* Interactive SVG Pie Chart implementation */}
              <svg viewBox="0 0 100 100" className="w-40 h-40 transform transition-transform duration-500 hover:scale-105">
                {Object.entries(filteredTaskCategories).length > 0 ? (
                  <>
                    {Object.entries(filteredTaskCategories).reduce((acc, [category, count], index, array) => {
                      // Calculate percentages and angles for pie slices
                      const total = filteredTasksByTimeRange.length;
                      const percentage = (count / total) * 100;
                      
                      // First slice starts at 0 degrees
                      const prevAngle = index === 0 ? 0 : 
                        array.slice(0, index).reduce((sum, [_, cnt]) => sum + (cnt / total * 360), 0);
                      const angle = (count / total) * 360;
                      
                      // Convert to radians and calculate coordinates
                      const startAngle = (prevAngle - 90) * Math.PI / 180;
                      const endAngle = (prevAngle + angle - 90) * Math.PI / 180;
                      
                      const x1 = 50 + 40 * Math.cos(startAngle);
                      const y1 = 50 + 40 * Math.sin(startAngle);
                      const x2 = 50 + 40 * Math.cos(endAngle);
                      const y2 = 50 + 40 * Math.sin(endAngle);
                      
                      // Calculate center point of the slice for tooltip positioning
                      const midAngle = (prevAngle + angle / 2 - 90) * Math.PI / 180;
                      const labelX = 50 + 35 * Math.cos(midAngle);
                      const labelY = 50 + 35 * Math.sin(midAngle);
                      
                      // Large arc flag is 1 if angle > 180 degrees
                      const largeArcFlag = angle > 180 ? 1 : 0;
                      
                      // Define colors for slices
                      const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899'];
                      
                      // Create interactive pie slice
                      acc.push(
                        <path 
                          key={category}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill={colors[index % colors.length]}
                          stroke="#fff"
                          strokeWidth="1"
                          className={`transition-all duration-300 cursor-pointer ${
                            activeCategoryIndex === index || activeCategoryIndex === null 
                              ? 'opacity-100' 
                              : 'opacity-40'
                          }`}
                          style={{ 
                            transform: activeCategoryIndex === index ? 'scale(1.05)' : 'scale(1)',
                            transformOrigin: 'center'
                          }}
                          onMouseEnter={() => {
                            setActiveCategoryIndex(index);
                            setTooltipData({
                              category,
                              count,
                              percentage: parseFloat(percentage.toFixed(1))
                            });
                            setTooltipPosition({ x: labelX, y: labelY });
                            setShowCategoryTooltip(true);
                          }}
                          onMouseLeave={() => {
                            setActiveCategoryIndex(null);
                            setShowCategoryTooltip(false);
                          }}
                        />
                      );
                      return acc;
                    }, [] as React.ReactNode[])}
                    
                    {/* Center hole for donut chart */}
                    <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-gray-800" />
                    
                    {/* Display total tasks in center */}
                    <text 
                      x="50" 
                      y="45" 
                      textAnchor="middle" 
                      className="text-xs font-medium fill-gray-800 dark:fill-gray-200"
                    >
                      {filteredTasksByTimeRange.length}
                    </text>
                    <text 
                      x="50" 
                      y="55" 
                      textAnchor="middle" 
                      className="text-[9px] fill-gray-500 dark:fill-gray-400"
                    >
                      Tasks
                    </text>
                  </>
                ) : (
                  <circle cx="50" cy="50" r="40" fill="#E5E7EB" className="dark:fill-gray-700" />
                )}
              </svg>
              
              {/* Category tooltip */}
              {showCategoryTooltip && tooltipData && (
                <div 
                  className="absolute bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 z-10 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 border border-gray-100 dark:border-gray-700 text-center min-w-[100px]"
                  style={{ 
                    left: `${tooltipPosition.x}%`, 
                    top: `${tooltipPosition.y}%` 
                  }}
                >
                  <p className="text-xs font-medium text-gray-900 dark:text-white capitalize">{tooltipData.category}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tooltipData.count} tasks ({tooltipData.percentage}%)
                  </p>
                </div>
              )}
              
              {Object.entries(filteredTaskCategories).length === 0 && (
                <div className="absolute text-center text-gray-400 dark:text-gray-500">
                  <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No task data available</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            {Object.entries(filteredTaskCategories).slice(0, 5).map(([category, count], index) => {
              // Define fixed colors for categories
              const bgColors = [
                'bg-blue-500', 
                'bg-purple-500', 
                'bg-amber-500', 
                'bg-green-500', 
                'bg-pink-500'
              ];
              const total = filteredTasksByTimeRange.length;
              const percentage = ((count / total) * 100).toFixed(1);
              
              return (
                <div 
                  key={category} 
                  className={`flex items-center p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                    activeCategoryIndex === index || activeCategoryIndex === null 
                      ? 'opacity-100' 
                      : 'opacity-60'
                  } ${activeCategoryIndex === index ? 'bg-gray-50 dark:bg-gray-700/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                  onMouseEnter={() => setActiveCategoryIndex(index)}
                  onMouseLeave={() => setActiveCategoryIndex(null)}
                >
                  <div className={`w-3 h-3 rounded-full mr-3 ${bgColors[index % 5]}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{category}</p>
                      <div className="flex items-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mr-2">{count} tasks</p>
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${bgColors[index % 5]} transition-all duration-500`}
                        style={{ 
                          width: `${(count / total) * 100}%`,
                          opacity: activeCategoryIndex === index ? 1 : 0.7
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {Object.keys(filteredTaskCategories).length > 5 && (
              <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline mt-3 py-2 font-medium bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg">
                View all categories
              </button>
            )}
            
            {Object.keys(filteredTaskCategories).length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No task data available</p>
                <button className="mt-3 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                  Add tasks
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 