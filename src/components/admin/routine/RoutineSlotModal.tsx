import { useState, useEffect, useRef } from 'react';
import { X, Clock, BookOpen, User, MapPin, Users, AlertCircle, Check, Info, Send, Plus } from 'lucide-react';
import type { RoutineSlot } from '../../../types/routine';
import type { Course } from '../../../types/course';
import type { Teacher } from '../../../types/teacher';
import { supabase } from '../../../lib/supabase';

interface RoutineSlotModalProps {
  routineId: string;
  slot: RoutineSlot | null;
  courses: Course[];
  teachers: Teacher[];
  onClose: () => void;
  onSubmit: ((routineId: string, slot: Omit<RoutineSlot, 'id' | 'routineId' | 'createdAt'>) => Promise<RoutineSlot>) | 
            ((routineId: string, slotId: string, updates: Partial<RoutineSlot>) => Promise<void>);
}

interface ValidationError {
  field: string;
  message: string;
}

interface NewCourseData {
  name: string;
  code: string;
  credits: number;
  description?: string;
}

export function RoutineSlotModal({
  routineId,
  slot,
  courses,
  teachers,
  onClose,
  onSubmit
}: RoutineSlotModalProps) {
  // Debug log to check teachers availability
  console.log('RoutineSlotModal - Teachers:', teachers?.length || 0, 'Slot teacher ID:', slot?.teacherId);
  
  const [formData, setFormData] = useState<Omit<RoutineSlot, 'id' | 'routineId' | 'createdAt'>>({
    dayOfWeek: slot?.dayOfWeek || 'Sunday',
    startTime: slot?.startTime || '08:00',
    endTime: slot?.endTime || '09:30',
    roomNumber: slot?.roomNumber || '',
    section: slot?.section || '',
    courseId: slot?.courseId || '',
    teacherId: slot?.teacherId || '',
    courseName: slot?.courseName || '',
    teacherName: slot?.teacherName || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'error' | 'success' | 'info'; message: string} | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [manualCourseEntry, setManualCourseEntry] = useState(false);
  const [newCourseData, setNewCourseData] = useState<NewCourseData>({
    name: '',
    code: '',
    credits: 3
  });
  const [courseCodeInput, setCourseCodeInput] = useState('');
  const [addingCourse, setAddingCourse] = useState(false);

  // Filter teachers based on the selected course
  useEffect(() => {
    if (formData.courseId) {
      const selectedCourse = courses.find(c => c.id === formData.courseId);
      if (selectedCourse && selectedCourse.teacherId) {
        // If course has an assigned teacher, prioritize that teacher
        const courseTeacher = teachers.find(t => t.id === selectedCourse.teacherId);
        if (courseTeacher) {
          setFormData(prev => ({
            ...prev,
            teacherId: courseTeacher.id,
            teacherName: courseTeacher.name
          }));
        }
      }
    }
  }, [formData.courseId, courses, teachers]);

  useEffect(() => {
    // Update courseName when courseId changes
    if (formData.courseId) {
      const selectedCourse = courses.find(c => c.id === formData.courseId);
      if (selectedCourse) {
        setFormData(prev => ({
          ...prev,
          courseName: selectedCourse.name
        }));
      }
    } else {
      // Clear courseName if no courseId is selected
      setFormData(prev => ({
        ...prev,
        courseName: ''
      }));
    }

    // Update teacherName when teacherId changes
    if (formData.teacherId) {
      const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
      if (selectedTeacher) {
        setFormData(prev => ({
          ...prev,
          teacherName: selectedTeacher.name
        }));
      }
    } else {
      // Clear teacherName if no teacherId is selected
      setFormData(prev => ({
        ...prev,
        teacherName: ''
      }));
    }
  }, [formData.courseId, formData.teacherId, courses, teachers]);

  // Handle course code input change and search
  const handleCourseCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCourseCodeInput(value);
    
    // If the entered course code matches an existing course, select it
    const matchingCourse = courses.find(
      course => course.code.toLowerCase() === value.toLowerCase()
    );
    
    if (matchingCourse) {
      setFormData(prev => ({
        ...prev,
        courseId: matchingCourse.id,
        courseName: matchingCourse.name
      }));
      setCourseCodeInput('');
    }
  };

  // Add a new course to the database
  const handleAddNewCourse = async () => {
    if (!newCourseData.name || !newCourseData.code) {
      setStatusMessage({
        type: 'error',
        message: 'Course name and code are required'
      });
      return;
    }

    setAddingCourse(true);
    setStatusMessage({
      type: 'info',
      message: 'Adding new course...'
    });

    try {
      // Insert new course to database
      const { data, error } = await supabase
        .from('courses')
        .insert({
          name: newCourseData.name,
          code: newCourseData.code,
          credits: newCourseData.credits,
          description: newCourseData.description || null
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Add the new course to the form
        setFormData(prev => ({
          ...prev,
          courseId: data.id,
          courseName: data.name
        }));

        setStatusMessage({
          type: 'success',
          message: `Course "${data.code}" added successfully!`
        });

        // Reset the new course form
        setNewCourseData({
          name: '',
          code: '',
          credits: 3,
          description: ''
        });
        
        // Close the manual entry form
        setManualCourseEntry(false);
      }
    } catch (error: any) {
      console.error('Error adding course:', error);
      setStatusMessage({
        type: 'error',
        message: error.message || 'Failed to add course. Please try again.'
      });
    } finally {
      setAddingCourse(false);
    }
  };

  // Validate the form data
  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!formData.dayOfWeek) {
      errors.push({ field: 'dayOfWeek', message: 'Day of week is required' });
    }
    
    if (!formData.startTime) {
      errors.push({ field: 'startTime', message: 'Start time is required' });
    }
    
    if (!formData.endTime) {
      errors.push({ field: 'endTime', message: 'End time is required' });
    }
    
    // Check if end time is after start time
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      errors.push({ field: 'endTime', message: 'End time must be after start time' });
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form first
    const errors = validateForm();
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      setStatusMessage({
        type: 'error',
        message: 'Please fix the validation errors before submitting'
      });
      return;
    }
    
    setIsSubmitting(true);
    setStatusMessage({ type: 'info', message: 'Processing your request...' });
    
    try {
      // Ensure course and teacher names are correctly set
      let submissionData = { ...formData };
      
      // Double-check courseName from courseId
      if (submissionData.courseId) {
        const selectedCourse = courses.find(c => c.id === submissionData.courseId);
        if (selectedCourse) {
          submissionData.courseName = selectedCourse.name;
        }
      }
      
      // Double-check teacherName from teacherId
      if (submissionData.teacherId) {
        const selectedTeacher = teachers.find(t => t.id === submissionData.teacherId);
        if (selectedTeacher) {
          submissionData.teacherName = selectedTeacher.name;
        }
      }
      
      if (slot) {
        // Edit existing slot - need to use the 3-parameter version
        const updateFn = onSubmit as (routineId: string, slotId: string, updates: Partial<RoutineSlot>) => Promise<void>;
        await updateFn(routineId, slot.id, submissionData);
        setStatusMessage({
          type: 'success', 
          message: 'Time slot updated successfully!'
        });
      } else {
        // Create new slot - need to use the 2-parameter version
        const createFn = onSubmit as (routineId: string, slot: Omit<RoutineSlot, 'id' | 'routineId' | 'createdAt'>) => Promise<RoutineSlot>;
        await createFn(routineId, submissionData);
        setStatusMessage({
          type: 'success', 
          message: 'Time slot created successfully!'
        });
      }
      
      // Short delay before closing to show success message
      setTimeout(() => onClose(), 1200);
    } catch (error: any) {
      console.error('Error saving routine slot:', error);
      setStatusMessage({
        type: 'error', 
        message: error.message || 'Failed to save time slot. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time for display (e.g., "08:00" to "8:00 AM")
  const formatTimeForDisplay = (time: string): string => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (e) {
      return time;
    }
  };

  const hasFieldError = (fieldName: string): boolean => {
    return validationErrors.some(err => err.field === fieldName);
  };

  const getFieldErrorMessage = (fieldName: string): string => {
    const error = validationErrors.find(err => err.field === fieldName);
    return error ? error.message : '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-500" />
            {slot ? 'Edit Time Slot' : 'Add New Time Slot'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          <form onSubmit={handleSubmit}>
            {statusMessage && (
              <div className={`p-3 rounded-lg flex items-start gap-2 mb-4 ${
                statusMessage.type === 'error' 
                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
                  : statusMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
              }`}>
                {statusMessage.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : statusMessage.type === 'success' ? (
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <span>{statusMessage.message}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Day and Section Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Day of Week<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }));
                      setValidationErrors(validationErrors.filter(err => err.field !== 'dayOfWeek'));
                    }}
                    className={`w-full px-3 py-2.5 border ${hasFieldError('dayOfWeek') ? 'border-red-500 dark:border-red-500' : 'dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none`}
                    required
                  >
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  {hasFieldError('dayOfWeek') && (
                    <p className="mt-1 text-xs text-red-500">{getFieldErrorMessage('dayOfWeek')}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Section
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.section || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                      placeholder="e.g., A1, B2, 01"
                      className="w-full pl-10 pr-3 py-2.5 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, startTime: e.target.value }));
                        setValidationErrors(validationErrors.filter(err => err.field !== 'startTime'));
                      }}
                      className={`w-full pl-10 pr-8 py-2.5 border ${hasFieldError('startTime') ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    {formData.startTime && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeForDisplay(formData.startTime)}
                      </div>
                    )}
                    {hasFieldError('startTime') && (
                      <p className="mt-1 text-xs text-red-500">{getFieldErrorMessage('startTime')}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, endTime: e.target.value }));
                        setValidationErrors(validationErrors.filter(err => err.field !== 'endTime'));
                      }}
                      className={`w-full pl-10 pr-8 py-2.5 border ${hasFieldError('endTime') ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    {formData.endTime && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeForDisplay(formData.endTime)}
                      </div>
                    )}
                    {hasFieldError('endTime') && (
                      <p className="mt-1 text-xs text-red-500">{getFieldErrorMessage('endTime')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course
                </label>
                <div className="relative mb-2">
                  <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={formData.courseId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end">
                  {!manualCourseEntry && (
                    <button
                      type="button"
                      onClick={() => setManualCourseEntry(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add New Course
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={courseCodeInput}
                    onChange={handleCourseCodeChange}
                    placeholder="Search by course code..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {manualCourseEntry && (
                  <div className="border dark:border-gray-600 rounded-lg p-3 space-y-3 bg-gray-50 dark:bg-gray-750 mt-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Add New Course</h4>
                      <button
                        type="button"
                        onClick={() => setManualCourseEntry(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Course Code<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newCourseData.code}
                          onChange={(e) => setNewCourseData(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="e.g., CSE101"
                          className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Credits
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={newCourseData.credits}
                          onChange={(e) => setNewCourseData(prev => ({ ...prev, credits: parseFloat(e.target.value) }))}
                          className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Course Name<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newCourseData.name}
                        onChange={(e) => setNewCourseData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Introduction to Computer Science"
                        className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newCourseData.description || ''}
                        onChange={(e) => setNewCourseData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional course description"
                        className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none h-20"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleAddNewCourse}
                      disabled={addingCourse || !newCourseData.name || !newCourseData.code}
                      className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-white rounded-lg ${
                        addingCourse || !newCourseData.name || !newCourseData.code
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {addingCourse ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white"></div>
                          <span>Adding Course...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Add Course</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Teacher Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teacher
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  {teachers && teachers.length > 0 ? (
                    <>
                      <select
                        value={formData.teacherId || ''}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const selectedTeacher = teachers.find(t => t.id === selectedId);
                          
                          setFormData(prev => ({
                            ...prev,
                            teacherId: selectedId,
                            teacherName: selectedTeacher ? selectedTeacher.name : ''
                          }));
                        }}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
                      >
                        <option value="">Select a teacher</option>
                        {teachers.map(teacher => (
                          <option 
                            key={teacher.id} 
                            value={teacher.id}
                          >
                            {teacher.name} {teacher.department ? `(${teacher.department})` : ''}
                          </option>
                        ))}
                      </select>
                      {formData.teacherId && formData.teacherName && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Selected: {formData.teacherName}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      No teachers available
                    </div>
                  )}
                </div>
              </div>

              {/* Room Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room Number
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.roomNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                    placeholder="e.g., KT-512, Lab-3"
                    className="w-full pl-10 pr-3 py-2.5 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{slot ? 'Update Slot' : 'Add Slot'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}