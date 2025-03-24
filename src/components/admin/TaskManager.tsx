import { TaskForm } from './task/TaskForm';
import { TaskTable } from './task/TaskTable';
import type { Task } from '../../types';

interface TaskManagerProps {
  tasks: Task[];
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export function TaskManager({ tasks, onCreateTask, onDeleteTask, onUpdateTask }: TaskManagerProps) {
  return (
    <div className="space-y-8">
      <TaskForm onSubmit={onCreateTask} />
      <TaskTable 
        tasks={tasks}
        onDeleteTask={onDeleteTask}
        onUpdateTask={onUpdateTask}
      />
    </div>
  );
}