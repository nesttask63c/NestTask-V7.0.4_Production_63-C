import { useState, useEffect, useRef, useMemo } from 'react';
import { X, User, Mail, Phone, Building, GraduationCap, Save, CheckCircle } from 'lucide-react';
import type { Teacher } from '../../../types/teacher';
import type { Course } from '../../../types/course';

interface TeacherEditModalProps {
  teacher: Teacher;
  courses: Course[];
  onClose: () => void;
  onSave: (id: string, updates: Partial<Teacher>, courseIds: string[]) => void;
}

export const TeacherEditModal: React.FC<TeacherEditModalProps> = ({
  teacher,
  courses,
  onClose,
  onSave,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    name: teacher.name,
    email: teacher.email || '',
    phone: teacher.phone,
    department: teacher.department || '',
    officeRoom: teacher.officeRoom || ''
  });
  const [selectedCourses, setSelectedCourses] = useState<string[]>(
    teacher.courses?.map(course => course.id) || []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');

  // Reset form when teacher changes
  useEffect(() => {
    setFormData({
      name: teacher.name,
      email: teacher.email || '',
      phone: teacher.phone,
      department: teacher.department || '',
      officeRoom: teacher.officeRoom || ''
    });
    setSelectedCourses(teacher.courses?.map(c => c.id) || []);
    setErrors({});
  }, [teacher]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const formData = new FormData(formRef.current!);
    
    if (!formData.get('name')) {
      newErrors.name = 'Name is required';
    }
    
    const email = formData.get('email') as string;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    const phone = formData.get('phone') as string;
    if (phone && !/^[\d\s\-+()]*$/.test(phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const formData = new FormData(formRef.current!);
      const updates: Partial<Teacher> = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        department: formData.get('department') as string,
        officeRoom: formData.get('officeRoom') as string
      };
      
      onSave(teacher.id, updates, selectedCourses);
    } catch (error: any) {
      console.error('Error updating teacher:', error);
      
      // Check for duplicate teacher name error
      if (error?.message?.includes('teacher with the name')) {
        setErrors(prev => ({ 
          ...prev, 
          name: 'A teacher with this name already exists' 
        }));
        
        // Focus the name field
        const nameField = document.querySelector('[name="name"]');
        if (nameField) {
          (nameField as HTMLInputElement).focus();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Filter courses based on search term
  const filteredCourses = useMemo(() => {
    const lowerSearchTerm = courseSearchTerm.toLowerCase();
    return courses.filter(
      (course) =>
        course.name.toLowerCase().includes(lowerSearchTerm) ||
        course.code.toLowerCase().includes(lowerSearchTerm)
    );
  }, [courses, courseSearchTerm]);

  // Toggle course selection
  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) => 
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 relative z-10 animate-fadeIn">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {teacher.id ? 'Edit Teacher' : 'Add Teacher'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-80px)]" ref={formRef}>
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    defaultValue={teacher.name}
                    className={`w-full px-4 py-2 rounded-xl border ${
                      errors.name 
                        ? 'border-red-300 dark:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } dark:bg-gray-700 focus:outline-none focus:ring-2 transition-colors`}
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    defaultValue={teacher.department}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="Enter department"
                  />
                </div>
                
                <div>
                  <label htmlFor="officeRoom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Office Room
                  </label>
                  <input
                    type="text"
                    id="officeRoom"
                    name="officeRoom"
                    defaultValue={teacher.officeRoom}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="Enter office room (e.g. Room 302)"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={teacher.email}
                    className={`w-full px-4 py-2 rounded-xl border ${
                      errors.email 
                        ? 'border-red-300 dark:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } dark:bg-gray-700 focus:outline-none focus:ring-2 transition-colors`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    defaultValue={teacher.phone}
                    className={`w-full px-4 py-2 rounded-xl border ${
                      errors.phone 
                        ? 'border-red-300 dark:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } dark:bg-gray-700 focus:outline-none focus:ring-2 transition-colors`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Course Assignment */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Course Assignment
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assigned Courses
                </label>
                <div className="relative">
                  <div
                    className={`w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 cursor-pointer ${
                      isDropdownOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''
                    }`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        {selectedCourses.length === 0 ? 'Select courses' : `${selectedCourses.length} course(s) selected`}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isDropdownOpen ? 'transform rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <input
                          type="text"
                          placeholder="Search courses..."
                          value={courseSearchTerm}
                          onChange={(e) => setCourseSearchTerm(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="py-1">
                        {filteredCourses.map((course) => (
                          <div
                            key={course.id}
                            className="px-4 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                            onClick={() => toggleCourse(course.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                selectedCourses.includes(course.id)
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-300 dark:border-gray-500'
                              }`}>
                                {selectedCourses.includes(course.id) && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="text-sm text-gray-700 dark:text-gray-200">{course.name}</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{course.code}</span>
                          </div>
                        ))}
                        {filteredCourses.length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            No courses found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedCourses.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedCourses.map((courseId) => {
                      const course = courses.find((c) => c.id === courseId);
                      if (!course) return null;
                      return (
                        <span
                          key={courseId}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30"
                        >
                          {course.code}
                          <button
                            type="button"
                            onClick={() => toggleCourse(courseId)}
                            className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
              } transition-colors`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChevronDown({ className }: { className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}