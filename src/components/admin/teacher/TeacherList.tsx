import { useState, useMemo } from 'react';
import { Search, Trash2, Edit2, Phone, Mail, Building, GraduationCap, X, AlertTriangle, User, ChevronDown } from 'lucide-react';
import { TeacherEditModal } from './TeacherEditModal';
import { showSuccessToast, showInfoToast } from '../../../utils/notifications';
import type { Teacher } from '../../../types/teacher';
import type { Course } from '../../../types/course';

interface TeacherListProps {
  teachers: Teacher[];
  courses: Course[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onUpdateTeacher: (id: string, updates: Partial<Teacher>, courseIds: string[]) => void;
  onDeleteTeacher: (id: string) => void;
}

export function TeacherList({ 
  teachers, 
  courses, 
  searchTerm, 
  onSearchChange,
  onUpdateTeacher, 
  onDeleteTeacher 
}: TeacherListProps) {
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ 
    isOpen: boolean; 
    teacherId: string; 
    teacherName: string;
    isDeleting: boolean;
    error: string | null;
  }>({ 
    isOpen: false, 
    teacherId: '',
    teacherName: '',
    isDeleting: false,
    error: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter teachers based on search term
  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      
      // Search in name, email, phone, department, officeRoom
      const nameMatch = teacher.name.toLowerCase().includes(searchLower);
      const emailMatch = teacher.email?.toLowerCase().includes(searchLower) || false;
      const phoneMatch = teacher.phone?.toLowerCase().includes(searchLower) || false;
      const deptMatch = teacher.department?.toLowerCase().includes(searchLower) || false;
      const officeMatch = teacher.officeRoom?.toLowerCase().includes(searchLower) || false;
      
      // Search in courses
      const courseMatch = teacher.courses?.some(
        course => course.name.toLowerCase().includes(searchLower) || 
                 course.code.toLowerCase().includes(searchLower)
      ) || false;
      
      return nameMatch || emailMatch || phoneMatch || deptMatch || officeMatch || courseMatch;
    });
  }, [teachers, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTeachers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTeachers, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Open delete confirmation dialog
  const openDeleteConfirmation = (id: string, name: string) => {
    setDeleteConfirmation({
      isOpen: true,
      teacherId: id,
      teacherName: name,
      isDeleting: false,
      error: null
    });
  };

  // Close delete confirmation dialog
  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      teacherId: '',
      teacherName: '',
      isDeleting: false,
      error: null
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      const teacherName = deleteConfirmation.teacherName;
      const teacherId = deleteConfirmation.teacherId;
      
      // Set deleting state to show loading indicator
      setDeleteConfirmation(current => ({
        ...current,
        isDeleting: true,
        error: null
      }));
      
      // Execute the delete operation
      try {
        await onDeleteTeacher(teacherId);
        
        // Close the confirmation dialog on success
        closeDeleteConfirmation();
      } catch (error) {
        // Show error in the dialog but keep it open for retry
        console.error('Error deleting teacher:', error);
        setDeleteConfirmation(current => ({
          ...current,
          isDeleting: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }));
      }
    } catch (error) {
      console.error('Error in delete confirmation process:', error);
      setDeleteConfirmation(current => ({
        ...current,
        isDeleting: false,
        error: 'An unexpected error occurred'
      }));
    }
  };
  
  // Clear search
  const clearSearch = () => {
    onSearchChange('');
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-5 border-b dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search by name, email, phone, department or course..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors duration-200"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            {searchTerm && (
              <button 
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full">
            {paginatedTeachers.length > 0 ? (
              <>
                <div className="hidden sm:flex border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-750 text-xs uppercase font-medium text-gray-500 dark:text-gray-400">
                  <div className="py-3 px-4 w-1/3">Teacher</div>
                  <div className="py-3 px-4 w-1/3">Contact Information</div>
                  <div className="py-3 px-4 w-1/3">Courses & Actions</div>
                </div>
                {paginatedTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="group border-b dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row py-4 px-4">
                      <div className="w-full sm:w-1/3 mb-3 sm:mb-0">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1 flex items-center">
                          <User className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0" />
                          {teacher.name}
                        </h3>
                        
                        <div className="flex flex-col gap-1.5 mt-2">
                          {teacher.department && (
                            <div className="flex items-center gap-2 text-xs">
                              <Building className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                {teacher.department}
                              </span>
                            </div>
                          )}
                          
                          {teacher.officeRoom && (
                            <div className="flex items-center gap-2 text-xs">
                              <Building className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-300">
                                Office: {teacher.officeRoom}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-1/3 space-y-2 text-sm mb-3 sm:mb-0">
                        {teacher.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">{teacher.phone}</span>
                          </div>
                        )}
                        
                        {teacher.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300 truncate max-w-[200px]">{teacher.email}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="w-full sm:w-1/3 flex items-start justify-between">
                        <div className="flex-1">
                          {teacher.courses && teacher.courses.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                              {teacher.courses.map(course => (
                                <span
                                  key={course.id}
                                  className="px-2 py-1 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30"
                                  title={course.name}
                                >
                                  {course.code}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400 italic">No courses assigned</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingTeacher(teacher)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit teacher"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteConfirmation(teacher.id, teacher.name)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete teacher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No teachers found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {searchTerm ? 'Try a different search term' : 'Add your first teacher above'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-0">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTeachers.length)} of {filteredTeachers.length} teachers
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${
                  currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${
                  currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Prev
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-md ${
                      pageNum === currentPage 
                        ? 'bg-blue-500 text-white font-medium' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${
                  currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${
                  currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-50">
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl animate-fadeIn border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling to the backdrop
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Confirm Deletion</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-white">{deleteConfirmation.teacherName}</span>? This action cannot be undone.
            </p>
            
            {deleteConfirmation.error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
                <p className="flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Error: {deleteConfirmation.error}</span>
                </p>
                <p className="mt-1 ml-6 text-xs">Please try again or contact an administrator if the issue persists.</p>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteConfirmation}
                className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
                disabled={deleteConfirmation.isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmation.isDeleting}
                className={`px-4 py-2 rounded-lg ${
                  deleteConfirmation.isDeleting 
                    ? 'bg-red-400 dark:bg-red-500 cursor-wait' 
                    : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                } text-white shadow-sm hover:shadow transition-all flex items-center`}
              >
                {deleteConfirmation.isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Teacher
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TeacherEditModal component remains the same */}
      {editingTeacher && (
        <TeacherEditModal
          teacher={editingTeacher}
          courses={courses}
          onClose={() => setEditingTeacher(null)}
          onSave={(id, updates, courseIds) => {
            onUpdateTeacher(id, updates, courseIds);
            setEditingTeacher(null);
          }}
        />
      )}
    </>
  );
}