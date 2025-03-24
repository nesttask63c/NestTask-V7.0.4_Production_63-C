import { useState } from 'react';
import { Send, Megaphone } from 'lucide-react';
import type { NewAnnouncement } from '../../../types/announcement';

interface AnnouncementFormProps {
  onSubmit: (announcement: NewAnnouncement) => Promise<void>;
}

export function AnnouncementForm({ onSubmit }: AnnouncementFormProps) {
  const [announcement, setAnnouncement] = useState<NewAnnouncement>({
    title: '',
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(announcement);
      setAnnouncement({ title: '', content: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Create Announcement</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Send important updates to all users
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={announcement.title}
            onChange={(e) => setAnnouncement(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
            placeholder="Enter announcement title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Content
          </label>
          <textarea
            value={announcement.content}
            onChange={(e) => setAnnouncement(prev => ({ ...prev, content: e.target.value }))}
            className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white h-32 resize-none transition-colors"
            placeholder="Enter announcement content"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white
            ${isSubmitting 
              ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            }
            transition-colors duration-200 shadow-sm hover:shadow-md
          `}
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Sending...' : 'Send Announcement'}
        </button>
      </div>
    </form>
  );
}