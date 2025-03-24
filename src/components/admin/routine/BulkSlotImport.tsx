import { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, File, AlertTriangle, Loader2, Edit } from 'lucide-react';
import { Teacher } from '../../../types/teacher';
import { Course } from '../../../types/course';
import Select, { SingleValue } from 'react-select';
import { toast } from 'react-hot-toast';

interface BulkSlotImportProps {
  routineId: string;
  teachers: Teacher[];
  courses: Course[];
  onImportSlots: (routineId: string, slots: any[]) => Promise<{ success: number; errors: any[] }>;
}

interface ImportSlot {
  day: string;
  start_time: string;
  end_time: string;
  course_title?: string;
  course_code?: string;
  course?: string; // For backward compatibility
  teacher: string;
  room_number?: string;
  section?: string;
  _teacherId?: string; // For manual selection
  _courseId?: string; // For manual selection
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface SlotItemWithStatus extends ImportSlot {
  status: 'ok' | 'warning' | 'error';
  message?: string;
  teacherFound?: boolean;
  courseFound?: boolean;
  isTeacherAutoAssigned?: boolean;
  autoAssignedTeacherName?: string;
  index: number;
}

// Create a new interface to track auto-assignment state during processing
interface SlotProcessingState {
  isTeacherAutoAssigned?: boolean;
  autoAssignedTeacherName?: string;
}

export function BulkSlotImport({ routineId, teachers, courses, onImportSlots }: BulkSlotImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ImportSlot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [slotsWithStatus, setSlotsWithStatus] = useState<SlotItemWithStatus[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; errors: any[] } | null>(null);
  const [progressStatus, setProgressStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Teacher and course select options
  const teacherOptions = teachers.map(teacher => ({
    value: teacher.id,
    label: teacher.name + (teacher.department ? ` (${teacher.department})` : '')
  }));

  const courseOptions = courses.map(course => ({
    value: course.id,
    label: `${course.name} (${course.code})`
  }));

  const validateSlotData = (data: any[]): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!Array.isArray(data)) {
      return { valid: false, errors: ['Invalid JSON format: Expected an array'], warnings: [] };
    }
    
    if (data.length === 0) {
      return { valid: false, errors: ['Empty data: No slots to import'], warnings: [] };
    }
    
    // Check each slot entry
    data.forEach((slot, index) => {
      // Check required fields - support both new format and old format
      const hasCourseInfo = (slot.course_title && slot.course_code) || slot.course;
      
      const requiredFields = ['day', 'start_time', 'end_time', 'teacher'];
      requiredFields.forEach(field => {
        if (!slot[field]) {
          errors.push(`Slot #${index + 1}: Missing required field '${field}'`);
        }
      });
      
      if (!hasCourseInfo) {
        errors.push(`Slot #${index + 1}: Missing course information (either 'course' or 'course_title' and 'course_code')`);
      }
      
      // Validate day of week
      const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (slot.day && !validDays.includes(slot.day)) {
        errors.push(`Slot #${index + 1}: Invalid day "${slot.day}". Must be one of: ${validDays.join(', ')}`);
      }
      
      // Validate time format (HH:MM AM/PM)
      const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
      if (slot.start_time && !timeRegex.test(slot.start_time)) {
        errors.push(`Slot #${index + 1}: Invalid start time format "${slot.start_time}". Must be HH:MM AM/PM`);
      }
      if (slot.end_time && !timeRegex.test(slot.end_time)) {
        errors.push(`Slot #${index + 1}: Invalid end time format "${slot.end_time}". Must be HH:MM AM/PM`);
      }
    });
    
    return { valid: errors.length === 0, errors, warnings };
  };
  
  // Effect to check for teacher and course existence after validation
  useEffect(() => {
    if (!data || !validation?.valid) return;
    
    const processedSlots: SlotItemWithStatus[] = data.map((slot, index) => {
      // Extract course info first, as we'll use it to find the teacher
      let courseCode = '';
      let courseTitle = '';
      
      if (slot.course_code && slot.course_title) {
        courseCode = slot.course_code.trim();
        courseTitle = slot.course_title.trim();
      } else if (slot.course) {
        // Extract from old format "Name - CODE"
        const parts = slot.course.split('-');
        if (parts.length >= 2) {
          courseCode = parts[parts.length - 1].trim();
          courseTitle = parts.slice(0, parts.length - 1).join('-').trim();
        } else {
          courseCode = slot.course.trim();
          courseTitle = slot.course.trim();
        }
      }
      
      // Find course match based on course code
      const courseMatch = courses.find(c => 
        c.code.toLowerCase() === courseCode.toLowerCase() || 
        c.name.toLowerCase() === courseTitle.toLowerCase()
      );

      // Find teacher from the imported slot data
      const teacherName = slot.teacher.trim().toLowerCase();
      let teacherMatch = teachers.find(t => t.name.toLowerCase() === teacherName);
      
      // Create a state object to track processing information
      const processingState: SlotProcessingState = {
        isTeacherAutoAssigned: false,
        autoAssignedTeacherName: undefined
      };
      
      // If course is found but teacher is not found or doesn't match:
      // Try to automatically assign the teacher associated with this course
      if (courseMatch && !teacherMatch) {
        // First, check if the course has a teacherId directly
        if (courseMatch.teacherId) {
          // Find the teacher using the course's teacherId
          const courseTeacher = teachers.find(t => t.id === courseMatch.teacherId);
          if (courseTeacher) {
            // Use the course's teacher instead
            teacherMatch = courseTeacher;
            console.log(`Auto-assigned teacher ${courseTeacher.name} based on course ${courseMatch.code}`);
            // Mark that this teacher was auto-assigned
            processingState.isTeacherAutoAssigned = true;
            const autoAssignedTeacherName = courseTeacher.name;
            if (autoAssignedTeacherName.toLowerCase() !== teacherName.toLowerCase()) {
              // Only store if different from the original name
              processingState.autoAssignedTeacherName = autoAssignedTeacherName;
            }
          }
        }
        
        // If still no match, try to find teacher by looking at course's teacher name field
        if (!teacherMatch && courseMatch.teacher) {
          const courseTeacherByName = teachers.find(t => 
            t.name.toLowerCase() === courseMatch.teacher.toLowerCase()
          );
          if (courseTeacherByName) {
            teacherMatch = courseTeacherByName;
            console.log(`Auto-assigned teacher ${courseTeacherByName.name} based on course ${courseMatch.code}`);
            // Mark that this teacher was auto-assigned
            processingState.isTeacherAutoAssigned = true;
            const autoAssignedTeacherName = courseTeacherByName.name;
            if (autoAssignedTeacherName.toLowerCase() !== teacherName.toLowerCase()) {
              // Only store if different from the original name
              processingState.autoAssignedTeacherName = autoAssignedTeacherName;
            }
          }
        }
      }
      
      const status: SlotItemWithStatus = {
        ...slot,
        index,
        status: 'ok',
        teacherFound: !!teacherMatch,
        courseFound: !!courseMatch,
        _teacherId: teacherMatch?.id,
        _courseId: courseMatch?.id,
        isTeacherAutoAssigned: processingState.isTeacherAutoAssigned,
        autoAssignedTeacherName: processingState.autoAssignedTeacherName
      };
      
      // Set warnings for missing items
      const warnings = [];
      if (!teacherMatch) {
        warnings.push(`Teacher "${slot.teacher}" not found in database`);
      }
      if (!courseMatch) {
        warnings.push(`Course "${courseTitle} (${courseCode})" not found in database`);
      }
      
      if (warnings.length > 0) {
        status.status = 'warning';
        status.message = warnings.join(', ');
      }
      
      return status;
    });
    
    setSlotsWithStatus(processedSlots);
    
    // Count warnings
    const warningCount = processedSlots.filter(s => s.status === 'warning').length;
    if (warningCount > 0) {
      setValidation(prev => ({
        ...prev!,
        warnings: [`${warningCount} slot(s) have missing teacher or course references that require manual selection.`]
      }));
    }
  }, [data, validation?.valid, teachers, courses]);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportResult(null);
    setValidation(null);
    setSlotsWithStatus([]);
    
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFile(null);
      setData(null);
      return;
    }
    
    const selectedFile = files[0];
    
    // Check if file is JSON
    if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
      setValidation({ valid: false, errors: ['Invalid file format. Only JSON files are supported.'], warnings: [] });
      setFile(null);
      setData(null);
      return;
    }
    
    setFile(selectedFile);
    setValidating(true);
    
    try {
      const text = await selectedFile.text();
      const jsonData = JSON.parse(text);
      setData(jsonData);
      
      // Validate data format
      const validationResult = validateSlotData(jsonData);
      setValidation(validationResult);
    } catch (err: any) {
      setValidation({
        valid: false,
        errors: [`Invalid JSON: ${err.message}`],
        warnings: []
      });
      setData(null);
    } finally {
      setValidating(false);
    }
  };
  
  const handleTeacherChange = (slotIndex: number, teacherId: string | null) => {
    setSlotsWithStatus(prev => 
      prev.map((slot, idx) => 
        idx === slotIndex 
          ? { 
              ...slot, 
              _teacherId: teacherId || undefined,
              teacherFound: !!teacherId,
              status: !teacherId || !slot._courseId ? 'warning' : 'ok',
              message: determineMessage({...slot, _teacherId: teacherId || undefined})
            } 
          : slot
      )
    );
  };
  
  const handleCourseChange = (slotIndex: number, courseId: string | null) => {
    setSlotsWithStatus(prev => 
      prev.map((slot, idx) => 
        idx === slotIndex 
          ? { 
              ...slot, 
              _courseId: courseId || undefined,
              courseFound: !!courseId,
              status: !courseId || !slot._teacherId ? 'warning' : 'ok',
              message: determineMessage({...slot, _courseId: courseId || undefined})
            } 
          : slot
      )
    );
  };
  
  const determineMessage = (slot: SlotItemWithStatus): string => {
    const warnings = [];
    if (!slot._teacherId) {
      warnings.push(`Teacher not selected`);
    }
    if (!slot._courseId) {
      warnings.push(`Course not selected`);
    }
    return warnings.join(', ');
  };
  
  const handleImport = async () => {
    if (!slotsWithStatus.length) return;
    
    // Check if all slots have teacher and course selections
    const missingSelections = slotsWithStatus.filter(
      slot => !slot._teacherId || !slot._courseId
    );
    
    if (missingSelections.length > 0) {
      toast.error(`${missingSelections.length} slot(s) are missing teacher or course selections.`);
      return;
    }
    
    setLoading(true);
    setProgressStatus('Preparing import...');
    
    try {
      // Prepare data for import in the expected format for the backend
      const preparedData = slotsWithStatus.map(slot => {
        const teacherObj = teachers.find(t => t.id === slot._teacherId);
        const courseObj = courses.find(c => c.id === slot._courseId);
        
        // Format course string as "Title - Code" for backend compatibility
        const courseFormatted = courseObj 
          ? `${courseObj.name} - ${courseObj.code}`
          : slot.course || `${slot.course_title || ''} - ${slot.course_code || ''}`;
        
        return {
          day: slot.day,
          start_time: slot.start_time,
          end_time: slot.end_time,
          course: courseFormatted,
          teacher: teacherObj?.name || slot.teacher,
          room_number: slot.room_number,
          section: slot.section,
          _teacherId: slot._teacherId,  // Pass these through to help the backend
          _courseId: slot._courseId
        };
      });
      
      setProgressStatus('Importing slots...');
      const result = await onImportSlots(routineId, preparedData);
      setImportResult(result);
      
      // Clear the file input if successful
      if (result.success > 0 && result.errors.length === 0) {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setFile(null);
        setData(null);
        setValidation(null);
        setSlotsWithStatus([]);
        toast.success(`Successfully imported ${result.success} slot(s).`);
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      toast.error('Import failed. Please try again.');
      setImportResult({
        success: 0,
        errors: [{ message: 'Import failed: ' + (error.message || 'Unknown error') }]
      });
    } finally {
      setLoading(false);
      setProgressStatus('');
    }
  };
  
  const handleReset = () => {
    setFile(null);
    setData(null);
    setValidation(null);
    setImportResult(null);
    setSlotsWithStatus([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-5">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
        <Upload className="w-5 h-5 mr-2 text-blue-500" />
        Bulk Import Time Slots
      </h3>
      
      <div className="mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Import multiple time slots at once using a JSON file. The file must be in the following format:
        </div>
        <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-xs overflow-x-auto mb-4">
{`[
  {
    "day": "Thursday",
    "start_time": "10:40 AM",
    "end_time": "11:30 AM",
    "course_title": "Embedded Systems & IoT",
    "course_code": "CSE233",
    "teacher": "Sakib Mahmood Chowdhury",
    "room_number": "KT-221",
    "section": "63_G"
  }
]`}
        </pre>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="w-full max-w-xs text-sm text-gray-500 dark:text-gray-400 file:rounded-lg file:bg-blue-500 file:border-0 file:text-white file:px-3 file:py-2 file:mr-3 file:text-sm hover:file:bg-blue-600 cursor-pointer"
          />
          {(validation || importResult) && (
            <button 
              onClick={handleReset}
              className="ml-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      
      {validating && (
        <div className="flex items-center text-blue-500 text-sm mb-4">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Validating JSON data...
        </div>
      )}
      
      {validation && !validation.valid && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md p-3">
          <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center mb-2">
            <XCircle className="w-4 h-4 mr-1" />
            Validation Errors
          </h4>
          <ul className="text-xs text-red-600 dark:text-red-400 list-disc ml-5 space-y-1">
            {validation.errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {validation && validation.valid && validation.warnings.length > 0 && (
        <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-md p-3">
          <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center mb-2">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Warnings
          </h4>
          <ul className="text-xs text-yellow-600 dark:text-yellow-400 list-disc ml-5 space-y-1">
            {validation.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      {validation && validation.valid && slotsWithStatus.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center text-green-500 text-sm mb-2">
            <CheckCircle className="w-4 h-4 mr-2" />
            {`Valid JSON with ${slotsWithStatus.length} slot${slotsWithStatus.length !== 1 ? 's' : ''}`}
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-md p-3 text-sm text-blue-700 dark:text-blue-400">
            <div className="flex items-center mb-2">
              <File className="w-4 h-4 mr-2" />
              <span className="font-medium">{file?.name}</span>
              <span className="ml-2 text-xs text-blue-500 dark:text-blue-500">
                {file ? `(${(file.size / 1024).toFixed(1)} KB)` : ''}
              </span>
            </div>
            
            <div className="text-xs mb-3">
              {slotsWithStatus.filter(s => s.status === 'warning').length > 0 
                ? "Some slots are missing references to teacher or course. Please select them manually below."
                : "All slots have valid teacher and course references."}
            </div>
            
            {/* Slot list with selection options for invalid ones */}
            <div className="mt-4 max-h-[300px] overflow-y-auto">
              {slotsWithStatus.map((slot, idx) => (
                <div 
                  key={idx} 
                  className={`p-2 mb-2 rounded-md text-xs ${
                    slot.status === 'warning' 
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800/50' 
                      : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">
                      Slot #{idx + 1}: {slot.day} {slot.start_time}-{slot.end_time}
                    </div>
                    <div className={`text-xs ${
                      slot.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {slot.status === 'warning' ? (
                        <div className="flex items-center">
                          <AlertTriangle size={12} className="mr-1" />
                          <span>Requires selection</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CheckCircle size={12} className="mr-1" />
                          <span>Ready</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="col-span-3 sm:col-span-1">
                      <div className="text-gray-500 dark:text-gray-400 mb-1">Course</div>
                      <div>
                        {slot.course_title || slot.course} 
                        {slot.course_code && <span className="text-xs ml-1 text-gray-500">({slot.course_code})</span>}
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-1">
                      <div className="text-gray-500 dark:text-gray-400 mb-1">Teacher</div>
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span>{slot.teacher}</span>
                          {slot.isTeacherAutoAssigned && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-full inline-flex items-center">
                              <Edit className="w-3 h-3 mr-1" />
                              Auto-assigned
                            </span>
                          )}
                        </div>
                        {slot.autoAssignedTeacherName && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Assigned to: {slot.autoAssignedTeacherName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-1">
                      <div className="text-gray-500 dark:text-gray-400 mb-1">Room / Section</div>
                      <div>{slot.room_number || 'N/A'} / {slot.section || 'N/A'}</div>
                    </div>
                  </div>
                  
                  {/* Show manual selection if needed */}
                  {slot.status === 'warning' && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {!slot.teacherFound && (
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                            Select Teacher
                            {slot._teacherId && slot.autoAssignedTeacherName && (
                              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                                (Auto-assigned from course)
                              </span>
                            )}
                          </label>
                          <Select
                            options={teacherOptions}
                            placeholder="Select a teacher..."
                            value={slot._teacherId ? teacherOptions.find(opt => opt.value === slot._teacherId) : null}
                            onChange={(option: SingleValue<{value: string, label: string}>) => 
                              handleTeacherChange(idx, option?.value || null)
                            }
                            className="text-xs"
                            classNamePrefix="select"
                            isClearable
                          />
                        </div>
                      )}
                      
                      {!slot.courseFound && (
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Select Course
                          </label>
                          <Select
                            options={courseOptions}
                            placeholder="Select a course..."
                            onChange={(option: SingleValue<{value: string, label: string}>) => 
                              handleCourseChange(idx, option?.value || null)
                            }
                            className="text-xs"
                            classNamePrefix="select"
                            isClearable
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleImport}
            disabled={loading || slotsWithStatus.some(s => s.status === 'warning' && (!s._teacherId || !s._courseId))}
            className="mt-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {progressStatus || 'Importing...'}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import {slotsWithStatus.length} Slots
              </>
            )}
          </button>
        </div>
      )}
      
      {importResult && (
        <div className={`mb-4 p-3 rounded-md ${
          importResult.errors.length === 0
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30'
        }`}>
          <div className="flex items-center text-sm font-medium mb-2">
            {importResult.errors.length === 0 ? (
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
            )}
            <span className={importResult.errors.length === 0 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
              {importResult.success > 0 
                ? `Successfully imported ${importResult.success} slot${importResult.success !== 1 ? 's' : ''}`
                : 'Import completed with issues'}
            </span>
          </div>
          
          {importResult.errors.length > 0 && (
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              <div className="font-medium mb-1">The following errors occurred:</div>
              <ul className="list-disc ml-5 space-y-1">
                {importResult.errors.map((error, idx) => (
                  <li key={idx}>{error.message || error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 