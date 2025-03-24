import { useState, useRef, useEffect } from 'react';
import { Book, Trash2, Edit2, GitBranch as BrandTelegram, User, Search, Link, Lock, Hash, CreditCard, Check, X, AlertTriangle, ExternalLink, BookOpen, Eye } from 'lucide-react';
import { CourseEditModal } from './CourseEditModal';
import type { Course } from '../../../types/course';

interface CourseListProps {
  courses: Course[];
  onDeleteCourse: (id: string) => Promise<void>;
  onUpdateCourse: (id: string, updates: Partial<Course>) => Promise<Course | void>;
}

export function CourseList({ courses, onDeleteCourse, onUpdateCourse }: CourseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const deleteModalRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the delete modal to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deleteModalRef.current && !deleteModalRef.current.contains(event.target as Node)) {
        resetDeleteState();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset delete state
  const resetDeleteState = () => {
    setCourseToDelete(null);
    setIsDeleting(false);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  // Clear success message after 3 seconds
  useEffect(() => {
    if (deleteSuccess) {
      const timer = setTimeout(() => {
        setDeleteSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess]);

  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      await onDeleteCourse(courseToDelete.id);
      
      setDeleteSuccess(`Course "${courseToDelete.name}" was successfully deleted.`);
      setTimeout(() => {
        resetDeleteState();
      }, 1500);
    } catch (error) {
      console.error('Error deleting course:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete course');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden mt-6">
        {deleteSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 m-4">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700 dark:text-green-300">{deleteSuccess}</p>
            </div>
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Courses ({filteredCourses.length})
            </h2>
            
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white w-64"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              
              <div className="flex border dark:border-gray-600 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  title="Grid view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  title="List view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 group"
                >
                  <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                        {course.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                          {course.code}
                        </span>
                        {course.section && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                            {course.section}
                          </span>
                        )}
                        {course.credit !== undefined && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                            {course.credit} Credit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-center mb-3">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">{course.teacher}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {course.blcLink && (
                        <a
                          href={course.blcLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md"
                        >
                          <Link className="w-3 h-3" />
                          BLC
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                      
                      {course.telegramGroup && (
                        <a
                          href={course.telegramGroup}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 rounded-md"
                        >
                          <BrandTelegram className="w-3 h-3" />
                          Telegram
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                      
                      {course.blcEnrollKey && (
                        <div className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md">
                          <Lock className="w-3 h-3" />
                          Key: {course.blcEnrollKey}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-750 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingCourse(course)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit course"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCourseToDelete(course)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teacher</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Links</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">{course.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{course.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{course.teacher}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {course.section && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                              {course.section}
                            </span>
                          )}
                          {course.credit !== undefined && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                              {course.credit} Cr
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {course.blcLink && (
                            <a
                              href={course.blcLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md"
                            >
                              <Link className="w-3 h-3" />
                              BLC
                            </a>
                          )}
                          
                          {course.telegramGroup && (
                            <a
                              href={course.telegramGroup}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 rounded-md"
                            >
                              <BrandTelegram className="w-3 h-3" />
                              Telegram
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingCourse(course)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit course"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCourseToDelete(course)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <Book className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No courses found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {searchTerm ? 'Try a different search term' : 'Add your first course above'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div 
            ref={deleteModalRef}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Delete Course</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete the course <span className="font-medium text-gray-900 dark:text-white">{courseToDelete.name}</span>? This action cannot be undone.
            </p>
            
            {deleteError && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 mb-4">
                <p className="text-red-700 dark:text-red-300 text-sm">{deleteError}</p>
              </div>
            )}
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-end gap-3">
              <button
                onClick={resetDeleteState}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                disabled={isDeleting}
              >
                <X className="w-4 h-4" /> 
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> 
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCourse && (
        <CourseEditModal
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onUpdate={(updates) => {
            onUpdateCourse(editingCourse.id, updates);
            setEditingCourse(null);
          }}
        />
      )}
    </>
  );
}