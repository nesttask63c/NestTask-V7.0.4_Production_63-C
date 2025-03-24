import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceDot,
  ReferenceArea,
  Brush,
  Legend,
  AreaChart,
  ComposedChart,
  ReferenceLine,
  Bar,
} from 'recharts';
import { TrendingUp, Calendar, ArrowUpRight, Info } from 'lucide-react';
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

interface UserGraphProps {
  users: User[];
  chartType?: 'bar' | 'line';
  timeRange?: 'year' | '6months' | '30days';
}

export function UserGraph({ 
  users, 
  chartType = 'line',
  timeRange = 'year' 
}: UserGraphProps) {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('year');
  const [animationActive, setAnimationActive] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const infoButtonRef = useRef<HTMLButtonElement>(null);

  // Check if mobile view and update when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Map timeRange prop to timeFilter when it changes
  useEffect(() => {
    if (timeRange === '30days') {
      setTimeFilter('month');
    } else if (timeRange === '6months') {
      setTimeFilter('month'); // We'll adjust the data below
    } else {
      setTimeFilter('year');
    }
  }, [timeRange]);

  // Trigger animation on first load and when changing time filter
  useEffect(() => {
    setAnimationActive(true);
    setIsInitialLoad(false);
    
    const timer = setTimeout(() => {
      setAnimationActive(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [timeFilter]);

  // Handle clicks outside the info tooltip to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoButtonRef.current && !infoButtonRef.current.contains(event.target as Node)) {
        setShowInfoTooltip(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate chart data based on the selected time filter and timeRange prop
  const chartData = useMemo(() => {
    const now = new Date();
    const data: { name: string; users: number; newUsers?: number; activeUsers?: number; date?: Date }[] = [];
    
    if (timeFilter === 'week' || timeRange === '30days') {
      // Generate data for the last 7 or 30 days
      const days = timeRange === '30days' ? 30 : 7;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // For 30 days, use date format instead of day name
        const dayName = timeRange === '30days' 
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : date.toLocaleDateString('en-US', { weekday: isMobile ? 'narrow' : 'short' });
        
        const newUsersCount = users.filter(user => {
          const userDate = new Date(user.createdAt);
          return userDate.toDateString() === date.toDateString();
        }).length;
        
        // Count active users for this day - set hours to ensure whole day is covered
        const activeDate = new Date(date);
        activeDate.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(activeDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const activeUsersCount = users.filter(user => {
          if (!user.lastActive) return false;
          
          const lastActive = new Date(user.lastActive);
          // Normalize to remove time component for comparison
          const lastActiveDay = new Date(lastActive);
          lastActiveDay.setHours(0, 0, 0, 0);
          
          // Match exact day
          return lastActiveDay.getTime() === activeDate.getTime();
        }).length;
        
        data.push({ 
          name: dayName, 
          users: 0, // Will be calculated for cumulative
          newUsers: newUsersCount,
          activeUsers: activeUsersCount,
          date: new Date(date)
        });
      }
    } else if (timeFilter === 'month') {
      if (timeRange === '6months') {
        // For 6 months view
        const monthCount = 6;
        
        for (let i = monthCount - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          const monthName = date.toLocaleDateString('en-US', { 
            month: isMobile ? 'short' : 'long'
          });
          
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
          const newUsersCount = users.filter(user => {
            const userDate = new Date(user.createdAt);
            return userDate >= monthStart && userDate <= monthEnd;
          }).length;
          
          const activeUsersCount = users.filter(user => {
            if (!user.lastActive) return false;
            const lastActive = new Date(user.lastActive);
            
            // Count users active in this specific month
            return lastActive.getFullYear() === monthStart.getFullYear() && 
                   lastActive.getMonth() === monthStart.getMonth();
          }).length;
          
          data.push({ 
            name: monthName, 
            users: 0, // Will be calculated for cumulative
            newUsers: newUsersCount,
            activeUsers: activeUsersCount,
            date: new Date(monthStart)
          });
        }
      } else {
        // Original 4 weeks view
        for (let i = 3; i >= 0; i--) {
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() - (i * 7));
          const startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - 6);
          
          // Ensure dates are at beginning of day
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          
          const weekNum = 4 - i;
          // Shorter label for mobile
          const weekLabel = isMobile ? `W${weekNum}` : `Week ${weekNum}`;
          
          const newUsersCount = users.filter(user => {
            const userDate = new Date(user.createdAt);
            return userDate >= startDate && userDate <= endDate;
          }).length;
          
          // Count active users for this week 
          const activeUsersCount = users.filter(user => {
            if (!user.lastActive) return false;
            const lastActive = new Date(user.lastActive);
            return lastActive >= startDate && lastActive <= endDate;
          }).length;
          
          data.push({ 
            name: weekLabel, 
            users: 0, // Will be calculated for cumulative
            newUsers: newUsersCount,
            activeUsers: activeUsersCount,
            date: new Date(startDate)
          });
        }
      }
    } else {
      // Generate data for the year (by month)
      const months = isMobile 
        ? ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] // Single letter for mobile
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 0; i < 12; i++) {
        const month = i;
        const year = now.getFullYear();
        
        // Create start and end dates for the month
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const newUsersCount = users.filter(user => {
          const userDate = new Date(user.createdAt);
          return userDate.getMonth() === month && userDate.getFullYear() === year;
        }).length;
        
        // Count active users for this month
        const activeUsersCount = users.filter(user => {
          if (!user.lastActive) return false;
          const lastActive = new Date(user.lastActive);
          return lastActive.getMonth() === month && lastActive.getFullYear() === year;
        }).length;
        
        data.push({ 
          name: months[i], 
          users: 0, // Will be calculated for cumulative
          newUsers: newUsersCount,
          activeUsers: activeUsersCount,
          date: new Date(monthStart)
        });
      }
    }
    
    // Calculate cumulative users for each data point
    let cumulativeCount = 0;
    
    // Start with users registered before our timeframe
    if (timeFilter === 'week' || timeRange === '30days') {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - (timeRange === '30days' ? 30 : 7) + 1);
      startDate.setHours(0, 0, 0, 0);
      
      cumulativeCount = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate < startDate;
      }).length;
    } else if (timeFilter === 'month') {
      if (timeRange === '6months') {
        const monthStart = new Date(now);
        monthStart.setMonth(monthStart.getMonth() - 6);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        cumulativeCount = users.filter(user => {
          const userDate = new Date(user.createdAt);
          return userDate < monthStart;
        }).length;
      } else {
        const monthStart = new Date(now);
        monthStart.setDate(monthStart.getDate() - 28);
        monthStart.setHours(0, 0, 0, 0);
        
        cumulativeCount = users.filter(user => {
          const userDate = new Date(user.createdAt);
          return userDate < monthStart;
        }).length;
      }
    } else {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      
      cumulativeCount = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate < yearStart;
      }).length;
    }
    
    const cumulativeData = data.map(item => {
      cumulativeCount += item.newUsers || 0;
      return { ...item, users: cumulativeCount };
    });
    
    return cumulativeData;
  }, [users, timeFilter, isMobile, timeRange]);

  // Find all significant points (points with large increases)
  const significantPoints = useMemo(() => {
    if (chartData.length < 2) return [];
    
    const points: number[] = [];
    const threshold = Math.max(
      5, // Minimum threshold
      Math.floor(chartData.reduce((sum, item) => sum + (item.newUsers || 0), 0) * 0.15 / chartData.length) // 15% of average
    );
    
    // Find indices with significant increases
    for (let i = 0; i < chartData.length; i++) {
      if ((chartData[i].newUsers || 0) > threshold) {
        points.push(i);
      }
    }
    
    // On mobile, limit to max 3 significant points to avoid clutter
    if (isMobile && points.length > 3) {
      points.sort((a, b) => (chartData[b].newUsers || 0) - (chartData[a].newUsers || 0));
      points.splice(3);
    }
    
    return points;
  }, [chartData, isMobile]);

  // Find max user growth point
  const maxGrowthPoint = useMemo(() => {
    if (chartData.length < 2) return null;
    
    let maxIndex = 0;
    let maxGrowth = 0;
    
    for (let i = 0; i < chartData.length; i++) {
      if ((chartData[i].newUsers || 0) > maxGrowth) {
        maxGrowth = chartData[i].newUsers || 0;
        maxIndex = i;
      }
    }
    
    return maxGrowth > 0 ? maxIndex : null;
  }, [chartData]);

  // Calculate total new users in the period
  const totalNewUsers = useMemo(() => {
    return chartData.reduce((sum, item) => sum + (item.newUsers || 0), 0);
  }, [chartData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg ${isMobile ? 'p-2 max-w-[200px]' : 'p-3'} shadow-lg`}>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">
            {label}
          </div>
          
          {payload.map((entry: any, index: number) => {
            const colors: {[key: string]: string} = {
              "Total Users": "#3B82F6",
              "New Registrations": "#10B981",
              "Active Users": "#8B5CF6"
            };
            const color = colors[entry.name] || entry.color;
            
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-3 sm:gap-8 mb-1">
                <span className="flex items-center gap-1 sm:gap-2">
                  <span 
                    className="inline-block w-2 sm:w-3 h-2 sm:h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  ></span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[90px] sm:max-w-full">
                    {entry.name}:
                  </span>
                </span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {entry.value.toLocaleString()}
                </span>
              </div>
            );
          })}
          
          <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {timeFilter === 'week' ? 'Weekly Stats' : timeFilter === 'month' ? 'Monthly Stats' : 'Yearly Stats'}
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Get index for today in the data
  const getTodayIndex = () => {
    if (timeFilter === 'week') {
      return chartData.length - 1;
    } else if (timeRange === '30days') {
      return chartData.length - 1;
    }
    return undefined;
  };

  // Handlers for mouse interactions
  const handleMouseMove = (e: any) => {
    if (e && e.activeTooltipIndex !== undefined) {
      setHoveredPoint(e.activeTooltipIndex);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Find the component to render based on chartType
  const ChartComponent = chartType === 'bar' ? ComposedChart : AreaChart;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="relative">
            <h3 className="text-base font-medium text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 mr-1.5 sm:mr-2 text-blue-600 dark:text-blue-400" />
              User Growth Trends
              <button 
                ref={infoButtonRef}
                className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                aria-label="Information about user growth"
              >
                <Info className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </button>
            </h3>
            {showInfoTooltip && (
              <div className="absolute z-10 mt-2 w-60 sm:w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 animate-slide-in-right left-0 sm:left-auto">
                <p>This chart shows the total number of registered users over time, with the green line indicating new registrations within each period.</p>
                <p className="mt-2">Highlighted points show periods of significant growth.</p>
              </div>
            )}
          </div>
          <TimeFilter selected={timeFilter} onChange={setTimeFilter} isMobile={isMobile} />
        </div>
      </div>

      <div className="px-3 sm:px-6 py-3 sm:py-5">
        <div className="bg-gray-50 dark:bg-gray-850 rounded-xl p-3 sm:p-5">
          <div className="h-60 sm:h-80 md:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <ComposedChart
                  data={chartData}
                  margin={{ top: 15, right: isMobile ? 5 : 30, left: isMobile ? 0 : 10, bottom: isMobile ? 5 : 10 }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                    </linearGradient>
                    <filter id="shadow" height="200%">
                      <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.1"/>
                    </filter>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="#E5E7EB" 
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB', strokeOpacity: 0.6 }}
                    tickLine={false}
                    padding={{ left: 5, right: 5 }}
                    interval={isMobile ? 1 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => isMobile && value > 999 ? `${(value/1000).toFixed(0)}k` : value.toLocaleString()}
                    width={isMobile ? 30 : 40}
                    domain={['auto', 'auto']}
                    padding={{ top: 10, bottom: 0 }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '3 3' }}
                    wrapperStyle={{ 
                      filter: 'drop-shadow(0px 2px 8px rgba(0, 0, 0, 0.12))',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={30}
                    iconType="circle"
                    iconSize={isMobile ? 5 : 8}
                    wrapperStyle={{ 
                      paddingBottom: isMobile ? '5px' : '15px',
                      fontSize: isMobile ? '8px' : '12px',
                      color: '#6B7280'
                    }}
                  />
                  <Bar
                    dataKey="users"
                    name="Total Users"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    barSize={timeFilter === 'week' ? 12 : 24}
                    isAnimationActive={animationActive}
                    animationDuration={2000}
                  />
                  <Bar
                    dataKey="newUsers"
                    name="New Registrations" 
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    barSize={timeFilter === 'week' ? 10 : 20}
                    isAnimationActive={animationActive}
                    animationDuration={2000}
                  />
                  <Bar
                    dataKey="activeUsers"
                    name="Active Users"
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                    barSize={timeFilter === 'week' ? 8 : 16}
                    isAnimationActive={animationActive}
                    animationDuration={2000}
                  />
                  {getTodayIndex() !== null && (
                    <ReferenceLine
                      x={getTodayIndex()}
                      stroke="#F59E0B"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      label={{ 
                        value: 'Today', 
                        position: 'insideTopRight', 
                        fill: '#F59E0B', 
                        fontSize: 12,
                        fontWeight: 500,
                        dy: -8,
                        dx: 6
                      }}
                    />
                  )}
                  <Brush dataKey="name" height={20} stroke="#3B82F6" />
                </ComposedChart>
              ) : (
                <ComposedChart
                  data={chartData}
                  margin={{ top: 15, right: isMobile ? 5 : 30, left: isMobile ? 0 : 10, bottom: isMobile ? 5 : 10 }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                    </linearGradient>
                    <filter id="shadow" height="200%">
                      <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.1"/>
                    </filter>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="#E5E7EB" 
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB', strokeOpacity: 0.6 }}
                    tickLine={false}
                    padding={{ left: 5, right: 5 }}
                    interval={isMobile ? 1 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: isMobile ? 10 : 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => isMobile && value > 999 ? `${(value/1000).toFixed(0)}k` : value.toLocaleString()}
                    width={isMobile ? 30 : 40}
                    domain={['auto', 'auto']}
                    padding={{ top: 10, bottom: 0 }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '3 3' }}
                    wrapperStyle={{ 
                      filter: 'drop-shadow(0px 2px 8px rgba(0, 0, 0, 0.12))',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={30}
                    iconType="circle"
                    iconSize={isMobile ? 5 : 8}
                    wrapperStyle={{ 
                      paddingBottom: isMobile ? '5px' : '15px',
                      fontSize: isMobile ? '8px' : '12px',
                      color: '#6B7280'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    activeDot={{ r: 6, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
                    isAnimationActive={animationActive}
                    animationDuration={2000}
                    name="Total Users"
                  />
                  {getTodayIndex() !== null && (
                    <ReferenceLine
                      x={getTodayIndex()}
                      stroke="#F59E0B"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      label={{ 
                        value: 'Today', 
                        position: 'insideTopRight', 
                        fill: '#F59E0B', 
                        fontSize: 12,
                        fontWeight: 500,
                        dy: -8,
                        dx: 6
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    name="New Registrations"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#10B981", stroke: "#fff", strokeWidth: 1.5 }}
                    activeDot={{ 
                      r: 6, 
                      fill: "#10B981", 
                      stroke: "#fff", 
                      strokeWidth: 2,
                      filter: 'url(#shadow)'
                    }}
                    isAnimationActive={animationActive}
                    animationDuration={2000}
                  />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    name="Active Users"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#8B5CF6", stroke: "#fff", strokeWidth: 1.5 }}
                    activeDot={{ 
                      r: 6, 
                      fill: "#8B5CF6", 
                      stroke: "#fff", 
                      strokeWidth: 2,
                      filter: 'url(#shadow)'
                    }}
                    isAnimationActive={animationActive}
                    animationDuration={2000}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Legend and statistics panel */}
      <div className="px-3 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-5">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Legend */}
          <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3 sm:gap-8 bg-gray-50 dark:bg-gray-850">
            <div className="flex items-center">
              <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-blue-500 mr-1.5 sm:mr-2"></span>
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Total users</span>
            </div>
            
            <div className="flex items-center">
              <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-emerald-500 mr-1.5 sm:mr-2" style={{ backgroundColor: "#10B981" }}></span>
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">New registrations</span>
            </div>
            
            <div className="flex items-center">
              <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-purple-500 mr-1.5 sm:mr-2" style={{ backgroundColor: "#8B5CF6" }}></span>
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Active users</span>
            </div>
            
            {maxGrowthPoint !== null && (
              <div className="flex items-center">
                <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-pink-500 mr-1.5 sm:mr-2"></span>
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Peak growth</span>
              </div>
            )}
          </div>
          
          {/* Statistics */}
          {chartData.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-3 sm:px-5 py-3 sm:py-4 gap-2 sm:gap-3 bg-white dark:bg-gray-800">
              <div className="flex flex-col">
                <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-baseline gap-2">
                  {chartData[chartData.length - 1].users.toLocaleString()}
                  <span className="text-xs sm:text-sm font-medium text-gray-500">total users</span>
                </div>
              </div>

              <div className="flex items-center bg-gray-50 dark:bg-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">
                <span className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium flex items-center">
                  <ArrowUpRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1 sm:mr-1.5" />
                  +{totalNewUsers.toLocaleString()}
                </span>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 ml-1 sm:ml-1.5">new in this period</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 