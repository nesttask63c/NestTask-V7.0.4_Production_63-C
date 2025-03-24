import type { Task } from '../types';

export function mapTaskFromDB(dbTask: any): Task {
  return {
    id: dbTask.id,
    name: dbTask.name,
    category: dbTask.category,
    dueDate: dbTask.due_date,
    description: dbTask.description,
    status: dbTask.status,
    createdAt: dbTask.created_at,
    isAdminTask: dbTask.is_admin_task
  };
}