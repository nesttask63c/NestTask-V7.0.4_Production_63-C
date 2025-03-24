import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  fetchAnnouncements, 
  createAnnouncement, 
  deleteAnnouncement 
} from '../services/announcement.service';
import type { Announcement, NewAnnouncement } from '../types/announcement';

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnnouncements();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        () => {
          loadAnnouncements();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await fetchAnnouncements();
      setAnnouncements(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (newAnnouncement: NewAnnouncement) => {
    try {
      setError(null);
      await createAnnouncement(newAnnouncement);
      await loadAnnouncements();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      setError(null);
      await deleteAnnouncement(id);
      await loadAnnouncements();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    announcements,
    loading,
    error,
    createAnnouncement: handleCreateAnnouncement,
    deleteAnnouncement: handleDeleteAnnouncement,
  };
}