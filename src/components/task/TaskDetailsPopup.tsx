import { X, Calendar, Tag, Clock, Crown, Download, CheckCircle2 } from 'lucide-react';
import { parseLinks } from '../../utils/linkParser';
import type { Task, TaskStatus } from '../../types';

interface TaskDetailsPopupProps {
  task: Task;
  onClose: () => void;
  onStatusUpdate?: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  isUpdating?: boolean;
}

export function TaskDetailsPopup({ 
  task, 
  onClose,
  onStatusUpdate,
  isUpdating = false
}: TaskDetailsPopupProps) {
  // Split description into regular content and file attachments
  const descriptionParts = task.description.split('\nAttached Files:');
  const regularDescription = descriptionParts[0];
  const fileSection = descriptionParts[1]?.split('\n').filter(line => line.trim() && line.includes('](')) || [];

  // Process description to preserve formatting while handling links
  const processDescription = (text: string) => {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    return paragraphs.map(paragraph => {
      const lines = paragraph.split('\n').filter(line => line !== undefined);
      const parsedLines = lines.map(line => parseLinks(line));
      return { lines: parsedLines };
    });
  };

  const formattedDescription = processDescription(regularDescription);
  const overdue = new Date(task.dueDate) < new Date();

  const handleDownload = async (url: string, filename: string) => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  const extractFileInfo = (line: string) => {
    const matches = line.match(/\[(.*?)\]\((.*?)\)/);
    if (matches) {
      return {
        filename: matches[1],
        url: matches[2]
      };
    }
    return null;
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 max-h-[80vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b dark:border-gray-700">
          <div className="pr-8">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {task.name}
              </h2>
              {task.isAdminTask && (
                <Crown className="w-5 h-5 text-yellow-500 animate-bounce-slow hidden md:block" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {onStatusUpdate ? (
                <button
                  onClick={() => onStatusUpdate(task.id, task.status === 'completed' ? 'my-tasks' : 'completed')}
                  disabled={isUpdating}
                  className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 
                    text-xs font-medium rounded-full transition-all
                    ${task.status === 'completed'
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {task.status === 'completed' ? 'Completed' : 'Mark Complete'}
                </button>
              ) : (
                <span className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 
                  text-xs font-medium rounded-full
                  ${task.status === 'completed'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                    : task.status === 'in-progress'
                    ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  }
                `}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {task.status === 'completed' ? 'Completed' : 
                   task.status === 'in-progress' ? 'In Progress' : 'To Do'}
                </span>
              )}
              {task.isAdminTask && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                  Admin Task
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {/* Metadata */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              <span className="capitalize">{task.category.replace('-', ' ')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className={overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                Due: {new Date(task.dueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                {overdue && ' (Overdue)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                Created: {new Date(task.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Description */}
          {regularDescription && (
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Description
              </h3>
              <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {formattedDescription.map((paragraph, pIndex) => (
                  <div key={pIndex} className="mb-4 last:mb-0">
                    {paragraph.lines.map((line, lIndex) => (
                      <div key={lIndex} className="min-h-[1.5em]">
                        {line.map((part, index) => 
                          part.type === 'link' ? (
                            <a
                              key={index}
                              href={part.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {part.content}
                            </a>
                          ) : (
                            <span key={index}>{part.content}</span>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attached Files */}
          {fileSection.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Attached Files
              </h3>
              <div className="space-y-2">
                {fileSection.map((line, index) => {
                  const fileInfo = extractFileInfo(line);
                  if (!fileInfo) return null;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {fileInfo.filename}
                      </span>
                      <button
                        onClick={() => handleDownload(fileInfo.url, fileInfo.filename)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}