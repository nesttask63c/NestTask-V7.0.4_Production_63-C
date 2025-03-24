import { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, Building, GraduationCap, Plus, ChevronUp, ChevronDown, Search, X, Check, AlertCircle } from 'lucide-react';
import type { NewTeacher } from '../../../types/teacher';
import type { Course } from '../../../types/course';
import type { Teacher } from '../../../types/teacher';

interface TeacherFormProps {
  courses: Course[];
  onSubmit: (teacher: NewTeacher, courseIds: string[]) => Promise<Teacher | undefined>;
}

export function TeacherForm({ courses, onSubmit }: TeacherFormProps) {
  const [teacher, setTeacher] = useState<NewTeacher>({
    name: '',
    email: '',
    phone: '',
    department: '',
    officeRoom: ''
  });
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [formStatus, setFormStatus] = useState<{ success: boolean; message: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCourseDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset form status after 5 seconds
  useEffect(() => {
    if (formStatus) {
      const timer = setTimeout(() => {
        setFormStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [formStatus]);

  // Handle keyboard navigation for dropdown
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (showCourseDropdown && (event.key === 'Escape' || event.key === 'Esc')) {
        setShowCourseDropdown(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCourseDropdown]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate name (required)
    if (!teacher.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate phone (required and format)
    if (!teacher.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\+\-\(\)\.]+$/.test(teacher.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    // Validate email (optional but valid format if provided)
    if (teacher.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teacher.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setFormStatus({
        success: false,
        message: 'Please fix the errors in the form'
      });
      // Scroll to first error field
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setIsSubmitting(true);
    setFormStatus(null);
    
    try {
      await onSubmit(teacher, selectedCourses);
      setTeacher({
        name: '',
        email: '',
        phone: '',
        department: '',
        officeRoom: ''
      });
      setSelectedCourses([]);
      setErrors({});
      setFormStatus({
        success: true,
        message: 'Teacher added successfully!'
      });
      
      // Scroll to top of form
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      
      // Check for duplicate teacher name error
      if (error.message && error.message.includes('teacher with the name')) {
        setErrors(prev => ({ ...prev, name: 'A teacher with this name already exists' }));
        
        // Focus the name field
        const nameField = document.querySelector('[name="name"]');
        if (nameField) {
          (nameField as HTMLInputElement).focus();
        }
      }
      
      setFormStatus({
        success: false,
        message: error.message || 'Failed to add teacher. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof NewTeacher, value: string) => {
    setTeacher(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Handle with keyboard for accessibility
  const handleCourseKeyDown = (event: React.KeyboardEvent, courseId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleCourse(courseId);
    }
  };

  const filteredCourses = courses.filter(course => 
    courseSearchTerm === '' || 
    course.name.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6 overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
      {/* Collapsible Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 cursor-pointer bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => setIsFormExpanded(!isFormExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isFormExpanded}
        aria-controls="teacher-form-content"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsFormExpanded(!isFormExpanded);
          }
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-sm">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Teacher</h2>
        </div>
        <button 
          type="button"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-full p-1"
          aria-label={isFormExpanded ? "Collapse form" : "Expand form"}
        >
          {isFormExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Form Content */}
      {isFormExpanded && (
        <div id="teacher-form-content" className="animate-fadeIn">
          {formStatus && (
            <div className={`mx-6 mt-4 px-4 py-3 rounded-lg flex items-center gap-3 text-sm ${
              formStatus.success 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/30'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/30'
            }`}>
              {formStatus.success ? (
                <Check className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              )}
              <p>{formStatus.message}</p>
            </div>
          )}
          
          <form 
            ref={formRef}
            onSubmit={handleSubmit} 
            className="p-6 pt-4 mt-2 border-t dark:border-gray-700 transition-all duration-300"
            noValidate
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Teacher Name */}
              <div>
                <label htmlFor="teacher-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                  Teacher Name <span className="text-red-500 ml-1">*</span>
                  <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500">(Required)</span>
                </label>
                <div className="relative group">
                  <input
                    id="teacher-name"
                    name="name"
                    type="text"
                    value={teacher.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`
                      w-full pl-10 pr-4 py-2.5 border rounded-xl 
                      focus:ring-2 focus:border-blue-500 focus:shadow-sm dark:bg-gray-700 dark:text-white
                      ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500'}
                      transition-all duration-200 ease-in-out placeholder-gray-400 dark:placeholder-gray-500
                    `}
                    placeholder="Enter teacher's full name"
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500" />
                    {errors.name}
                  </p>
                )}
              </div>
              
              {/* Assigned Courses - Modernized Version */}
              <div>
                <label id="course-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Assigned Courses
                </label>
                <div className="relative group" ref={dropdownRef}>
                  <div 
                    className={`
                      w-full pl-10 pr-10 py-2.5 border rounded-xl cursor-pointer flex items-center min-h-[42px] bg-white dark:bg-gray-700 transition-all duration-200 ease-in-out
                      ${showCourseDropdown 
                        ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900/30' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'}
                    `}
                    onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                    role="combobox"
                    aria-labelledby="course-label"
                    aria-haspopup="listbox"
                    aria-expanded={showCourseDropdown}
                    aria-controls="course-listbox"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setShowCourseDropdown(!showCourseDropdown);
                      }
                    }}
                  >
                    <GraduationCap className={`
                      absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200
                      ${showCourseDropdown ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 group-hover:text-blue-500'}
                    `} />
                    
                    {selectedCourses.length === 0 ? (
                      <span className="text-gray-500 dark:text-gray-400">Select courses to assign</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 py-0.5 max-w-full overflow-hidden">
                        {selectedCourses.slice(0, 3).map(courseId => {
                          const course = courses.find(c => c.id === courseId);
                          return course ? (
                            <div 
                              key={course.id}
                              className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-200 dark:hover:bg-blue-800/40 border border-blue-200 dark:border-blue-800/30 transition-colors shadow-sm"
                            >
                              <span className="font-medium">{course.code}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCourse(course.id);
                                }}
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 transition-colors bg-blue-50 dark:bg-blue-800/30 rounded-full p-0.5 flex items-center justify-center"
                                aria-label={`Remove ${course.code}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : null;
                        })}
                        {selectedCourses.length > 3 && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                            +{selectedCourses.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className={`
                      absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors duration-200
                      ${showCourseDropdown 
                        ? 'bg-blue-100 dark:bg-blue-800/40' 
                        : 'bg-gray-100 dark:bg-gray-600'}
                    `}>
                      <ChevronDown className={`
                        w-4 h-4 transition-transform duration-200 
                        ${showCourseDropdown 
                          ? 'rotate-180 text-blue-500 dark:text-blue-400' 
                          : 'text-gray-500 dark:text-gray-300'}
                      `} />
                    </div>
                  </div>
                  
                  {showCourseDropdown && (
                    <div 
                      id="course-listbox"
                      role="listbox"
                      aria-labelledby="course-label"
                      className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-[320px] overflow-y-auto animate-fadeIn"
                    >
                      <div className="p-2 border-b dark:border-gray-600 sticky top-0 bg-white dark:bg-gray-700 z-10">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search courses..."
                            value={courseSearchTerm}
                            onChange={(e) => setCourseSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Search courses"
                            autoFocus
                          />
                          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                      </div>
                      
                      <div className="py-1">
                        {filteredCourses.length > 0 ? (
                          filteredCourses.map(course => (
                            <div
                              key={course.id}
                              className={`
                                px-3 py-2.5 flex items-center justify-between cursor-pointer
                                hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150
                                ${selectedCourses.includes(course.id) 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400' 
                                  : 'border-l-4 border-transparent'
                                }
                              `}
                              onClick={() => toggleCourse(course.id)}
                              role="option"
                              aria-selected={selectedCourses.includes(course.id)}
                              tabIndex={0}
                              onKeyDown={(e) => handleCourseKeyDown(e, course.id)}
                            >
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                    <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                </div>
                                <div className="ml-2.5">
                                  <div className="font-medium text-gray-900 dark:text-white flex items-center">
                                    {course.code}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 max-w-[300px] truncate">
                                    {course.name}
                                  </div>
                                </div>
                              </div>
                              {selectedCourses.includes(course.id) ? (
                                <div className="bg-blue-500 dark:bg-blue-400 rounded-full p-0.5 flex-shrink-0">
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 flex-shrink-0"></div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center flex flex-col items-center">
                            <GraduationCap className="w-6 h-6 text-gray-400 mb-1" />
                            <span>No courses match your search</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <span className="mr-1">•</span> Click to select multiple courses
                  </p>
                  {selectedCourses.length > 0 && (
                    <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      {selectedCourses.length} selected
                    </span>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="teacher-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                  Phone Number <span className="text-red-500 ml-1">*</span>
                  <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500">(Required)</span>
                </label>
                <div className="relative group">
                  <input
                    id="teacher-phone"
                    name="phone"
                    type="tel"
                    value={teacher.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`
                      w-full pl-10 pr-4 py-2.5 border rounded-xl 
                      focus:ring-2 focus:border-blue-500 focus:shadow-sm dark:bg-gray-700 dark:text-white
                      ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500'}
                      transition-all duration-200 ease-in-out placeholder-gray-400 dark:placeholder-gray-500
                    `}
                    placeholder="Enter contact number"
                    aria-required="true"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-blue-500 transition-colors duration-200" />
                </div>
                {errors.phone && (
                  <p id="phone-error" className="mt-1.5 text-sm text-red-500 flex items-center">
                    <span className="inline-block w-4 h-4 mr-1 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="block w-1 h-1 bg-red-500 rounded-full"></span>
                    </span>
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="teacher-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                  Email <span className="ml-1 text-xs text-gray-500">(Optional)</span>
                </label>
                <div className="relative group">
                  <input
                    id="teacher-email"
                    name="email"
                    type="email"
                    value={teacher.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`
                      w-full pl-10 pr-4 py-2.5 border rounded-xl 
                      focus:ring-2 focus:border-blue-500 focus:shadow-sm dark:bg-gray-700 dark:text-white
                      ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500'}
                      transition-all duration-200 ease-in-out placeholder-gray-400 dark:placeholder-gray-500
                    `}
                    placeholder="Email address"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-blue-500 transition-colors duration-200" />
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-sm text-red-500 flex items-center">
                    <span className="inline-block w-4 h-4 mr-1 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="block w-1 h-1 bg-red-500 rounded-full"></span>
                    </span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Department */}
              <div>
                <label htmlFor="teacher-department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Department <span className="ml-1 text-xs text-gray-500">(Optional)</span>
                </label>
                <div className="relative group">
                  <input
                    id="teacher-department"
                    name="department"
                    type="text"
                    value={teacher.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-sm dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Academic department"
                  />
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-blue-500 transition-colors duration-200" />
                </div>
              </div>

              {/* Office Room - New Field */}
              <div>
                <label htmlFor="teacher-office-room" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Office Room
                </label>
                <div className="relative">
                  <input
                    id="teacher-office-room"
                    name="officeRoom"
                    type="text"
                    value={teacher.officeRoom}
                    onChange={(e) => handleInputChange('officeRoom', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="e.g. Room 302, Building A"
                  />
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                mt-6 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-medium
                ${isSubmitting 
                  ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed opacity-80' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700'
                }
                transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
              `}
              aria-disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Teacher...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Teacher
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}