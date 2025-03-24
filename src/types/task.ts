export type TaskCategory = 
  | 'presentation' 
  | 'assignment' 
  | 'quiz' 
  | 'lab-report' 
  | 'lab-final' 
  | 'lab-performance'
  | 'task' 
  | 'documents'
  | 'blc'
  | 'groups'
  | 'project'
  | 'midterm'
  | 'final-exam'
  | 'others' 
  | 'all';

export type TaskStatus = 'my-tasks' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  dueDate: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  isAdminTask: boolean;
}

export type NewTask = Omit<Task, 'id' | 'createdAt' | 'isAdminTask'>;