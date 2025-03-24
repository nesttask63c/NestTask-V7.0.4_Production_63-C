import { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  Legend,
  AreaChart,
} from 'recharts';
import { Activity, Calendar, Users } from 'lucide-react';
import type { User } from '../../../types/auth';

interface TimeFilterProps {
  selected: 'week' | 'month' | 'year';
  onChange: (filter: 'week' | 'month' | 'year') => void;
  isMobile: boolean;
}

const TimeFilter = ({ selected, onChange, isMobile }: TimeFilterProps) => {
  return (
    <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 w-full sm:w-auto justify-center sm:justify-start mt-3 sm:mt-0 shadow-sm border border-gray-200 dark:border-gray-700">
      <button
        className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md transition-all duration-300 ${
          selected === 'week'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        onClick={() => onChange('week')}
      >
        {isMobile ? '7D' : 'Week'}
      </button>
      <button
        className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md transition-all duration-300 ${
          selected === 'month'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        onClick={() => onChange('month')}
      >
        {isMobile ? '30D' : 'Month'}
      </button>
      <button
        className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md transition-all duration-300 ${
          selected === 'year'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        onClick={() => onChange('year')}
      >
        {isMobile ? '1Y' : 'Year'}
      </button>
    </div>
  );
};

interface UserActiveGraphProps {
  users: User[];
}

export function UserActiveGraph({ users }: UserActiveGraphProps) {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('week');
  const [animationActive, setAnimationActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view and update when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Trigger animation on first load and when changing time filter
  useEffect(() => {
    setAnimationActive(true);
    
    const timer = setTimeout(() => {
      setAnimationActive(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [timeFilter]);

  // Generate chart data based on the selected time filter
  const chartData = useMemo(() => {
    const now = new Date();
    const data: { name: string; activeUsers: number; date: Date }[] = [];
    
    if (timeFilter === 'week') {
      // Generate data for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('en-US', { 
          weekday: isMobile ? 'narrow' : 'short'
        });
        
        // Get active users for this day (users who were active on this date)
        const activeUsersCount = users.filter(user => {
          if (!user.lastActive) return false;
          const activeDate = new Date(user.lastActive);
          return activeDate.toDateString() === date.toDateString();
        }).length;
        
        data.push({ 
          name: dayName, 
          activeUsers: activeUsersCount,
          date: new Date(date)
        });
      }
    } else if (timeFilter === 'month') {
      // Generate data for the last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (i * 7));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        
        const weekNum = 4 - i;
        const weekLabel = isMobile ? `W${weekNum}` : `Week ${weekNum}`;
        
        // Get active users for this week
        const activeUsersCount = users.filter(user => {
          if (!user.lastActive) return false;
          const activeDate = new Date(user.lastActive);
          return activeDate >= startDate && activeDate <= endDate;
        }).length;
        
        data.push({ 
          name: weekLabel, 
          activeUsers: activeUsersCount,
          date: new Date(startDate)
        });
      }
    } else {
      // Generate data for the year (by month)
      const months = isMobile 
        ? ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 0; i < 12; i++) {
        const month = i;
        const year = now.getFullYear();
        
        // Create date objects for the start and end of the month
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        // Get active users for this month
        const activeUsersCount = users.filter(user => {
          if (!user.lastActive) return false;
          const activeDate = new Date(user.lastActive);
          return activeDate.getMonth() === month && activeDate.getFullYear() === year;
        }).length;
        
        data.push({ 
          name: months[i], 
          activeUsers: activeUsersCount,
          date: startDate
        });
      }
    }
    
    return data;
  }, [users, timeFilter, isMobile]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-scale-in">
          <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            <span>{label}</span>
            {data.date && <span className="text-xs text-gray-500 ml-2">
              {new Date(data.date).toLocaleDateString()}
            </span>}
          </div>
          <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-semibold">
            <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
            <span>Active Users: {payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleTimeFilterChange = (filter: 'week' | 'month' | 'year') => {
    setTimeFilter(filter);
  };

  // Calculate average active users
  const averageActiveUsers = useMemo(() => {
    if (chartData.length === 0) return 0;
    const total = chartData.reduce((sum, item) => sum + item.activeUsers, 0);
    return Math.round(total / chartData.length);
  }, [chartData]);

  // Calculate max active users
  const maxActiveUsers = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(item => item.activeUsers));
  }, [chartData]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm transition-all duration-300 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
            User Activity Trends
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            <span>
              {timeFilter === 'week' ? 'Last 7 days' : 
               timeFilter === 'month' ? 'Last 30 days' : 
               `${new Date().getFullYear()} overview`}
            </span>
          </div>
        </div>
        <TimeFilter selected={timeFilter} onChange={handleTimeFilterChange} isMobile={isMobile} />
      </div>

      <div className="bg-gray-50 dark:bg-gray-850 rounded-xl p-4 mb-4">
        <div className={`h-60 sm:h-[320px] ${isMobile ? 'mx-[-0.5rem]' : ''}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={isMobile ? { top: 15, right: 5, left: 0, bottom: 10 } : { top: 20, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" vertical={false} strokeOpacity={0.6} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280', fontSize: isMobile ? 10 : 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                dy={10}
                angle={isMobile ? (timeFilter === 'year' ? 0 : -45) : 0}
                textAnchor={isMobile && timeFilter !== 'year' ? "end" : "middle"}
                height={isMobile ? 35 : 50}
                interval={isMobile ? (timeFilter === 'year' ? 1 : 0) : 0}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: isMobile ? 10 : 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                width={isMobile ? 30 : 40}
              />
              <Tooltip content={CustomTooltip} />
              <Legend />
              
              <defs>
                <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <Area
                type="monotone"
                dataKey="activeUsers"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorActiveUsers)"
                isAnimationActive={animationActive}
                animationDuration={1500}
                name="Active Users"
                strokeWidth={2}
                activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statistics panel */}
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Average Active Users
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {averageActiveUsers}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                <Activity className="w-3.5 h-3.5 mr-1.5" />
                Peak Activity
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {maxActiveUsers}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 