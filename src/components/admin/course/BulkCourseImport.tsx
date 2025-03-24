import { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, File, AlertTriangle, Loader2, GraduationCap } from 'lucide-react';
import type { Teacher } from '../../../types/teacher';
import type { NewCourse } from '../../../types/course';

interface BulkCourseImportProps {
  teachers: Teacher[];
  onImportCourses: (courses: NewCourse[]) => Promise<{ success: number; errors: any[] }>;
}

type ValidationResult = {
  valid: boolean;
  errors: string[];
};

type ImportCourse = {
  course_code: string;
  course_title: string;
  credit?: number;
  section?: string;
  teacher: string;
};

export function BulkCourseImport({ teachers, onImportCourses }: BulkCourseImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ImportCourse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<{ 
    success: number; 
    errors: any[]; 
    newTeacherCount?: number 
  } | null>(null);
  const [progressStatus, setProgressStatus] = useState('');
  const [teacherSelections, setTeacherSelections] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateCourseData = (data: any[]): ValidationResult => {
    const errors: string[] = [];
    
    if (!Array.isArray(data)) {
      return { valid: false, errors: ['Invalid JSON format: Expected an array'] };
    }
    
    if (data.length === 0) {
      return { valid: false, errors: ['Empty data: No courses to import'] };
    }
    
    const requiredFields = ['course_code', 'course_title', 'teacher'];
    
    data.forEach((course, index) => {
      if (!course) {
        errors.push(`Course #${index + 1}: Invalid course object`);
        return;
      }
      
      requiredFields.forEach(field => {
        if (!course[field]) {
          errors.push(`Course #${index + 1}: Missing required field "${field}"`);
        }
      });
      
      if (course.credit && typeof course.credit !== 'number') {
        errors.push(`Course #${index + 1}: Credit must be a number`);
      }
    });
    
    return { valid: errors.length === 0, errors };
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportResult(null);
    setValidation(null);
    setTeacherSelections({});
    
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFile(null);
      setData(null);
      return;
    }
    
    const selectedFile = files[0];
    
    // Check if file is JSON
    if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
      setValidation({ valid: false, errors: ['Invalid file format. Only JSON files are supported.'] });
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
      const validationResult = validateCourseData(jsonData);
      setValidation(validationResult);
    } catch (err: any) {
      setValidation({
        valid: false,
        errors: [`Invalid JSON: ${err.message}`]
      });
      setData(null);
    } finally {
      setValidating(false);
    }
  };

  const findMatchingTeacher = (teacherName: string): Teacher | undefined => {
    return teachers.find(teacher => 
      teacher.name.toLowerCase() === teacherName.toLowerCase() ||
      teacher.name.toLowerCase().includes(teacherName.toLowerCase()) ||
      teacherName.toLowerCase().includes(teacher.name.toLowerCase())
    );
  };
  
  const handleTeacherSelection = (index: number, teacherId: string) => {
    setTeacherSelections(prev => ({
      ...prev,
      [index]: teacherId
    }));
  };
  
  const handleImport = async () => {
    if (!data || !validation?.valid) return;
    
    setLoading(true);
    setProgressStatus('Preparing import...');
    
    try {
      setProgressStatus('Converting data format...');
      
      // Count how many new teachers will be created
      const newTeacherCount = data.filter(item => !findMatchingTeacher(item.teacher)).length;
      
      // Convert the JSON data format to NewCourse format
      const coursesToImport: NewCourse[] = data.map((item, index) => {
        // Check if we have a teacher selection for this course
        const teacherId = teacherSelections[index];
        let teacherName = item.teacher;
        
        // If a teacher is selected from the dropdown, use that teacher's name
        if (teacherId && teacherId !== 'other') {
          const selectedTeacher = teachers.find(t => t.id === teacherId);
          if (selectedTeacher) {
            teacherName = selectedTeacher.name;
          }
        }
        
        return {
          code: item.course_code,
          name: item.course_title,
          credit: item.credit,
          section: item.section,
          teacher: teacherName,
          teacherId: teacherId !== 'other' ? teacherId : undefined,
          classTimes: [],
          telegramGroup: '',
          blcLink: '',
          blcEnrollKey: ''
        };
      });
      
      setProgressStatus('Importing courses...');
      const result = await onImportCourses(coursesToImport);
      
      // Add information about created teachers
      const createdTeacherCount = result.errors.filter(err => 
        err.isWarning && err.isSuccess && err.message.includes('Created teacher')
      ).length;
      
      setImportResult({
        ...result,
        newTeacherCount: createdTeacherCount || newTeacherCount
      });
      
      // Clear the file input if successful
      if (result.success > 0 && result.errors.length === 0) {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setFile(null);
        setData(null);
        setValidation(null);
        setTeacherSelections({});
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      setImportResult({
        success: 0,
        errors: [{ message: `Import failed: ${error.message}` }],
        newTeacherCount: 0
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
    setTeacherSelections({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
        <Upload className="w-5 h-5 mr-2 text-blue-500" />
        Bulk Import Courses
      </h3>
      
      <div className="mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Import multiple courses at once using a JSON file. The file must be in the following format:
        </div>
        <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-xs overflow-x-auto mb-4">
{`[
  {
    "course_code": "CSE321",
    "course_title": "System Analysis & Design",
    "credit": 3,
    "section": "63_G",
    "teacher": "Naznin Sultana"
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
      
      {validation && validation.valid && data && (
        <div className="mb-4">
          <div className="flex items-center text-green-500 text-sm mb-2">
            <CheckCircle className="w-4 h-4 mr-2" />
            {`Valid JSON with ${data.length} course${data.length !== 1 ? 's' : ''}`}
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-md p-3 text-sm">
            <div className="flex items-center mb-2 text-blue-700 dark:text-blue-400">
              <File className="w-4 h-4 mr-2" />
              <span className="font-medium">{file?.name}</span>
              <span className="ml-2 text-xs text-blue-500 dark:text-blue-500">
                {file ? `(${(file.size / 1024).toFixed(1)} KB)` : ''}
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 mt-3">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teacher</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.map((course, index) => {
                    // Try to find a matching teacher
                    const matchingTeacher = findMatchingTeacher(course.teacher);
                    const teacherExists = !!matchingTeacher;
                    
                    return (
                      <tr key={index} className="text-xs">
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white">{course.course_code}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white">{course.course_title}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <GraduationCap className={`w-4 h-4 mr-1 ${teacherExists ? 'text-green-500' : 'text-blue-500'}`} />
                            <div>
                              <div className={teacherExists ? 'text-gray-900 dark:text-white' : 'text-blue-600 dark:text-blue-400'}>
                                {course.teacher}
                              </div>
                              {!teacherExists && (
                                <div className="text-xs text-blue-500 dark:text-blue-400 flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Will create new teacher
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {!teacherExists ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="text-blue-500 dark:text-blue-400">Note:</span> Teacher will be automatically created
                            </div>
                          ) : (
                            <select
                              value={teacherSelections[index] || (matchingTeacher ? matchingTeacher.id : 'other')}
                              onChange={(e) => handleTeacherSelection(index, e.target.value)}
                              className="text-xs rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              {matchingTeacher && (
                                <option value={matchingTeacher.id}>Use {matchingTeacher.name}</option>
                              )}
                              <option value="other">Use name as entered</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleImport}
              disabled={loading || !validation.valid}
              className={`text-sm px-4 py-2 rounded-lg shadow-sm flex items-center ${
                loading || !validation.valid 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {progressStatus || 'Importing...'}
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Import {data.length} {data.length === 1 ? 'Course' : 'Courses'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {importResult && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Import Results:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800/30">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{importResult.success}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Courses imported</div>
            </div>
            
            {importResult.newTeacherCount && importResult.newTeacherCount > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{importResult.newTeacherCount}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Teachers created</div>
              </div>
            )}
            
            {importResult.errors.filter(e => !e.isWarning).length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800/30">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{importResult.errors.filter(e => !e.isWarning).length}</div>
                <div className="text-sm text-red-700 dark:text-red-300">Errors</div>
              </div>
            )}
          </div>
          
          {importResult.success > 0 && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-md p-3 text-sm text-green-600 dark:text-green-400 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Successfully imported {importResult.success} {importResult.success === 1 ? 'course' : 'courses'}
              {importResult.newTeacherCount && importResult.newTeacherCount > 0 && ` and created ${importResult.newTeacherCount} new ${importResult.newTeacherCount === 1 ? 'teacher' : 'teachers'}`}
            </div>
          )}
          
          {importResult.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md p-3">
              <div className="text-sm text-red-600 dark:text-red-400 flex items-center mb-2">
                <XCircle className="w-4 h-4 mr-2" />
                {importResult.errors.filter(e => !e.isWarning).length} {importResult.errors.filter(e => !e.isWarning).length === 1 ? 'error' : 'errors'} occurred during import
              </div>
              
              {importResult.errors.filter(e => e.isWarning).length > 0 && (
                <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center mb-2">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {importResult.errors.filter(e => e.isWarning).length} {importResult.errors.filter(e => e.isWarning).length === 1 ? 'warning' : 'warnings'} during import
                </div>
              )}
              
              <ul className="text-xs space-y-1 ml-5 list-disc">
                {importResult.errors.map((error, idx) => (
                  <li 
                    key={idx} 
                    className={
                      error.isSuccess ? 'text-blue-600 dark:text-blue-400' : 
                      error.isWarning ? 'text-amber-600 dark:text-amber-400' : 
                      'text-red-600 dark:text-red-400'
                    }
                  >
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 