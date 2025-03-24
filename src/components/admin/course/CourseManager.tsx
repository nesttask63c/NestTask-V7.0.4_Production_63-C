import { useState, useMemo } from 'react';
import { CourseForm } from './CourseForm';
import { CourseList } from './CourseList';
import { BulkCourseImport } from './BulkCourseImport';
import { BarChart3, BookOpen, Download, FilePlus, Filter, PlusCircle, Upload, User, X } from 'lucide-react';
import type { Course, NewCourse } from '../../../types/course';
import type { Teacher } from '../../../types/teacher';

interface CourseManagerProps {
  courses: Course[];
  teachers: Teacher[];
  onCreateCourse: (course: NewCourse) => Promise<Course | void>;
  onUpdateCourse: (id: string, updates: Partial<Course>) => Promise<Course | void>;
  onDeleteCourse: (id: string) => Promise<void>;
  onBulkImportCourses?: (courses: NewCourse[]) => Promise<{ success: number; errors: any[] }>;
}

export function CourseManager({
  courses,
  teachers,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onBulkImportCourses
}: CourseManagerProps) {
  const [importMode, setImportMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSection, setFilterSection] = useState<string>('');
  const [filterCredit, setFilterCredit] = useState<number | ''>('');
  const [sortField, setSortField] = useState<'name' | 'code' | 'credit'>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Compute stats for dashboard
  const stats = useMemo(() => {
    const totalCourses = courses.length;
    
    // Count courses by credit
    const coursesByCredit = courses.reduce((acc, course) => {
      const credit = course.credit ?? 0;
      acc[credit] = (acc[credit] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    // Count courses by section
    const coursesBySection = courses.reduce((acc, course) => {
      if (course.section) {
        acc[course.section] = (acc[course.section] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Count courses by teacher
    const teacherSet = new Set<string>();
    courses.forEach(course => teacherSet.add(course.teacher));
    const uniqueTeachers = teacherSet.size;
    
    return {
      totalCourses,
      coursesByCredit,
      coursesBySection,
      uniqueTeachers
    };
  }, [courses]);

  // Get list of unique sections for filter dropdown
  const uniqueSections = useMemo(() => {
    const sections = new Set<string>();
    courses.forEach(course => {
      if (course.section) sections.add(course.section);
    });
    return Array.from(sections).sort();
  }, [courses]);

  // Get list of unique credits for filter dropdown
  const uniqueCredits = useMemo(() => {
    const credits = new Set<number>();
    courses.forEach(course => {
      if (course.credit !== undefined) credits.add(course.credit);
    });
    return Array.from(credits).sort((a, b) => a - b);
  }, [courses]);

  // Apply filtering and sorting
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = [...courses];
    
    // Apply section filter
    if (filterSection) {
      filtered = filtered.filter(course => course.section === filterSection);
    }
    
    // Apply credit filter
    if (filterCredit !== '') {
      filtered = filtered.filter(course => course.credit === filterCredit);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      } else {
        // For numeric values
        return sortDirection === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
    
    return filtered;
  }, [courses, filterSection, filterCredit, sortField, sortDirection]);

  const handleBulkImport = async (coursesToImport: NewCourse[]): Promise<{ success: number; errors: any[] }> => {
    if (!onBulkImportCourses) {
      return {
        success: 0,
        errors: [{ message: 'Bulk import is not available' }]
      };
    }
    
    return await onBulkImportCourses(coursesToImport);
  };

  const handleExportCourses = () => {
    // Format courses for export
    const exportData = filteredAndSortedCourses.map(course => ({
      course_code: course.code,
      course_title: course.name,
      credit: course.credit,
      section: course.section,
      teacher: course.teacher
    }));
    
    // Create JSON blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courses_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Courses</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCourses}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">By Credit</h3>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(stats.coursesByCredit).map(([credit, count]) => (
              <div key={credit} className="flex items-center gap-1">
                <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md text-sm font-medium text-green-700 dark:text-green-300">
                  {credit} cr: {count}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <FilePlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sections</h3>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 max-h-20 overflow-y-auto">
            {Object.entries(stats.coursesBySection)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([section, count]) => (
                <div key={section} className="flex items-center gap-1">
                  <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-md text-sm font-medium text-purple-700 dark:text-purple-300">
                    {section}: {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Teachers</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.uniqueTeachers}</p>
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="flex flex-wrap justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportMode(!importMode)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {importMode ? (
              <>
                <PlusCircle className="w-4 h-4" />
                Single Course Form
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Bulk Import
              </>
            )}
          </button>
          
          <button
            onClick={handleExportCourses}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Courses
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters || filterSection || filterCredit !== ''
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters {(filterSection || filterCredit !== '') && '(Active)'}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Sort by:</label>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as 'name' | 'code' | 'credit')}
            className="px-3 py-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg text-sm"
          >
            <option value="code">Course Code</option>
            <option value="name">Course Name</option>
            <option value="credit">Credit</option>
          </select>
          
          <button
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg text-sm"
          >
            {sortDirection === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-blue-800 dark:text-blue-300">Filter Courses</h3>
            <button
              onClick={() => {
                setFilterSection('');
                setFilterCredit('');
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Section
              </label>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg"
              >
                <option value="">All Sections</option>
                {uniqueSections.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credit
              </label>
              <select
                value={filterCredit}
                onChange={(e) => setFilterCredit(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg"
              >
                <option value="">All Credits</option>
                {uniqueCredits.map(credit => (
                  <option key={credit} value={credit}>{credit}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {importMode ? (
        <BulkCourseImport
          teachers={teachers}
          onImportCourses={handleBulkImport}
        />
      ) : (
        <CourseForm 
          teachers={teachers}
          onSubmit={onCreateCourse}
        />
      )}
      
      <CourseList 
        courses={filteredAndSortedCourses}
        onDeleteCourse={onDeleteCourse}
        onUpdateCourse={onUpdateCourse}
      />
    </div>
  );
}