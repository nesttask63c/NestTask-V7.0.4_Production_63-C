import { useState } from 'react';
import { 
  Book, 
  FileText, 
  Upload, 
  Plus, 
  X,
  Folder
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { Course, NewStudyMaterial, StudyMaterialCategory } from '../../../types/course';

interface StudyMaterialFormProps {
  courses: Course[];
  onSubmit: (material: NewStudyMaterial) => Promise<void>;
}

export function StudyMaterialForm({ courses, onSubmit }: StudyMaterialFormProps) {
  const [material, setMaterial] = useState<NewStudyMaterial>({
    title: '',
    description: '',
    courseId: '',
    category: 'Documents',
    fileUrls: [],
    originalFileNames: []
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const categories: StudyMaterialCategory[] = [
    'Task',
    'Presentation',
    'Assignment',
    'Quiz',
    'Lab Report',
    'Lab Final',
    'Lab Performance',
    'Documents',
    'BLC',
    'Groups',
    'Others',
    'Midterm',
    'Final Exam',
    'Project',
    'Class Slide',
    'Slide'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (files.length === 0) {
        // If no files, just submit the material
        await onSubmit({
          ...material,
          fileUrls: [],
          originalFileNames: []
        });
      } else {
        // Upload files first
        const uploadedUrls = await Promise.all(
          files.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload file directly
            const { data, error } = await supabase.storage
              .from('task-attachments')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                onUploadProgress: (progress) => {
                  setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: (progress.loaded / progress.total) * 100
                  }));
                }
              });

            if (error) {
              console.error('Upload error:', error);
              throw new Error(`File upload error: ${error.message}`);
            }

            if (!data) {
              throw new Error('Upload completed but no data returned');
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('task-attachments')
              .getPublicUrl(data.path);

            return {
              url: publicUrl,
              originalFileName: file.name
            };
          })
        );

        // Submit material with file URLs and original filenames
        await onSubmit({
          ...material,
          fileUrls: uploadedUrls.map(f => f.url),
          originalFileNames: uploadedUrls.map(f => f.originalFileName)
        });
      }

      // Reset form
      setMaterial({
        title: '',
        description: '',
        courseId: '',
        category: 'Documents',
        fileUrls: [],
        originalFileNames: []
      });
      setFiles([]);
      setUploadProgress({});
    } catch (error) {
      console.error('Error in form submission:', error);
      // Show error to user
      alert(error instanceof Error ? error.message : 'Failed to upload files. Please try again.');
    } finally {
      setIsSubmitting(false);
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
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[files[index].name];
      return newProgress;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Study Material</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Upload new study materials for courses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={material.title}
            onChange={(e) => setMaterial(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* Course Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Course
          </label>
          <select
            value={material.courseId}
            onChange={(e) => setMaterial(prev => ({ ...prev, courseId: e.target.value }))}
            className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">Select a course</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </div>

        {/* Category Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            value={material.category}
            onChange={(e) => setMaterial(prev => ({ ...prev, category: e.target.value as StudyMaterialCategory }))}
            className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={material.description}
            onChange={(e) => setMaterial(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white h-32 resize-none"
            required
          />
        </div>

        {/* File Upload */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Files
          </label>
          
          <div className="mt-2 flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <Upload className="w-5 h-5" />
              <span>Upload Files</span>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.rtf,.md,.ppt,.pptx,.xls,.xlsx"
              />
            </label>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                >
                  <div className="flex items-center gap-3 flex-grow">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div className="min-w-0 flex-grow">
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {file.name}
                      </p>
                      {uploadProgress[file.name] !== undefined && (
                        <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded-full mt-1">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[file.name]}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
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
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-full mt-6 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white
          ${isSubmitting 
            ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }
          transition-colors duration-200 shadow-sm hover:shadow-md
        `}
      >
        <Plus className="w-5 h-5" />
        {isSubmitting ? 'Uploading...' : 'Upload Material'}
      </button>
    </form>
  );
}