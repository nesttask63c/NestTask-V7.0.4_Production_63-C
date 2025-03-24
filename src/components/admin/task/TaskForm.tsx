import { useState } from 'react';
import { 
  Tag, 
  Calendar, 
  AlignLeft, 
  Plus, 
  Link2, 
  ListTodo, 
  Upload, 
  X 
} from 'lucide-react';
import type { NewTask, TaskCategory } from '../../../types/task';

interface TaskFormProps {
  onSubmit: (task: NewTask) => void;
}

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [task, setTask] = useState<NewTask>({
    name: '',
    category: 'task',
    dueDate: '',
    description: '',
    status: 'in-progress',
  });

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Upload files and get URLs
      const fileUrls = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          
          // Upload to your server/storage and get URL
          // For this example, we'll just create a temporary URL
          const url = URL.createObjectURL(file);
          return `[${file.name}](${url})`;
        })
      );

      // Add file links to description
      const descriptionWithFiles = task.description + 
        (task.description && fileUrls.length ? '\n\n' : '') +
        (fileUrls.length ? 'Attached Files:\n' + fileUrls.join('\n') : '');

      onSubmit({
        ...task,
        description: descriptionWithFiles
      });

      // Reset form
      setTask({
        name: '',
        category: 'task',
        dueDate: '',
        description: '',
        status: 'in-progress',
      });
      setShowLinkInput(false);
      setLinkInput('');
      setFiles([]);
    } finally {
      setUploading(false);
    }
  };

  const addLink = () => {
    if (linkInput.trim()) {
      const newDescription = task.description + 
        (task.description ? '\n' : '') + 
        linkInput.trim();
      setTask(prev => ({ ...prev, description: newDescription }));
      setLinkInput('');
      setShowLinkInput(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
        <ListTodo className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Create New Admin Task</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Task Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={task.name}
                onChange={(e) => setTask(prev => ({ ...prev, name: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <div className="relative">
              <select
                value={task.category}
                onChange={(e) => setTask(prev => ({ ...prev, category: e.target.value as TaskCategory }))}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
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
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Due Date Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={task.dueDate}
                onChange={(e) => setTask(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Description Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <div className="relative h-full">
              <textarea
                value={task.description}
                onChange={(e) => setTask(prev => ({ ...prev, description: e.target.value }))}
                className="w-full h-[calc(100%-2rem)] min-h-[150px] pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                required
              />
              <AlignLeft className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Link Input Section */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowLinkInput(!showLinkInput)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Link2 className="w-4 h-4" />
                {showLinkInput ? 'Hide Link Input' : 'Add Link'}
              </button>

              {/* File Upload Button */}
              <label className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer">
                <Upload className="w-4 h-4" />
                Add Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.rtf,.md"
                />
              </label>
            </div>

            {showLinkInput && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="Enter URL"
                  className="flex-grow pl-3 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
                <button
                  type="button"
                  onClick={addLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                >
                  Add
                </button>
              </div>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Attached Files:
                </p>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={uploading}
        className={`
          w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 
          text-white py-2 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 
          dark:hover:from-blue-600 dark:hover:to-indigo-600 focus:outline-none focus:ring-2 
          focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 
          flex items-center justify-center gap-2
          ${uploading ? 'opacity-75 cursor-not-allowed' : ''}
        `}
      >
        <Plus className="w-5 h-5" />
        {uploading ? 'Creating Task...' : 'Create Admin Task'}
      </button>
    </form>
  );
}
