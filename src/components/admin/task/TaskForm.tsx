import { useState } from 'react';
import { 
  Tag, 
  Calendar, 
  AlignLeft, 
  Plus, 
  Link2, 
  ListTodo, 
  Upload, 
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import type { NewTask } from '../../../types/task';

interface TaskFormProps {
  onSubmit: (task: NewTask) => void;
}

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [taskDetails, setTaskDetails] = useState<NewTask>({
    name: '',
    category: 'task',
    dueDate: '',
    description: '',
    status: 'in-progress',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof NewTask, string>>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Validation function
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof NewTask, string>> = {};
    let isValid = true;
    
    if (!taskDetails.name.trim()) {
      newErrors.name = 'Task name is required';
      isValid = false;
    }
    
    if (!taskDetails.dueDate) {
      newErrors.dueDate = 'Due date is required';
      isValid = false;
    } else {
      const selectedDate = new Date(taskDetails.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
        isValid = false;
      }
    }
    
    if (!taskDetails.description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTaskDetails(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (errors[name as keyof NewTask]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      
      // Create temporary URLs for display
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setFileUrls(prev => [...prev, ...newUrls]);
    }
  };
  
  // Remove file
  const removeFile = (index: number) => {
    URL.revokeObjectURL(fileUrls[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  // Add link
  const addLink = () => {
    if (linkInput.trim() && !links.includes(linkInput)) {
      setLinks(prev => [...prev, linkInput]);
      setLinkInput('');
    }
  };
  
  // Remove link
  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would upload files to a server here
      // For now, we'll just add the links to the description
      let enhancedDescription = taskDetails.description;
      
      // Add links to description
      if (links.length > 0) {
        enhancedDescription += '\n\n**Links:**\n';
        links.forEach(link => {
          enhancedDescription += `- [${link}](${link})\n`;
        });
      }
      
      // Add file references (in a real app, these would be uploaded and proper URLs would be used)
      if (files.length > 0) {
        enhancedDescription += '\n\n**Attachments:**\n';
        files.forEach(file => {
          enhancedDescription += `- [${file.name}](attachment:${file.name})\n`;
        });
      }
      
      const finalTask: NewTask = {
        ...taskDetails,
        description: enhancedDescription,
      };
      
      onSubmit(finalTask);
      
      // Reset form
      setTaskDetails({
        name: '',
        category: 'task',
        dueDate: '',
        description: '',
        status: 'in-progress',
      });
      setFiles([]);
      setFileUrls([]);
      setLinks([]);
      setErrors({});
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Create New Task</h3>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center gap-1"
        >
          {showAdvanced ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span className="hidden sm:inline">Hide Advanced</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span className="hidden sm:inline">Advanced Options</span>
            </>
          )}
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Name*
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ListTodo className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={taskDetails.name}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base
                  ${errors.name ? 'border-red-500 dark:border-red-500' : 'dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                placeholder="Enter task name"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category*
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="category"
                name="category"
                value={taskDetails.category}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
              >
                <option value="assignment">Assignment</option>
                <option value="blc">BLC</option>
                <option value="documents">Documents</option>
                <option value="final-exam">Final Exam</option>
                <option value="groups">Groups</option>
                <option value="lab-final">Lab Final</option>
                <option value="lab-performance">Lab Performance</option>
                <option value="lab-report">Lab Report</option>
                <option value="midterm">Midterm</option>
                <option value="presentation">Presentation</option>
                <option value="project">Project</option>
                <option value="quiz">Quiz</option>
                <option value="task">Task</option>
                <option value="others">Others</option>
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date*
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                min={getMinDate()}
                value={taskDetails.dueDate}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base
                  ${errors.dueDate ? 'border-red-500 dark:border-red-500' : 'dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
              />
            </div>
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.dueDate}
              </p>
            )}
          </div>
          
          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description*
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <AlignLeft className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="description"
                name="description"
                value={taskDetails.description}
                onChange={handleChange}
                rows={4}
                className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base
                  ${errors.description ? 'border-red-500 dark:border-red-500' : 'dark:border-gray-600 dark:bg-gray-700 dark:text-white'}`}
                placeholder="Enter task description"
              ></textarea>
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.description}
              </p>
            )}
          </div>
          
          {showAdvanced && (
            <>
              <div className="sm:col-span-2">
                <label htmlFor="links" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Links
                </label>
                <div className="flex items-center gap-2 mb-2 flex-wrap sm:flex-nowrap">
                  <div className="relative flex-1 min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Link2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="url"
                      id="link"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                      placeholder="https://example.com"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addLink}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm sm:text-base leading-4 font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Link
                  </button>
                </div>
                
                {links.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {links.map((link, index) => (
                      <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm truncate max-w-[calc(100%-30px)]"
                        >
                          {link}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  File Attachments
                </label>
                
                <div className="mt-1 border-2 border-dashed dark:border-gray-600 rounded-xl px-6 py-8 text-center flex flex-col items-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <p className="mt-1">Drag and drop or click to select files</p>
                  </div>
                </div>
                
                {fileUrls.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center text-sm">
                          <div className="font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
                            {file.name}
                          </div>
                          <div className="ml-2 text-gray-500 dark:text-gray-400 text-xs">
                            {(file.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={taskDetails.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                >
                  <option value="my-tasks">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-white ${
              isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors flex justify-center items-center gap-2 text-sm sm:text-base`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Task...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Task
              </>
            )}
          </button>
        </div>
        
        {success && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Task created successfully!
          </div>
        )}
      </form>
    </div>
  );
}
