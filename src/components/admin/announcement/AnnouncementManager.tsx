import { AnnouncementForm } from './AnnouncementForm';
import { AnnouncementList } from './AnnouncementList';
import type { Announcement, NewAnnouncement } from '../../../types/announcement';

interface AnnouncementManagerProps {
  announcements: Announcement[];
  onCreateAnnouncement: (announcement: NewAnnouncement) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
}

export function AnnouncementManager({
  announcements,
  onCreateAnnouncement,
  onDeleteAnnouncement
}: AnnouncementManagerProps) {
  return (
    <div>
      <AnnouncementForm onSubmit={onCreateAnnouncement} />
      <AnnouncementList 
        announcements={announcements}
        onDelete={onDeleteAnnouncement}
      />
    </div>
  );
}