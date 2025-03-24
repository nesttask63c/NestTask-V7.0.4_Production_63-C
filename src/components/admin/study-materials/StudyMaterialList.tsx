import { useState } from 'react';
import { 
  Search, 
  Trash2, 
  FileText, 
  Book, 
  Download,
  Calendar,
  Folder
} from 'lucide-react';
import type { StudyMaterial } from '../../../types/course';

interface StudyMaterialListProps {
  materials: StudyMaterial[];
  onDelete: (id: string) => Promise<void>;
}

export function StudyMaterialList({ materials = [], onDelete }: StudyMaterialListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMaterials = materials.filter(material => 
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.course?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden mt-6">
      <div className="p-6">
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>

        <div className="space-y-4">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 group hover:shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-grow space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-words">
                      {material.title}
                    </h3>
                    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                      {material.category}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base break-words">
                    {material.description}
                  </p>

                  {material.course && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Book className="w-4 h-4" />
                      <span>{material.course.name} ({material.course.code})</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(material.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-2">
                  {material.fileUrls && material.fileUrls.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {material.fileUrls.map((url, index) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={`Download ${material.originalFileNames?.[index] || 'material'}`}
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm truncate max-w-[200px]">
                            {material.originalFileNames?.[index] || 'Download'}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => onDelete(material.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete material"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredMaterials.length === 0 && (
            <div className="text-center py-12">
              <Book className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No materials found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {searchTerm ? 'Try a different search term' : 'Add your first study material above'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}