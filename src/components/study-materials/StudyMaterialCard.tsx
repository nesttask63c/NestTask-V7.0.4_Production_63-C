import { 
  FileText, 
  Download, 
  Calendar, 
  Book,
  Folder,
  ExternalLink,
  Eye,
  Clock,
  Tag
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { StudyMaterial } from '../../types/course';

interface StudyMaterialCardProps {
  material: StudyMaterial;
  onClick?: () => void;
}

export function StudyMaterialCard({ material, onClick }: StudyMaterialCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'task':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'presentation':
      case 'class slide':
      case 'slide':
        return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      case 'assignment':
        return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'quiz':
        return 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'lab report':
      case 'lab final':
      case 'lab performance':
        return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400';
      default:
        return 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'task':
        return <FileText className="w-4 h-4" />;
      case 'presentation':
      case 'class slide':
      case 'slide':
        return <Book className="w-4 h-4" />;
      default:
        return <Folder className="w-4 h-4" />;
    }
  };

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4" />;
      case 'ppt':
      case 'pptx':
        return <Book className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getFileName = (url: string, index: number) => {
    // Use original filename if available
    if (material.originalFileNames && material.originalFileNames[index]) {
      const originalName = material.originalFileNames[index];
      return originalName.length > 20 ? originalName.substring(0, 20) + '...' : originalName;
    }
    
    // Fallback to URL-based filename
    const parts = url.split('/');
    const fullName = parts[parts.length - 1];
    const decoded = decodeURIComponent(fullName);
    return decoded.length > 20 ? decoded.substring(0, 20) + '...' : decoded;
  };

  const getBorderColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'task':
        return 'border-blue-200 dark:border-blue-800';
      case 'presentation':
      case 'class slide':
      case 'slide':
        return 'border-purple-200 dark:border-purple-800';
      case 'assignment':
        return 'border-green-200 dark:border-green-800';
      case 'quiz':
        return 'border-yellow-200 dark:border-yellow-800';
      case 'lab report':
      case 'lab final':
      case 'lab performance':
        return 'border-indigo-200 dark:border-indigo-800';
      case 'midterm':
        return 'border-red-200 dark:border-red-800';
      case 'final exam':
        return 'border-pink-200 dark:border-pink-800';
      case 'project':
        return 'border-cyan-200 dark:border-cyan-800';
      case 'blc':
        return 'border-orange-200 dark:border-orange-800';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };

  const getHoverEffect = (category: string) => {
    switch (category.toLowerCase()) {
      case 'task':
        return 'hover:border-blue-400 dark:hover:border-blue-600';
      case 'presentation':
      case 'class slide':
      case 'slide':
        return 'hover:border-purple-400 dark:hover:border-purple-600';
      case 'assignment':
        return 'hover:border-green-400 dark:hover:border-green-600';
      case 'quiz':
        return 'hover:border-yellow-400 dark:hover:border-yellow-600';
      case 'lab report':
      case 'lab final':
      case 'lab performance':
        return 'hover:border-indigo-400 dark:hover:border-indigo-600';
      case 'midterm':
        return 'hover:border-red-400 dark:hover:border-red-600';
      case 'final exam':
        return 'hover:border-pink-400 dark:hover:border-pink-600';
      case 'project':
        return 'hover:border-cyan-400 dark:hover:border-cyan-600';
      case 'blc':
        return 'hover:border-orange-400 dark:hover:border-orange-600';
      default:
        return 'hover:border-gray-400 dark:hover:border-gray-600';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md 
        transition-all duration-300 border-2 ${getBorderColor(material.category)} ${getHoverEffect(material.category)}
        group cursor-pointer overflow-hidden`}
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 
                dark:group-hover:text-blue-400 transition-colors break-words line-clamp-2">
                {material.title}
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full 
                text-xs font-medium ${getCategoryColor(material.category)}`}>
                {getCategoryIcon(material.category)}
                <span className="truncate max-w-[80px]">{material.category}</span>
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
              {material.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(material.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>

          {material.fileUrls && material.fileUrls.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {material.fileUrls.length} {material.fileUrls.length === 1 ? 'file' : 'files'}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 
                  dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}