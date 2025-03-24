import { useState, useMemo, useEffect } from 'react';
import { useRoutines } from '../../hooks/useRoutines';
import { useCourses } from '../../hooks/useCourses';
import { useTeachers } from '../../hooks/useTeachers';
import { format, addDays, startOfWeek } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  ChevronLeft,
  ChevronRight,
  Users,
  BookOpen,
  GraduationCap,
  Building,
  User,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TeacherDetailsModal } from './TeacherDetailsModal';
import type { Teacher } from '../../types/teacher';
import { getInitials } from '../../utils/stringUtils';

export function RoutineView() {
  const { routines, loading } = useRoutines();
  const { courses } = useCourses();
  const { teachers } = useTeachers();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [enrichedSlots, setEnrichedSlots] = useState<any[]>([]);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

  const currentRoutine = routines.find(r => r.isActive) || routines[0];

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 6 });
    return Array.from({ length: 6 }, (_, i) => {
      const date = addDays(start, i);
      return {
        date,
        dayNum: format(date, 'd'),
        dayName: format(date, 'EEE'),
        isSelected: format(date, 'EEEE') === format(selectedDate, 'EEEE')
      };
    });
  }, [selectedDate]);

  // Enrich slots with course and teacher data
  useEffect(() => {
    if (!currentRoutine?.slots) {
      setEnrichedSlots([]);
      return;
    }

    console.log("Teachers available for RoutineView:", teachers.length);

    const enriched = currentRoutine.slots.map(slot => {
      const course = slot.courseId ? courses.find(c => c.id === slot.courseId) : undefined;
      const teacher = slot.teacherId ? teachers.find(t => t.id === slot.teacherId) : undefined;
      
      // Log teacher details for debugging
      console.log(`RoutineView - Slot ${slot.id} - teacherId: ${slot.teacherId}, teacherName: ${slot.teacherName}, Found teacher:`, teacher?.name || "null");
      
      // If courseName isn't set but we have a course, populate it
      const courseName = slot.courseName || (course ? course.name : undefined);
      // Add teacherName for direct access (use slot.teacherName if available)
      const teacherName = slot.teacherName || (teacher ? teacher.name : undefined);
      
      return {
        ...slot,
        course,
        teacher,
        courseName,
        teacherName
      };
    });

    setEnrichedSlots(enriched);
  }, [currentRoutine, courses, teachers]);

  const filteredSlots = useMemo(() => {
    return enrichedSlots.filter(slot => {
      const matchesSearch = searchTerm === '' || 
        slot.course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.course?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSection = !selectedSection || slot.section === selectedSection;
      const matchesDay = format(selectedDate, 'EEEE') === slot.dayOfWeek;
      
      return matchesSearch && matchesSection && matchesDay;
    });
  }, [enrichedSlots, searchTerm, selectedSection, selectedDate]);

  const sections = useMemo(() => {
    const uniqueSections = new Set<string>();
    enrichedSlots.forEach(slot => {
      if (slot.section) {
        uniqueSections.add(slot.section);
      }
    });
    return Array.from(uniqueSections).sort();
  }, [enrichedSlots]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentRoutine) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Routine Available</h2>
        <p className="text-gray-500 dark:text-gray-400">
          There are no active routines at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-1 sm:px-3 py-2 sm:py-4">
      {/* Header Section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-2 sm:mb-4 p-2 sm:p-3">
        {/* Mobile View Header */}
        <div className="flex flex-col space-y-2 sm:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h1 className="text-base font-bold text-gray-900 dark:text-white">Class Routine</h1>
            </div>
            <button 
              onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
              className="p-1.5 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {currentRoutine.name} - {currentRoutine.semester}
          </p>
          
          {/* Mobile Search Input (toggled via state) */}
          <AnimatePresence>
            {isMobileSearchVisible && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="relative w-full">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 text-xs border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
            >
              <option value="">All Sections</option>
              {sections.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-400 w-3.5 h-3.5" />
          </div>
        </div>

        {/* Desktop View Header */}
        <div className="hidden sm:flex sm:flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              Class Routine
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {currentRoutine.name} - {currentRoutine.semester}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            {sections.length > 0 && (
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
                >
                  <option value="">All Sections</option>
                  {sections.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
                <Users className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <ChevronRight className="absolute right-2.5 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-400 w-3.5 h-3.5" />
              </div>
            )}

            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search courses, teachers, rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Strip */}
      <div className="mb-2 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <button
            onClick={() => {
              const prevDay = addDays(selectedDate, -1);
              setSelectedDate(prevDay);
            }}
            className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <h2 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-white">
            {format(selectedDate, 'EEE, MMM d')}
          </h2>

          <button
            onClick={() => {
              const nextDay = addDays(selectedDate, 1);
              setSelectedDate(nextDay);
            }}
            className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="grid grid-cols-6 gap-0.5 sm:gap-1">
          {weekDays.map((day) => (
            <button
              key={day.dayName}
              onClick={() => setSelectedDate(day.date)}
              className={`
                flex flex-col items-center py-1 sm:py-1.5 px-0.5 sm:px-1 md:p-2 lg:p-3 rounded-md sm:rounded-lg transition-all duration-200 touch-manipulation
                ${day.isSelected
                  ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <span className={`
                text-[8px] xs:text-[9px] sm:text-xs font-medium
                ${day.isSelected
                  ? 'text-blue-100'
                  : 'text-gray-500 dark:text-gray-400'
                }
              `}>
                {day.dayName}
              </span>
              <span className={`
                text-sm xs:text-base sm:text-lg md:text-xl font-bold
                ${day.isSelected
                  ? 'text-white'
                  : 'text-gray-900 dark:text-white'
                }
              `}>
                {day.dayNum}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Class Schedule */}
      <div className="space-y-1.5 sm:space-y-2">
        {filteredSlots.length === 0 ? (
          <div className="text-center py-6 sm:py-8 bg-white dark:bg-gray-800 rounded-lg">
            <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500 mx-auto mb-2 sm:mb-3" />
            <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-1">
              No Classes Scheduled
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2 sm:px-4">
              There are no classes scheduled for this day
              {selectedSection && ` in section ${selectedSection}`}
              {searchTerm && ` matching "${searchTerm}"`}.
            </p>
          </div>
        ) : (
          filteredSlots
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((slot) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-md sm:rounded-lg md:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700/50"
              >
                <div className="flex flex-col sm:flex-row items-stretch">
                  {/* Time Column */}
                  <div className="w-[70px] xs:w-[90px] sm:w-[80px] md:w-[100px] lg:w-[120px] bg-gray-50 dark:bg-gray-800/40 flex flex-col justify-between items-center py-3 px-2 sm:p-3 md:p-4 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700/50">
                    <div className="flex flex-col items-center">
                      <div className="text-lg sm:text-base md:text-lg lg:text-xl font-medium text-gray-700 dark:text-gray-200">
                        {format(new Date(`2000-01-01T${slot.startTime}`), 'h:mm')}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center py-2 sm:py-3 md:py-4 w-full space-y-2">
                      <div className="w-8 sm:w-10 md:w-12 border-t border-gray-300 dark:border-gray-600"></div>
                      <div className="w-6 sm:w-8 md:w-10 border-t border-gray-300 dark:border-gray-600"></div>
                      <div className="w-4 sm:w-6 md:w-8 border-t border-gray-300 dark:border-gray-600"></div>
                      <div className="w-6 sm:w-8 md:w-10 border-t border-gray-300 dark:border-gray-600"></div>
                      <div className="w-8 sm:w-10 md:w-12 border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="text-lg sm:text-base md:text-lg lg:text-xl font-medium text-gray-700 dark:text-gray-200">
                        {format(new Date(`2000-01-01T${slot.endTime}`), 'h:mm')}
                      </div>
                    </div>
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 p-2.5 xs:p-3 sm:p-3.5 md:p-4.5">
                    <h3 className="text-xs xs:text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-1.5 md:mb-2 line-clamp-2">
                      {slot.courseName || (slot.course ? slot.course.name : 'No Course Name')}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] xs:text-xs sm:text-sm">
                      <div className="text-gray-500 dark:text-gray-400">Course:</div>
                      <div className="text-right font-medium">{slot.course?.code || 'N/A'}</div>
                      
                      <div className="text-gray-500 dark:text-gray-400">Section:</div>
                      <div className="text-right font-medium">{slot.section || 'N/A'}</div>
                      
                      <div className="text-gray-500 dark:text-gray-400">Teacher:</div>
                      <div className="text-right">
                        {slot.teacherId ? (
                          <button 
                            onClick={() => {
                              // Find the full teacher object for modal display
                              const fullTeacher = teachers.find(t => t.id === slot.teacherId);
                              setSelectedTeacher(fullTeacher || null);
                            }} 
                            className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                            title={slot.teacherName || (slot.teacher ? slot.teacher.name : 'N/A')}
                          >
                            {getInitials(slot.teacherName || (slot.teacher ? slot.teacher.name : undefined))}
                          </button>
                        ) : (
                          'N/A'
                        )}
                      </div>
                      
                      <div className="text-gray-500 dark:text-gray-400">Room:</div>
                      <div className="text-right font-medium">{slot.roomNumber || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
        )}
      </div>

      {/* Teacher Details Modal */}
      {selectedTeacher && (
        <TeacherDetailsModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
        />
      )}
    </div>
  );
}