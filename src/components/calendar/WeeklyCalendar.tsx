import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDaysInWeek, formatDate } from '../../utils/dateUtils';

interface WeeklyCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

export function WeeklyCalendar({ onDateSelect, selectedDate }: WeeklyCalendarProps) {
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  
  useEffect(() => {
    setWeekDays(getDaysInWeek(selectedDate));
  }, [selectedDate]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    onDateSelect(newDate);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatDate(weekDays[0], 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date) => {
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={`
                flex flex-col items-center p-2 rounded-xl transition-all duration-200
                ${isSelected 
                  ? 'bg-blue-600 text-white shadow-lg scale-105' 
                  : isToday
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'hover:bg-gray-50 text-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                }
              `}
            >
              <span className={`
                text-xs font-medium mb-1
                ${isSelected 
                  ? 'text-blue-100 dark:text-blue-200' 
                  : 'text-gray-400 dark:text-gray-500'
                }
              `}>
                {formatDate(date, 'EEE')}
              </span>
              <span className={`
                text-lg transition-all duration-200
                ${isSelected 
                  ? 'font-bold' 
                  : isToday 
                    ? 'font-semibold' 
                    : 'font-medium'
                }
              `}>
                {formatDate(date, 'd')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}