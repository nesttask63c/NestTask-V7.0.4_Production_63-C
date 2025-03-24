import { useState, useEffect } from 'react';
import { X, Tag, Calendar, AlignLeft, Link2, Upload, CheckCircle } from 'lucide-react';
import type { Task } from '../../../types';

interface TaskEditModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}

export function TaskEditModal({ task, onClose, onUpdate }: TaskEditModalProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    name: task.name,
    category: task.category,
    dueDate: task.dueDate,
    description: task.description,
    status: task.status,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Extract existing attachments from description and clean description
  useEffect(() => {
    if (task.description) {
      const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const matches: string[] = [];
      const existingLinks: string[] = [];
      
      // Replace description with clean version (without attachment links)
      let cleanDescription = task.description.replace(
        /\n\n\*\*Attachments:\*\*\n((?:- \[[^\]]+\]\([^)]+\)\n)*)/g, 
        ''
      ).replace(
        /\n\n\*\*Links:\*\*\n((?:- \[[^\]]+\]\([^)]+\)\n)*)/g, 
        ''
      ).trim();
      
      // Extract links
      let match;
      while ((match = regex.exec(task.description)) !== null) {
        const [fullMatch, text, url] = match;
        
        if (url.startsWith('attachment:')) {
          matches.push(text);
        } else if (!url.startsWith('attachment:') && text === url) {
          existingLinks.push(url);
        }
      }
      
      setAttachments(matches);
      setLinks(existingLinks);
      setFormData(prev => ({ ...prev, description: cleanDescription }));
    }
  }, [task.description]);
  
  // Validation function
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Task name is required';
      isValid = false;
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
      isValid = false;
    } else {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today && formData.status !== 'completed') {
        newErrors.dueDate = 'Due date cannot be in the past for non-completed tasks';
        isValid = false;
      }
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
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
    if (fileUrls[index]) {
      URL.revokeObjectURL(fileUrls[index]);
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  // Remove existing attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would upload files to a server and get URLs
      // For now, we'll just add placeholder URLs to the description
      let enhancedDescription = formData.description || '';
      
      // Add links to description
      if (links.length > 0) {
        enhancedDescription += '\n\n**Links:**\n';
        links.forEach(link => {
          enhancedDescription += `- [${link}](${link})\n`;
        });
      }
      
      // Add existing attachments
      if (attachments.length > 0) {
        enhancedDescription += '\n\n**Attachments:**\n';
        attachments.forEach(attachment => {
          enhancedDescription += `- [${attachment}](attachment:${attachment})\n`;
        });
      }
      
      // Add new files
      if (files.length > 0) {
        if (attachments.length === 0) {
          enhancedDescription += '\n\n**Attachments:**\n';
        }
        files.forEach(file => {
          enhancedDescription += `- [${file.name}](attachment:${file.name})\n`;
        });
      }
      
      const updates: Partial<Task> = {
        ...formData,
        description: enhancedDescription,
      };
      
      onUpdate(updates);
      setShowSuccess(true);
      
      // Close modal after success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  // Handle modal backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative">
        {/* Modal Header */}
        <div className="sticky top-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 z-10">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Task</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Name<span className="text-red-500">*</span>
              </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white
                    ${errors.name ? 'border-red-500 dark:border-red-500' : ''}`}
                  placeholder="Enter task name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="category"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                Due Date<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate || ''}
                  min={formData.status === 'completed' ? undefined : getMinDate()}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white
                    ${errors.dueDate ? 'border-red-500 dark:border-red-500' : ''}`}
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dueDate}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="my-tasks">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <AlignLeft className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none
                    ${errors.description ? 'border-red-500 dark:border-red-500' : ''}`}
                  placeholder="Enter task description"
                ></textarea>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Links</h4>
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
                      className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="https://example.com"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addLink}
                    className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center whitespace-nowrap text-sm"
                  >
                    Add Link
                  </button>
                </div>
                
                {links.length > 0 && (
                  <div className="mt-3 space-y-2">
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
            </div>
            
            <div className="md:col-span-2">
              <div className="pb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Attachments</h4>
                
                {/* Existing attachments */}
                {attachments.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Current Attachments</h5>
                    <div className="space-y-2">
                      {attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[calc(100%-30px)]">
                            {attachment}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* File Upload */}
                <div className="border-2 border-dashed dark:border-gray-600 rounded-xl px-4 sm:px-6 py-6 sm:py-8 text-center flex flex-col items-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
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
                    <p className="mt-1 text-xs sm:text-sm">Drag and drop or click to select</p>
                  </div>
                </div>
                
                {/* New files */}
                {files.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">New Attachments</h5>
                    <div className="space-y-2">
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
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-xl font-medium text-white ${
                isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors flex justify-center items-center gap-2`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Task'
              )}
              </button>
          </div>
          
          {showSuccess && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Task updated successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}