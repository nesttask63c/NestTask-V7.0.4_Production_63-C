import { useState, useEffect } from 'react';
import { Activity, Users, Filter, Calendar, PieChart, Zap, SearchIcon, Bell, ChevronDown, ChevronUp, TrendingUp, BarChart2, BookOpen, Clock, Star, Award, Briefcase } from 'lucide-react';
import { UserActivity } from '../UserActivity';
import { UserGraph } from './UserGraph';
import type { User } from '../../../types/auth';
import type { Task } from '../../../types';

interface DashboardProps {
  users: User[];
  tasks: Task[];
}

export function Dashboard({ users, tasks }: DashboardProps) {
  const [filterValue, setFilterValue] = useState('All');
  const [currentDate, setCurrentDate] = useState('');
  const [greetingTime, setGreetingTime] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  
  // User Analytics controls
  const [chartType, setChartType] = useState<'bar' | 'line'>('line');
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'year' | '6months' | '30days'>('6months');

  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [showCategoryTooltip, setShowCategoryTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipData, setTooltipData] = useState<{ category: string, count: number, percentage: number } | null>(null);

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

  const toggleShowAllActivity = () => {
    setShowAllActivity(!showAllActivity);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-6 animate-fade-in hidden sm:block">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
          <div className="relative w-full max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="search" 
              placeholder="Search users, tasks, or courses..." 
              className="pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 border-none dark:text-gray-200 transition-all duration-300"
            />
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button 
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 relative hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-10 p-4 border border-gray-100 dark:border-gray-700 animate-fadeIn">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                    <span>Notifications</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">3 new</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium dark:text-white">5 new users joined today</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium dark:text-white">User activity increased by 24%</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Yesterday</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium dark:text-white">New course materials added</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">1 day ago</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full text-xs text-blue-600 dark:text-blue-400 mt-4 py-2 hover:underline font-medium">
                    View all notifications
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-xl transition-all duration-300">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium">
                {adminUser?.name.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                  {adminUser?.name || 'Admin'}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Administrator</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden animate-scale-in">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mt-16 -mr-16 blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500 opacity-20 rounded-full blur-md"></div>
        
        <div className="flex flex-col md:flex-row justify-between gap-4 relative z-10">
          <div>
            <span className="inline-block text-xs bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm mb-2">
              <Calendar className="w-3 h-3 inline-block mr-1" />
              {currentDate}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              {greetingTime}, <span className="text-blue-200">{adminUser?.name?.split(' ')[0] || 'Admin'}!</span>
            </h2>
            <p className="text-sm text-blue-100 max-w-md leading-relaxed">
              Welcome to your dashboard. You have <span className="text-white font-medium">{newUsersThisWeek} new users</span> this week and <span className="text-white font-medium">{activeUsers} active users</span> today. The system is performing optimally.
            </p>
          </div>
          <div className="mt-2 md:mt-0 flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3.5 sm:p-4 transition-all hover:bg-white/30 hover:shadow-xl">
              <div className="text-xs font-medium">TOTAL USERS</div>
              <div className="text-2xl sm:text-3xl font-bold">{users.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
              <div className="text-xs text-blue-100 flex items-center mt-0.5">
                <span className="inline-block px-1.5 py-0.5 bg-green-500/30 text-green-100 rounded-md mr-1">
                  +{Math.round((newUsersThisWeek / users.length) * 100)}%
                </span> 
                vs last week
              </div>
            </div>
            <div className="hidden sm:block bg-white/20 backdrop-blur-sm rounded-xl p-3.5 sm:p-4 transition-all hover:bg-white/30 hover:shadow-xl">
              <div className="text-xs font-medium">ACTIVE RATE</div>
              <div className="text-2xl sm:text-3xl font-bold">{activePercentage}%</div>
              <div className="text-xs text-blue-100 flex items-center mt-0.5">
                <Zap className="w-3.5 h-3.5 mr-1" /> 
                {activeUsers} online today
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md card-hover-effect animate-fade-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Users</h3>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{activeUsers}</p>
          <div className="flex items-center">
            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full mr-1.5">+12%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">vs last week</span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${activePercentage}%` }}></div>
          </div>
        </div>
        
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md card-hover-effect animate-fade-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">New Users</h3>
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{newUsersThisWeek}</p>
          <div className="flex items-center">
            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full mr-1.5">+5%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">vs last week</span>
          </div>
          <div className="mt-3 flex items-center space-x-1">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                className="h-5 w-3 rounded-sm bg-purple-100 dark:bg-purple-900/20" 
                style={{ 
                  height: `${15 + Math.random() * 20}px`,
                  opacity: i === 6 ? 1 : 0.5 + (i * 0.08)
                }}
              ></div>
            ))}
          </div>
        </div>
        
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-200 hover:shadow-md card-hover-effect animate-fade-in group relative overflow-hidden" style={{animationDelay: '0.3s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium tracking-wide">Total Tasks</h3>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/20 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 relative z-10">{tasks.length}</p>
          <div className="flex items-center relative z-10">
            <span className="text-xs px-1.5 sm:px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 rounded-full mr-1.5 sm:mr-2 font-medium">Active</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{tasks.filter(t => t.status !== 'completed').length} pending</span>
          </div>
          <div className="mt-3 sm:mt-4 flex flex-col sm:grid sm:grid-cols-3 gap-1.5 sm:gap-2 relative z-10">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-1.5 sm:p-2 rounded-lg text-center transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-[1.03]">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">New</div>
              <div className="font-semibold text-xs sm:text-sm">{tasks.filter(t => t.status === 'my-tasks').length}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-1.5 sm:p-2 rounded-lg text-center transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-[1.03]">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">In Progress</div>
              <div className="font-semibold text-xs sm:text-sm">{tasks.filter(t => t.status === 'in-progress').length}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-1.5 sm:p-2 rounded-lg text-center transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-[1.03]">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">Completed</div>
              <div className="font-semibold text-xs sm:text-sm">{tasks.filter(t => t.status === 'completed').length}</div>
            </div>
          </div>
        </div>
        
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md card-hover-effect animate-fade-in" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Completion Rate</h3>
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {completionRate}%
          </p>
          <div className="flex items-center">
            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full mr-1.5">{completionTrend}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
          </div>
          <div className="mt-3 relative h-6 w-full">
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full absolute top-1/2 -translate-y-1/2"></div>
            <div className="h-6 w-6 rounded-full bg-green-500 absolute top-1/2 -translate-y-1/2 shadow-md flex items-center justify-center" style={{ left: `calc(${completionRate}% - 12px)` }}>
              <div className="h-2.5 w-2.5 rounded-full bg-white"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 animate-slide-up" style={{animationDelay: '0.2s'}}>
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

        <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 sm:p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                View all
              </button>
          </div>
            
            <div className="space-y-5">
              {filteredUsers.slice(0, showAllActivity ? 6 : 3).map((user, index) => (
                <div key={user.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 font-medium text-sm flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                      <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium dark:text-white">{user.name}</p>
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(user.lastActive || user.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {index % 3 === 0 ? 'Completed a task' : index % 3 === 1 ? 'Added a new document' : 'Updated their profile'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredUsers.length > 3 && (
              <button 
                onClick={toggleShowAllActivity}
                className="mt-5 w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors flex items-center justify-center"
              >
                {showAllActivity ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1.5" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1.5" />
                    View more
                  </>
                )}
              </button>
            )}
          </div>
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