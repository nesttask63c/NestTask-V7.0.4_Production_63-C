import { supabase } from '../lib/supabase';
import { sendTaskNotification } from './telegram.service';
import type { Task, NewTask } from '../types/task';
import { mapTaskFromDB } from '../utils/taskMapper';

export async function fetchTasks(userId: string) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`user_id.eq.${userId},is_admin_task.eq.true`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapTaskFromDB);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

async function uploadFile(file: File): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `task-files/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function createTask(userId: string, task: NewTask) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.user_metadata?.role === 'admin';

    // Extract file information from description
    const fileMatches = task.description.match(/\[.*?\]\(blob:.*?\)/g) || [];
    let description = task.description;

    // Upload each file and update description with permanent URLs
    for (const match of fileMatches) {
      const [, fileName, blobUrl] = match.match(/\[(.*?)\]\((blob:.*?)\)/) || [];
      if (fileName && blobUrl) {
        try {
          const response = await fetch(blobUrl);
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: blob.type });
          const permanentUrl = await uploadFile(file);
          description = description.replace(match, `[${fileName}](${permanentUrl})`);
        } catch (error) {
          console.error('Error processing file:', error);
        }
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        name: task.name,
        category: task.category,
        due_date: task.dueDate,
        description: description,
        status: task.status,
        user_id: userId,
        is_admin_task: isAdmin
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned after creating task');

    const newTask = mapTaskFromDB(data);

    // Send notifications if it's an admin task
    if (isAdmin) {
      await sendPushNotifications(newTask);
      await sendTaskNotification(newTask);
    }

    return newTask;
  } catch (error: any) {
    console.error('Error creating task:', error);
    throw new Error(error.message || 'Failed to create task');
  }
}

async function sendPushNotifications(task: Task) {
  try {
    // Get all push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription');

    if (error) throw error;
    if (!subscriptions?.length) return;

    // Prepare notification payload
    const payload = {
      title: 'New Admin Task',
      body: `${task.name} - Due: ${new Date(task.dueDate).toLocaleDateString()}`,
      tag: `admin-task-${task.id}`,
      data: {
        url: '/',
        taskId: task.id,
        type: 'admin-task'
      },
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Task'
        }
      ]
    };

    // Send push notification to each subscription
    const notifications = subscriptions.map(async ({ subscription }) => {
      try {
        const parsedSubscription = JSON.parse(subscription);
        
        // Send notification using the Supabase Edge Function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            subscription: parsedSubscription,
            payload: JSON.stringify(payload)
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send push notification');
        }
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    });

    await Promise.allSettled(notifications);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  try {
    // Convert camelCase to snake_case for database fields
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    // Update task
    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', taskId)
      .select('id, name, category, due_date, description, status, created_at, is_admin_task')
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to update task');
    }
    
    if (!data) {
      throw new Error('Task not found');
    }

    // Map the response to our Task type
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      dueDate: data.due_date,
      description: data.description,
      status: data.status,
      createdAt: data.created_at,
      isAdminTask: data.is_admin_task
    };
  } catch (error: any) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(taskId: string) {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting task:', error);
    throw new Error(error.message || 'Failed to delete task');
  }
}