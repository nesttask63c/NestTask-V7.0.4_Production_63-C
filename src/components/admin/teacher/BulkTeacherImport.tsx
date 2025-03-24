import { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, File, AlertTriangle, Loader2, GraduationCap } from 'lucide-react';
import type { Course } from '../../../types/course';
import { TeacherBulkImportItem } from '../../../services/teacher.service';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../../utils/notifications';

interface BulkTeacherImportProps {
  courses: Course[];
  onImportTeachers: (teachers: TeacherBulkImportItem[]) => Promise<{ success: number; errors: { index: number; error: string }[] }>;
}

type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function BulkTeacherImport({ courses, onImportTeachers }: BulkTeacherImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<TeacherBulkImportItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; errors: { index: number; error: string }[] } | null>(null);
  const [progressStatus, setProgressStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateTeacherData = (data: any[]): ValidationResult => {
    const errors: string[] = [];
    
    if (!Array.isArray(data)) {
      return { valid: false, errors: ['Invalid JSON format: Expected an array'] };
    }
    
    if (data.length === 0) {
      return { valid: false, errors: ['Empty data: No teachers to import'] };
    }
    
    data.forEach((teacher, index) => {
      if (!teacher) {
        errors.push(`Teacher #${index + 1}: Invalid teacher object`);
        return;
      }
      
      if (!teacher.teacher_name) {
        errors.push(`Teacher #${index + 1}: Missing required field "teacher_name"`);
      }
    });
    
    return { valid: errors.length === 0, errors };
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportResult(null);
    setValidation(null);
    
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
      showErrorToast('Invalid file format. Only JSON files are supported.');
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
      const validationResult = validateTeacherData(jsonData);
      setValidation(validationResult);
      
      if (validationResult.valid) {
        showInfoToast(`Valid JSON with ${jsonData.length} teacher${jsonData.length !== 1 ? 's' : ''} ready to import`);
      } else {
        showErrorToast('JSON validation failed. Please check the errors below.');
      }
    } catch (err: any) {
      setValidation({
        valid: false,
        errors: [`Invalid JSON: ${err.message}`]
      });
      showErrorToast(`Invalid JSON: ${err.message}`);
      setData(null);
    } finally {
      setValidating(false);
    }
  };

  const findMatchingCourse = (courseCode: string): Course | undefined => {
    return courses.find(course => 
      course.code.toLowerCase() === courseCode.toLowerCase()
    );
  };
  
  const handleImport = async () => {
    if (!data || !validation?.valid) {
      showErrorToast('Cannot import. Please provide valid teacher data.');
      return;
    }
    
    setLoading(true);
    setProgressStatus('Preparing import...');
    
    try {
      setProgressStatus('Importing teachers...');
      showInfoToast('Starting teacher import...', { position: 'top-right' });
      
      const result = await onImportTeachers(data);
      setImportResult(result);
      
      // Toast notifications based on result
      if (result.success > 0) {
        showSuccessToast(`Successfully imported ${result.success} teacher${result.success !== 1 ? 's' : ''}`, { duration: 5000 });
      }
      
      if (result.errors.length > 0) {
        showErrorToast(`${result.errors.length} teacher${result.errors.length !== 1 ? 's' : ''} failed to import`, { duration: 5000 });
      }
      
      // Clear the file input if successful
      if (result.success > 0 && result.errors.length === 0) {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setFile(null);
        setData(null);
        setValidation(null);
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      showErrorToast(`Import failed: ${error.message}`, { duration: 7000 });
      setImportResult({
        success: 0,
        errors: [{ index: -1, error: `Import failed: ${error.message}` }]
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderImportResults = () => {
    if (!importResult) return null;
    
    const successCount = importResult.success;
    const errorCount = importResult.errors.length;
    
    // Count duplicate name errors
    const duplicateNameErrors = importResult.errors.filter(err => 
      err.error.includes('already exists')
    ).length;
    
    return (
      <div className="mt-6 bg-white dark:bg-gray-800 border rounded-xl p-5 shadow-sm">
        <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className={`w-5 h-5 ${successCount > 0 ? 'text-green-500' : 'text-gray-400'}`} />
          Import Results
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800/30">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{successCount}</div>
            <div className="text-sm text-green-700 dark:text-green-300">Successfully imported</div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800/30">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{errorCount}</div>
            <div className="text-sm text-red-700 dark:text-red-300">Failed to import</div>
          </div>
          
          {duplicateNameErrors > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800/30">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{duplicateNameErrors}</div>
              <div className="text-sm text-amber-700 dark:text-amber-300">Duplicate teacher names</div>
            </div>
          )}
        </div>
        
        {errorCount > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Import Errors
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="py-2 px-4 text-left font-medium text-gray-700 dark:text-gray-300">Row</th>
                    <th className="py-2 px-4 text-left font-medium text-gray-700 dark:text-gray-300">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.errors.map((error, index) => (
                    <tr 
                      key={index} 
                      className={`border-t border-gray-200 dark:border-gray-700 ${
                        error.error.includes('already exists') 
                          ? 'bg-amber-50 dark:bg-amber-900/20' 
                          : ''
                      }`}
                    >
                      <td className="py-2 px-4 align-top">
                        {error.index >= 0 ? `#${error.index + 1}` : 'Global'}
                      </td>
                      <td className="py-2 px-4 text-red-600 dark:text-red-400 align-top">
                        {error.error}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl shadow-sm">
          <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk Import Teachers</h2>
      </div>
      
      <div className="prose prose-sm dark:prose-invert mb-5">
        <p>
          Import multiple teachers at once using a JSON file. Each teacher record should include a name and can optionally include email, phone, department, office room, and course information.
        </p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">JSON Format Example:</h3>
        <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-xs overflow-x-auto border border-gray-200 dark:border-gray-700 whitespace-pre">
{`[
  {
    "teacher_name": "John Smith",
    "email": "john.smith@example.com",
    "phone": "123-456-7890",
    "department": "Computer Science",
    "office_room": "CS-101",
    "course_code": "CS101"
  },
  {
    "teacher_name": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "987-654-3210",
    "department": "Mathematics"
  }
]`}
        </pre>
      </div>
      
      <div className="flex items-center justify-center w-full mb-6">
        <label
          htmlFor="dropzone-file"
          className={`flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-lg cursor-pointer ${
            validation?.valid 
              ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20' 
              : validation?.errors && validation.errors.length > 0
                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/20'
          } hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {validating ? (
              <>
                <Loader2 className="w-10 h-10 text-gray-400 dark:text-gray-500 animate-spin mb-3" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Validating file...</p>
              </>
            ) : file && validation?.valid ? (
              <>
                <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400 mb-3" />
                <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {data?.length} teacher{data?.length !== 1 ? 's' : ''} ready to import
                </p>
              </>
            ) : file && validation?.errors && validation.errors.length > 0 ? (
              <>
                <XCircle className="w-10 h-10 text-red-500 dark:text-red-400 mb-3" />
                <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  File has {validation.errors.length} validation error{validation.errors.length !== 1 ? 's' : ''}
                </p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">JSON file only</p>
              </>
            )}
          </div>
          <input id="dropzone-file" ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
        </label>
      </div>
      
      {validation?.errors && validation.errors.length > 0 && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Validation Errors
          </h3>
          <ul className="text-xs text-red-700 dark:text-red-400 list-disc pl-5 space-y-1 max-h-40 overflow-y-auto">
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {renderImportResults()}
      
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || !validation?.valid || !file}
          className={`
            py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2
            ${loading || !validation?.valid || !file
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
              : 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600'}
            transition-colors duration-200
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {progressStatus || 'Importing...'}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Import Teachers
            </>
          )}
        </button>
        
        <button
          type="button"
          onClick={handleReset}
          disabled={loading || (!file && !data)}
          className={`
            py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 
            ${loading || (!file && !data)
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}
            transition-colors duration-200
          `}
        >
          <XCircle className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
} 