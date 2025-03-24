import { supabase } from '../lib/supabase';
import { sendAnnouncementNotification } from './telegram.service';
import type { Announcement, NewAnnouncement } from '../types/announcement';

export async function fetchAnnouncements() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Announcement[];
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

export async function createAnnouncement(announcement: NewAnnouncement) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  try {
    const timestamp = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: announcement.title,
        content: announcement.content,
        created_by: user.id,
        created_at: timestamp
      })
      .select()
      .single();

    if (error) throw error;

    const newAnnouncement = {
      ...data,
      createdAt: timestamp
    } as Announcement;

    // Send Telegram notification
    await sendAnnouncementNotification(newAnnouncement);

    return newAnnouncement;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
}

export async function deleteAnnouncement(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
}
