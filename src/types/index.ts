export type TaskCategory = 'presentation' | 'project' | 'assignment' | 'quiz' | 'lab-report' | 'lab-final' | 'lab-performance' | 'documents' | 'blc' | 'groups' | 'task' | 'others';

export interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  dueDate: string;
  description: string;
  status: 'my-tasks' | 'in-progress' | 'completed';
  createdAt: string;
  isAdminTask: boolean;
}