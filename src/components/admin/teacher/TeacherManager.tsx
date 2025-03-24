import { useState, useMemo, useRef } from 'react';
import { TeacherForm } from './TeacherForm';
import { TeacherList } from './TeacherList';
import { BulkTeacherImport } from './BulkTeacherImport';
import { Filter, GraduationCap, Users, User, Building, Upload, FilePlus, Search, BarChart2, Download, Printer, FileText, ChevronDown, ArrowUpRight, BarChart3, ArrowUpDown, RefreshCw } from 'lucide-react';
import type { Teacher, NewTeacher } from '../../../types/teacher';
import type { Course } from '../../../types/course';
import { TeacherBulkImportItem } from '../../../services/teacher.service';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../../utils/notifications';

interface TeacherManagerProps {
  teachers: Teacher[];
  courses: Course[];
  onCreateTeacher: (teacher: NewTeacher, courseIds: string[]) => Promise<Teacher | undefined>;
  onUpdateTeacher: (id: string, updates: Partial<Teacher>, courseIds: string[]) => Promise<Teacher | undefined>;
  onDeleteTeacher: (id: string) => Promise<void>;
  onBulkImportTeachers?: (teachers: TeacherBulkImportItem[]) => Promise<{ success: number; errors: { index: number; error: string }[] }>;
}

export function TeacherManager({
  teachers,
  courses,
  onCreateTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onBulkImportTeachers
}: TeacherManagerProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [importMode, setImportMode] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [filterWithCourses, setFilterWithCourses] = useState<'all' | 'with' | 'without'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<'name' | 'department'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showDepartmentChart, setShowDepartmentChart] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Compute stats for dashboard
  const stats = useMemo(() => {
    const totalTeachers = teachers.length;
    
    // Count teachers by department
    const teachersByDepartment = teachers.reduce((acc, teacher) => {
      const department = teacher.department || 'Unspecified';
      acc[department] = (acc[department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Sort departments by count
    const sortedDepartments = Object.entries(teachersByDepartment)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Count teachers by course assignment
    const teacherWithCourses = teachers.filter(teacher => 
      teacher.courses && teacher.courses.length > 0
    ).length;
    
    // Count most common course assignments
    const courseAssignmentCounts = courses.map(course => {
      const assignedTeachers = teachers.filter(teacher => 
        teacher.courses?.some(c => c.id === course.id)
      ).length;
      
      return {
        courseCode: course.code,
        courseName: course.name,
        count: assignedTeachers
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);
    
    // Calculate recently added teachers (assuming createdAt is ISO string)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentlyAdded = teachers.filter(teacher => {
      if (!teacher.createdAt) return false;
      const createdDate = new Date(teacher.createdAt);
      return createdDate >= thirtyDaysAgo;
    }).length;
    
    return {
      totalTeachers,
      teachersByDepartment,
      sortedDepartments,
      teacherWithCourses,
      teachersWithoutCourses: totalTeachers - teacherWithCourses,
      courseAssignmentCounts,
      recentlyAdded
    };
  }, [teachers, courses]);

  // Get list of unique departments for filter dropdown
  const uniqueDepartments = useMemo(() => {
    const departments = new Set<string>();
    teachers.forEach(teacher => {
      if (teacher.department) departments.add(teacher.department);
    });
    return Array.from(departments).sort();
  }, [teachers]);

  // Apply filtering and sorting
  const filteredAndSortedTeachers = useMemo(() => {
    let filtered = [...teachers];
    
    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(teacher => 
        teacher.name.toLowerCase().includes(searchLower) ||
        (teacher.email && teacher.email.toLowerCase().includes(searchLower)) ||
        teacher.phone.toLowerCase().includes(searchLower) ||
        (teacher.department && teacher.department.toLowerCase().includes(searchLower)) ||
        (teacher.officeRoom && teacher.officeRoom.toLowerCase().includes(searchLower)) ||
        teacher.courses?.some(course => 
          course.name.toLowerCase().includes(searchLower) ||
          course.code.toLowerCase().includes(searchLower)
        )
      );
    }
    
    // Apply department filter
    if (filterDepartment) {
      filtered = filtered.filter(teacher => teacher.department === filterDepartment);
    }
    
    // Apply course filter
    if (filterCourse) {
      filtered = filtered.filter(teacher => 
        teacher.courses?.some(course => course.id === filterCourse)
      );
    }
    
    // Apply course assignment filter
    if (filterWithCourses === 'with') {
      filtered = filtered.filter(teacher => 
        teacher.courses && teacher.courses.length > 0
      );
    } else if (filterWithCourses === 'without') {
      filtered = filtered.filter(teacher => 
        !teacher.courses || teacher.courses.length === 0
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      // Compare values (all string values)
      return sortDirection === 'asc' 
        ? (aValue as string).localeCompare(bValue as string) 
        : (bValue as string).localeCompare(aValue as string);
    });
    
    return filtered;
  }, [teachers, searchTerm, filterDepartment, filterCourse, filterWithCourses, sortField, sortDirection]);

  const handleBulkImport = async (teachersData: TeacherBulkImportItem[]): Promise<{ success: number; errors: { index: number; error: string }[] }> => {
    if (!onBulkImportTeachers) {
      return {
        success: 0,
        errors: [{ index: -1, error: 'Bulk import is not available' }]
      };
    }
    
    return await onBulkImportTeachers(teachersData);
  };

  // Calculate the maximum bar width for the department chart
  const maxDepartmentCount = Math.max(...Object.values(stats.teachersByDepartment));

  // Export teachers to CSV
  const exportToCSV = () => {
    // Get visible teachers from the filtered list
    const dataToExport = filteredAndSortedTeachers.map(teacher => {
      const assignedCourses = teacher.courses 
        ? teacher.courses.map(c => c.code).join(', ')
        : '';
        
      return {
        Name: teacher.name,
        Email: teacher.email || '',
        Phone: teacher.phone,
        Department: teacher.department || '',
        'Office Room': teacher.officeRoom || '',
        'Assigned Courses': assignedCourses,
        'Created At': teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A'
      };
    });
    
    // Create CSV content
    if (dataToExport.length === 0) {
      alert('No teacher data to export');
      return;
    }
    
    const headers = Object.keys(dataToExport[0]);
    const csvRows = [
      headers.join(','),
      ...dataToExport.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Handle values with commas by quoting them
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `teachers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportMenu(false);
  };

  // Print teacher list
  const printTeacherList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
      <head>
        <title>Teacher List</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .courses { font-size: 0.9em; color: #666; }
          .footer { margin-top: 20px; text-align: center; font-size: 0.8em; color: #666; }
        </style>
      </head>
      <body>
        <h1>Teacher List</h1>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Department</th>
              <th>Office Room</th>
              <th>Assigned Courses</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAndSortedTeachers.map(teacher => `
              <tr>
                <td>${teacher.name}</td>
                <td>${teacher.email || '-'}</td>
                <td>${teacher.phone}</td>
                <td>${teacher.department || '-'}</td>
                <td>${teacher.officeRoom || '-'}</td>
                <td class="courses">${teacher.courses ? teacher.courses.map(c => c.code).join(', ') : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          Generated on ${new Date().toLocaleString()} | Total: ${filteredAndSortedTeachers.length} teachers
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);
    
    setShowExportMenu(false);
  };

  // Calculate total assigned courses
  const calculateTotalAssignedCourses = (teacherList: Teacher[]): number => {
    return teacherList.reduce((total, teacher) => total + (teacher.courses?.length || 0), 0);
  };

  // Calculate percentage of teachers with course assignments
  const calculateCourseAssignmentPercentage = (teacherList: Teacher[]): number => {
    if (teacherList.length === 0) return 0;
    const teachersWithCourses = teacherList.filter(teacher => teacher.courses && teacher.courses.length > 0).length;
    return Math.round((teachersWithCourses / teacherList.length) * 100);
  };

  // Calculate average courses per teacher
  const calculateAverageCoursesPerTeacher = (teacherList: Teacher[]): number => {
    if (teacherList.length === 0) return 0;
    const totalCourses = calculateTotalAssignedCourses(teacherList);
    return totalCourses / teacherList.length;
  };

  // Find max courses assigned to a single teacher
  const calculateMaxCoursesPerTeacher = (teacherList: Teacher[]): number => {
    if (teacherList.length === 0) return 0;
    return Math.max(...teacherList.map(teacher => teacher.courses?.length || 0));
  };

  // Get top departments by teacher count
  const calculateTopDepartments = (teacherList: Teacher[]): Array<{name: string, count: number}> => {
    const departmentCounts: Record<string, number> = {};
    
    // Count teachers in each department
    teacherList.forEach(teacher => {
      if (teacher.department) {
        departmentCounts[teacher.department] = (departmentCounts[teacher.department] || 0) + 1;
      }
    });
    
    // Convert to array and sort
    const sortedDepartments = Object.entries(departmentCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
    
    return sortedDepartments;
  };

  // Delete teacher function with robust error handling
  const handleDeleteTeacher = async (id: string): Promise<void> => {
    try {
      console.log(`TeacherManager: Preparing to delete teacher with ID: ${id}`);
      setError(null);
      
      // Find the teacher to be deleted (for notification purposes)
      const teacherToDelete = teachers.find(t => t.id === id);
      if (!teacherToDelete) {
        console.error(`TeacherManager: Cannot find teacher with ID ${id} to delete`);
        showErrorToast(`Cannot delete teacher: Teacher not found in local state. Try refreshing the page.`);
        return;
      }
      
      // Show deletion in progress message
      showInfoToast(`Deleting teacher: ${teacherToDelete.name}...`);
      
      try {
        console.log(`TeacherManager: Calling onDeleteTeacher function for ID: ${id}`);
        await onDeleteTeacher(id);
        console.log(`TeacherManager: Delete operation completed successfully for ID: ${id}`);
        showSuccessToast(`Teacher ${teacherToDelete.name} deleted successfully`);
      } catch (err) {
        console.error('TeacherManager: Error during delete operation:', err);
        
        // Handle specific known error cases
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        if (errorMessage.includes('PGRST116') || errorMessage.includes('no rows')) {
          showErrorToast(`Teacher may have already been deleted or does not exist.`);
        } else if (errorMessage.includes('foreign key constraint')) {
          showErrorToast(`Cannot delete teacher: This teacher is referenced by other data in the system. Check the troubleshooting guide.`);
        } else {
          setError(`Failed to delete teacher: ${errorMessage}`);
          showErrorToast(`Failed to delete teacher: ${errorMessage}. Please try again.`);
        }
        
        throw err; // Re-throw to propagate the error
      }
    } catch (err) {
      console.error('TeacherManager: Outer error handler:', err);
      // This catch block handles any errors that might occur outside the delete operation
      // like issues with finding the teacher or showing notifications
    }
  };

  return (
    <div className="space-y-6">
      {/* Professional Header with Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-md border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Teacher Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage faculty members and their course assignments</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors border border-blue-100 dark:border-blue-800/30"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden z-10 border dark:border-gray-700 animate-fadeIn">
                <button
                  onClick={exportToCSV}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export as CSV
                </button>
                <button
                  onClick={printTeacherList}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Teacher List
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setImportMode(!importMode)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-colors shadow-sm hover:shadow-md"
          >
            {importMode ? (
              <>
                <FilePlus className="w-4 h-4" />
                Manual Entry
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Bulk Import
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Teachers</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{teachers.length}</h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center text-xs mt-4">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500 font-medium">
              {filteredAndSortedTeachers.length === teachers.length
                ? '100%'
                : `${Math.round((filteredAndSortedTeachers.length / teachers.length) * 100)}%`}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">showing in current filters</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Departments</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {Array.from(new Set(teachers.map(t => t.department).filter(Boolean))).length}
              </h3>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <Building className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-1">
            {calculateTopDepartments(teachers).map((dept, index) => (
              <div 
                key={dept.name} 
                className="flex items-center text-xs"
                title={`${dept.name}: ${dept.count} teachers`}
              >
                <div 
                  className={`w-2 h-2 rounded-full mr-1 ${
                    index === 0 ? 'bg-indigo-500' : 
                    index === 1 ? 'bg-indigo-400' : 'bg-indigo-300'
                  }`} 
                />
                <span className="text-gray-700 dark:text-gray-300 truncate">{dept.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned Courses</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {calculateTotalAssignedCourses(teachers)}
              </h3>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${calculateCourseAssignmentPercentage(teachers)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {calculateCourseAssignmentPercentage(teachers)}%
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Courses/Teacher</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {calculateAverageCoursesPerTeacher(teachers).toFixed(1)}
              </h3>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <BarChart2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs mt-4">
            <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
            <div className="flex-1 flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <span className="bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded text-orange-700 dark:text-orange-300">
                {calculateMaxCoursesPerTeacher(teachers)}
              </span>
              <span>highest course load</span>
            </div>
          </div>
        </div>
      </div>

      {/* Department Distribution Chart */}
      {showDepartmentChart && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-900 dark:text-white">Department Distribution</h3>
            <button
              onClick={() => setShowDepartmentChart(false)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Hide
              <ChevronDown className="w-4 h-4 rotate-180" />
            </button>
          </div>
          
          <div className="space-y-3">
            {stats.sortedDepartments.map(([department, count]) => (
              <div key={department} className="flex items-center">
                <div className="w-28 text-sm text-gray-600 dark:text-gray-400 truncate" title={department}>
                  {department}
                </div>
                <div className="flex-1 h-8 relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-purple-100 dark:bg-purple-900/30 rounded-r-full"
                    style={{ width: `${(count / maxDepartmentCount) * 100}%` }}
                  ></div>
                  <div 
                    className="absolute top-0 left-0 h-full bg-purple-500 dark:bg-purple-600 rounded-r-full opacity-80" 
                    style={{ width: `${(count / maxDepartmentCount) * 100 * 0.7}%` }}
                  ></div>
                  <div className="absolute top-0 left-2 h-full flex items-center text-sm font-medium text-purple-900 dark:text-purple-200">
                    {count} {count === 1 ? 'teacher' : 'teachers'}
                  </div>
                </div>
              </div>
            ))}
            
            {stats.sortedDepartments.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No department data available
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Top Course Assignments</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.courseAssignmentCounts.map(({ courseCode, courseName, count }) => (
                <div key={courseCode} className="bg-gray-50 dark:bg-gray-750 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg mr-3">
                      <GraduationCap className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{courseCode}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={courseName}>{courseName}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{count}</div>
                </div>
              ))}
              
              {stats.courseAssignmentCounts.length === 0 && (
                <div className="text-center py-2 text-gray-500 dark:text-gray-400 col-span-full">
                  No course assignment data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search/Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 animate-fadeIn">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Search & Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search by Name/Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, phone..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <div className="relative">
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors appearance-none"
                >
                  <option value="">All Departments</option>
                  {Array.from(new Set(teachers.map(t => t.department).filter(Boolean))).map(
                    (department) => (
                      <option key={department as string} value={department as string}>
                        {department}
                      </option>
                    )
                  )}
                </select>
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course Assignment
              </label>
              <div className="relative">
                <select
                  value={filterWithCourses}
                  onChange={(e) => setFilterWithCourses(e.target.value as 'all' | 'with' | 'without')}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors appearance-none"
                >
                  <option value="all">All Teachers</option>
                  <option value="with">With Course Assignments</option>
                  <option value="without">Without Course Assignments</option>
                </select>
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <div className="relative">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as 'name' | 'department')}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors appearance-none"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="department">Department</option>
                </select>
                <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterDepartment('');
                  setFilterWithCourses('all');
                  setSortField('name');
                  setSortDirection('asc');
                }}
                className="flex items-center gap-2 text-sm px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Filters
              </button>
            </div>

            <div className="flex items-end justify-end lg:justify-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredAndSortedTeachers.length} teacher{filteredAndSortedTeachers.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </div>
      )}

      {!importMode ? (
        <TeacherForm
          courses={courses}
          onSubmit={onCreateTeacher}
        />
      ) : (
        <BulkTeacherImport
          courses={courses}
          onImportTeachers={handleBulkImport}
        />
      )}
      
      <TeacherList
        teachers={filteredAndSortedTeachers}
        courses={courses}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onUpdateTeacher={onUpdateTeacher}
        onDeleteTeacher={handleDeleteTeacher}
      />
    </div>
  );
}