export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export type NewAnnouncement = Pick<Announcement, 'title' | 'content'>;