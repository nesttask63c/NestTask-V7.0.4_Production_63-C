import { X, Book, Calendar, Download, ExternalLink, FileText, Link, Lock, Clock, Tag, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StudyMaterial } from '../../types/course';

interface StudyMaterialDetailsModalProps {
  material: StudyMaterial;
  isOpen: boolean;
  onClose: () => void;
}

export function StudyMaterialDetailsModal({ material, isOpen, onClose }: StudyMaterialDetailsModalProps) {
  if (!isOpen) return null;

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-5 h-5" />;
      case 'ppt':
      case 'pptx':
        return <Book className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getFileName = (url: string, index: number) => {
    if (material.originalFileNames && material.originalFileNames[index]) {
      return material.originalFileNames[index];
    }
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
  };

  const getFileSize = (url: string) => {
    // This is a placeholder. In a real app, you'd get the actual file size
    return '2.5 MB';
  };

  const handleDownload = async (url: string, index: number) => {
    try {
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = getFileName(url, index);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to opening in new window if download fails
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePreview = (url: string, index: number) => {
    const extension = url.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
    const isPdf = extension === 'pdf';
    const isDoc = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension || '');

    // Set window features for the popup
    const windowFeatures = 'width=1024,height=768,resizable=yes,scrollbars=yes,status=yes';

    if (isImage) {
      const imageWindow = window.open('', '_blank', windowFeatures);
      if (imageWindow) {
        imageWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${getFileName(url, index)} - Preview</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #1a1a1a;
                  color: white;
                  font-family: system-ui, -apple-system, sans-serif;
                }
                img {
                  max-width: 100%;
                  max-height: 80vh;
                  object-fit: contain;
                  margin-bottom: 20px;
                }
                .download-btn {
                  padding: 10px 20px;
                  background: #2563eb;
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 16px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }
                .download-btn:hover {
                  background: #1d4ed8;
                }
              </style>
            </head>
            <body>
              <img src="${url}" alt="${getFileName(url, index)}" />
              <button class="download-btn" onclick="window.location.href='${url}'" download>
                Download Image
              </button>
            </body>
          </html>
        `);
        imageWindow.document.close();
      }
    } else if (isPdf) {
      // For PDFs, open directly in a new window with download option
      const pdfWindow = window.open('', '_blank', windowFeatures);
      if (pdfWindow) {
        pdfWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${getFileName(url, index)} - Preview</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  flex-direction: column;
                  height: 100vh;
                }
                iframe {
                  flex: 1;
                  border: none;
                }
                .toolbar {
                  padding: 10px;
                  background: #1a1a1a;
                  display: flex;
                  justify-content: flex-end;
                }
                .download-btn {
                  padding: 8px 16px;
                  background: #2563eb;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }
                .download-btn:hover {
                  background: #1d4ed8;
                }
              </style>
            </head>
            <body>
              <div class="toolbar">
                <button class="download-btn" onclick="window.location.href='${url}'" download>
                  Download PDF
                </button>
              </div>
              <iframe src="${url}#view=FitH" width="100%" height="100%"></iframe>
            </body>
          </html>
        `);
        pdfWindow.document.close();
      }
    } else {
      // For other files, show download option
      const otherWindow = window.open('', '_blank', windowFeatures);
      if (otherWindow) {
        otherWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${getFileName(url, index)} - Preview</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #1a1a1a;
                  color: white;
                  font-family: system-ui, -apple-system, sans-serif;
                }
                .icon {
                  font-size: 48px;
                  margin-bottom: 20px;
                }
                .filename {
                  margin-bottom: 10px;
                  font-size: 18px;
                }
                .download-btn {
                  margin-top: 20px;
                  padding: 10px 20px;
                  background: #2563eb;
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 16px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }
                .download-btn:hover {
                  background: #1d4ed8;
                }
              </style>
            </head>
            <body>
              <div class="icon">📄</div>
              <p class="filename">${getFileName(url, index)}</p>
              <p>Preview not available for this file type</p>
              <button class="download-btn" onclick="window.location.href='${url}'" download>
                Download File
              </button>
            </body>
          </html>
        `);
        otherWindow.document.close();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[999] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-[95vw] md:w-full md:max-w-2xl bg-white dark:bg-gray-800 
                  rounded-xl shadow-2xl z-[1000] max-h-[90vh] flex flex-col m-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex-shrink-0 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <Book className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                        {material.title}
                      </h2>
                      {material.course && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {material.course.name} ({material.course.code})
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Tag className="w-4 h-4" />
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 
                        text-blue-700 dark:text-blue-300 text-xs font-medium">
                        {material.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(material.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                      {material.description}
                    </p>
                  </div>

                  {/* Files */}
                  {material.fileUrls && material.fileUrls.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Attached Files
                      </h3>
                      <div className="space-y-3">
                        {material.fileUrls.map((url, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-gray-50 
                              dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 
                              dark:hover:bg-gray-700 transition-colors group"
                          >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="flex-shrink-0 p-2.5 bg-white dark:bg-gray-800 rounded-lg">
                                {getFileIcon(url)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {getFileName(url, index)}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {getFileSize(url)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePreview(url, index)}
                                className="p-2.5 text-blue-600 dark:text-blue-400 
                                  hover:bg-blue-50 dark:hover:bg-blue-900/20 
                                  rounded-lg transition-colors"
                                aria-label="Preview file"
                              >
                                <Eye className="w-5 h-5" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDownload(url, index)}
                                className="p-2.5 text-blue-600 dark:text-blue-400 
                                  hover:bg-blue-50 dark:hover:bg-blue-900/20 
                                  rounded-lg transition-colors"
                                aria-label="Download file"
                              >
                                <Download className="w-5 h-5" />
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}