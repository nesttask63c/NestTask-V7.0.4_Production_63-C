import { useState } from 'react';
import { CalendarDays, Plus, Info, AlertTriangle, Check, Calendar, BookOpen, GraduationCap } from 'lucide-react';
import type { Routine } from '../../../types/routine';

interface RoutineFormProps {
  onSubmit: (routine: Omit<Routine, 'id' | 'createdAt'>) => Promise<Routine>;
  existingRoutines?: Routine[];
}

interface FormState {
  name: string;
  description: string;
  semester: string;
  isActive: boolean;
}

type StatusType = 'idle' | 'loading' | 'success' | 'error';

export function RoutineForm({ onSubmit, existingRoutines = [] }: RoutineFormProps) {
  const [routine, setRoutine] = useState<FormState>({
    name: '',
    description: '',
    semester: '',
    isActive: false
  });
  
  const [status, setStatus] = useState<StatusType>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [touchedFields, setTouchedFields] = useState<Set<keyof FormState>>(new Set());
  
  // List of common semesters for dropdown
  const semesterOptions = [
    'Spring 2024',
    'Summer 2024',
    'Fall 2024',
    'Spring 2025',
    'Summer 2025',
    'Fall 2025',
    'Other'
  ];
  
  // Collect existing semesters from existing routines
  const existingSemesters = new Set(existingRoutines.map(r => r.semester));
  const allSemesterOptions = [...new Set([...semesterOptions, ...existingSemesters])].sort();
  
  // Form validation
  const validateField = (name: keyof FormState, value: string | boolean): string => {
    if (typeof value === 'string' && name !== 'description' && value.trim() === '') {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }
    
    if (name === 'name') {
      // Check for duplicate names
      const duplicateName = existingRoutines.some(
        r => r.name.toLowerCase() === value.toString().toLowerCase()
      );
      if (duplicateName) {
        return 'A routine with this name already exists';
      }
    }
    
    return '';
  };
  
  const getFieldError = (fieldName: keyof FormState): string => {
    if (!touchedFields.has(fieldName)) return '';
    return validateField(fieldName, routine[fieldName]);
  };
  
  const isFormValid = (): boolean => {
    return !getFieldError('name') && !getFieldError('semester') && routine.name.trim() !== '' && routine.semester.trim() !== '';
  };

  const handleFieldChange = (name: keyof FormState, value: string | boolean) => {
    setTouchedFields(prev => new Set(prev).add(name));
    setRoutine(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCustomSemester = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (routine.semester === 'Other') {
      handleFieldChange('semester', e.target.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation
    setTouchedFields(new Set(['name', 'description', 'semester', 'isActive']));
    
    if (!isFormValid()) {
      setStatus('error');
      setErrorMessage('Please fix the validation errors before submitting');
      return;
    }
    
    setStatus('loading');
    try {
      await onSubmit(routine);
      setStatus('success');
      
      // Reset form after successful submission
      setTimeout(() => {
        setRoutine({
          name: '',
          description: '',
          semester: '',
          isActive: false
        });
        setTouchedFields(new Set());
        setStatus('idle');
      }, 1500);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to create routine. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Routine</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add a new class schedule</p>
        </div>
      </div>

      {status === 'error' && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{errorMessage || 'Please check the form for errors'}</span>
        </div>
      )}

      {status === 'success' && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg flex items-start gap-2">
          <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>Routine created successfully!</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Routine Name<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={routine.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className={`w-full pl-10 pr-3 py-2.5 border ${
                getFieldError('name') ? 'border-red-500' : 'dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
              placeholder="e.g., CSE Spring 2024 Schedule"
              required
            />
          </div>
          {getFieldError('name') && (
            <p className="mt-1 text-xs text-red-500">{getFieldError('name')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <textarea
              value={routine.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white h-32 resize-none"
              placeholder="Enter details about this routine..."
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Optional: Include any notes, department, or relevant details
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Semester<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={routine.semester}
              onChange={(e) => handleFieldChange('semester', e.target.value)}
              className={`w-full pl-10 pr-3 py-2.5 border ${
                getFieldError('semester') ? 'border-red-500' : 'dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none`}
              required
            >
              <option value="">Select a semester</option>
              {allSemesterOptions.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
              <option value="Other">Other (Custom)</option>
            </select>
          </div>
          {routine.semester === 'Other' && (
            <input
              type="text"
              onChange={handleCustomSemester}
              className="mt-2 w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter custom semester"
            />
          )}
          {getFieldError('semester') && (
            <p className="mt-1 text-xs text-red-500">{getFieldError('semester')}</p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={routine.isActive}
            onChange={(e) => handleFieldChange('isActive', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
            Set as active routine
          </label>
          <div className="relative group ml-1">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
              Active routines appear on the student dashboard and can be viewed by students
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className={`
          w-full mt-6 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white
          ${status === 'loading' 
            ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }
          transition-colors duration-200 shadow-sm hover:shadow-md
        `}
      >
        {status === 'loading' ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white"></div>
            <span>Creating Routine...</span>
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            <span>Create Routine</span>
          </>
        )}
      </button>
    </form>
  );
}