import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Task } from '../types';
import type { Announcement } from '../types/announcement';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  taskId?: string;
  announcementId?: string;
  isAdminTask: boolean;
  isAnnouncement: boolean;
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const sortNotifications = (notifs: Notification[]): Notification[] => {
    return [...notifs].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  };

  useEffect(() => {
    if (!userId) return;

    const loadExistingItems = async () => {
      const [{ data: tasks }, { data: announcements }] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .or(`user_id.eq.${userId},is_admin_task.eq.true`)
          .order('created_at', { ascending: false }),
        supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      const newNotifications: Notification[] = [];

      if (tasks) {
        tasks.forEach(task => {
          newNotifications.push({
            id: crypto.randomUUID(),
            title: task.is_admin_task ? 'New Admin Task' : 'New Task',
            message: `Task "${task.name}" has been created`,
            timestamp: new Date(task.created_at),
            read: false,
            taskId: task.id,
            isAdminTask: task.is_admin_task,
            isAnnouncement: false
          });
        });
      }

      if (announcements) {
        announcements.forEach(announcement => {
          newNotifications.push({
            id: crypto.randomUUID(),
            title: announcement.title,
            message: announcement.content, // Use the content field from announcement
            timestamp: new Date(announcement.created_at),
            read: false,
            announcementId: announcement.id,
            isAdminTask: false,
            isAnnouncement: true
          });
        });
      }

      const sortedNotifications = sortNotifications(newNotifications);
      setNotifications(sortedNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    };

    loadExistingItems();

    const taskSubscription = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          handleNewTask(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: 'is_admin_task=eq.true'
        },
        (payload) => {
          handleNewTask(payload.new as any);
        }
      )
      .subscribe();

    const announcementSubscription = supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements'
        },
        (payload) => {
          handleNewAnnouncement(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      taskSubscription.unsubscribe();
      announcementSubscription.unsubscribe();
    };
  }, [userId]);

  const handleNewTask = (task: any) => {
    if (task.is_admin_task || task.user_id === userId) {
      const notification: Notification = {
        id: crypto.randomUUID(),
        title: task.is_admin_task ? 'New Admin Task' : 'New Task',
        message: `Task "${task.name}" has been created`,
        timestamp: new Date(),
        read: false,
        taskId: task.id,
        isAdminTask: task.is_admin_task,
        isAnnouncement: false
      };

      setNotifications(prev => sortNotifications([notification, ...prev]));
      setUnreadCount(prev => prev + 1);
    }
  };

  const handleNewAnnouncement = (announcement: any) => {
    const notification: Notification = {
      id: crypto.randomUUID(),
      title: announcement.title,
      message: announcement.content, // Use the content field from announcement
      timestamp: new Date(),
      read: false,
      announcementId: announcement.id,
      isAdminTask: false,
      isAnnouncement: true
    };

    setNotifications(prev => sortNotifications([notification, ...prev]));
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      sortNotifications(
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      sortNotifications(
        prev.map(notification => ({ ...notification, read: true }))
      )
    );
    setUnreadCount(0);
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return sortNotifications(prev.filter(n => n.id !== notificationId));
    });
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification
  };
}