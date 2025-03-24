import { Megaphone, Trash2, Calendar } from 'lucide-react';
import type { Announcement } from '../../../types/announcement';
import { parseLinks } from '../../../utils/linkParser';

interface AnnouncementListProps {
  announcements: Announcement[];
  onDelete: (id: string) => Promise<void>;
}

export function AnnouncementList({ announcements, onDelete }: AnnouncementListProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Recent Announcements</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {announcements.length} {announcements.length === 1 ? 'announcement' : 'announcements'} sent
          </p>
        </div>
      </div>
      
      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No announcements yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first announcement above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const contentParts = parseLinks(announcement.content);
            
            return (
              <div
                key={announcement.id}
                className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 group hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-grow space-y-2 min-w-0"> {/* Added min-w-0 */}
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-words">
                      {announcement.title}
                    </h3>
                    <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base break-words">
                      {contentParts.map((part, index) => 
                        part.type === 'link' ? (
                          <a
                            key={index}
                            href={part.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {part.content}
                          </a>
                        ) : (
                          <span key={index}>{part.content}</span>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center gap-2">
                    <button
                      onClick={() => onDelete(announcement.id)}
                      className="p-2 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}