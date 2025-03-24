import { useState } from 'react';
import { X, Search, FileText, Book, File, Notebook, Download, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StudyMaterial } from '../../types/course';

interface StudyMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  materials?: StudyMaterial[];
}

export function StudyMaterialsModal({ isOpen, onClose, category, materials = [] }: StudyMaterialsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = () => {
    switch (category.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'books':
        return <Book className="w-6 h-6 text-blue-500" />;
      case 'files':
        return <File className="w-6 h-6 text-green-500" />;
      case 'notes':
        return <Notebook className="w-6 h-6 text-purple-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-x-4 top-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-[201] max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  {getCategoryIcon()}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {category} Materials
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Browse available {category.toLowerCase()} materials
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b dark:border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Materials List */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-4">
              {filteredMaterials.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    {getCategoryIcon()}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    No {category.toLowerCase()} materials found
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMaterials.map((material) => (
                    <motion.div
                      key={material.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-grow">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                            {material.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            {material.description}
                          </p>
                          {material.course && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Course: {material.course.name} ({material.course.code})
                            </p>
                          )}
                        </div>
                        {material.fileUrls.length > 0 && (
                          <a
                            href={material.fileUrls[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                          >
                            <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                            <span>Download</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}