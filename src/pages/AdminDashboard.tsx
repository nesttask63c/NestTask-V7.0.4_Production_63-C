import { useState } from 'react';
import { UserList } from '../components/admin/UserList';
import { TaskManager } from '../components/admin/TaskManager';
import { SideNavigation } from '../components/admin/navigation/SideNavigation';
import { TaskList } from '../components/TaskList';
import { UserStats } from '../components/admin/UserStats';
import { UserActivity } from '../components/admin/UserActivity';
import { AnnouncementManager } from '../components/admin/announcement/AnnouncementManager';
import { CourseManager } from '../components/admin/course/CourseManager';
import { StudyMaterialManager } from '../components/admin/study-materials/StudyMaterialManager';
import { RoutineManager } from '../components/admin/routine/RoutineManager';
import { TeacherManager } from '../components/admin/teacher/TeacherManager';
import { Dashboard } from '../components/admin/dashboard/Dashboard';
import { UserActiveGraph } from '../components/admin/dashboard/UserActiveGraph';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { useCourses } from '../hooks/useCourses';
import { useRoutines } from '../hooks/useRoutines';
import { useTeachers } from '../hooks/useTeachers';
import { useUsers } from '../hooks/useUsers';
import { showErrorToast } from '../utils/notifications';
import type { User } from '../types/auth';
import type { Task } from '../types/index';
import type { Teacher, NewTeacher } from '../types/teacher';
import type { AdminTab } from '../types/admin';

interface AdminDashboardProps {
  users: User[];
  tasks: Task[];
  onLogout: () => void;
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export function AdminDashboard({
  users = [],
  tasks,
  onLogout,
  onCreateTask,
  onDeleteTask,
  onUpdateTask,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const { 
    announcements,
    createAnnouncement,
    deleteAnnouncement
  } = useAnnouncements();
  
  const {
    courses,
    materials,
    createCourse,
    updateCourse,
    deleteCourse,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    bulkImportCourses
  } = useCourses();

  const {
    routines,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    addRoutineSlot,
    updateRoutineSlot,
    deleteRoutineSlot,
    activateRoutine,
    deactivateRoutine,
    bulkImportSlots
  } = useRoutines();

  const {
    teachers,
    createTeacher,
    updateTeacher,
    deleteTeacher: deleteTeacherService,
    bulkImportTeachers
  } = useTeachers();
  
  const { deleteUser } = useUsers();
  const adminTasks = tasks.filter(task => task.isAdminTask);

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // Enhanced deleteTeacher with better error handling and UI consistency
  const deleteTeacher = async (teacherId: string) => {
    if (!teacherId) {
      console.error('Invalid teacher ID provided for deletion');
      showErrorToast('Invalid teacher ID');
      return Promise.resolve(); // Still resolve to keep UI consistent
    }
    
    try {
      console.log('Attempting to delete teacher:', teacherId);
      await deleteTeacherService(teacherId);
      console.log('Teacher deleted successfully:', teacherId);
      return Promise.resolve();
    } catch (error: any) {
      // Log the error but still resolve the promise
      console.error('Failed to delete teacher:', teacherId, error);
      showErrorToast(`Error deleting teacher: ${error.message || 'Unknown error'}. The UI has been updated but you may need to refresh.`);
      
      // Return resolved promise anyway so UI stays consistent
      return Promise.resolve();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <SideNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
      />
      
      <main className="lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'tasks' && 'Task Management'}
              {activeTab === 'admin-tasks' && 'Admin Tasks'}
              {activeTab === 'announcements' && 'Announcements'}
              {activeTab === 'teachers' && 'Teacher Management'}
              {activeTab === 'courses' && 'Course Management'}
              {activeTab === 'study-materials' && 'Study Materials'}
              {activeTab === 'routine' && 'Routine Management'}
            </h1>
          </div>

          {activeTab === 'dashboard' && (
            <Dashboard users={users} tasks={tasks} />
          )}

          {activeTab === 'users' && (
            <>
              <UserStats users={users} tasks={tasks} />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                  <UserActiveGraph users={users} />
                </div>
                <div className="lg:col-span-1">
                  <UserActivity users={users} />
                </div>
              </div>
              
              <UserList users={users} onDeleteUser={handleDeleteUser} />
            </>
          )}
          
          {activeTab === 'tasks' && (
            <TaskManager
              tasks={tasks}
              onCreateTask={onCreateTask}
              onDeleteTask={onDeleteTask}
              onUpdateTask={onUpdateTask}
            />
          )}

          {activeTab === 'admin-tasks' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Admin Tasks</h2>
              <TaskList 
                tasks={adminTasks} 
                onDeleteTask={onDeleteTask}
                showDeleteButton={true}
              />
            </div>
          )}

          {activeTab === 'announcements' && (
            <AnnouncementManager
              announcements={announcements}
              onCreateAnnouncement={createAnnouncement}
              onDeleteAnnouncement={deleteAnnouncement}
            />
          )}

          {activeTab === 'teachers' && (
            <TeacherManager
              teachers={teachers}
              courses={courses}
              onCreateTeacher={createTeacher as (teacher: NewTeacher, courseIds: string[]) => Promise<Teacher | undefined>}
              onUpdateTeacher={updateTeacher as (id: string, updates: Partial<Teacher>, courseIds: string[]) => Promise<Teacher | undefined>}
              onDeleteTeacher={deleteTeacher}
              onBulkImportTeachers={bulkImportTeachers}
            />
          )}

          {activeTab === 'courses' && (
            <CourseManager
              courses={courses}
              teachers={teachers}
              onCreateCourse={createCourse}
              onUpdateCourse={updateCourse}
              onDeleteCourse={deleteCourse}
              onBulkImportCourses={bulkImportCourses}
            />
          )}

          {activeTab === 'study-materials' && (
            <StudyMaterialManager
              courses={courses}
              materials={materials}
              onCreateMaterial={createMaterial}
              onDeleteMaterial={deleteMaterial}
            />
          )}

          {activeTab === 'routine' && (
            <RoutineManager
              routines={routines}
              courses={courses}
              teachers={teachers}
              onCreateRoutine={createRoutine}
              onUpdateRoutine={updateRoutine}
              onDeleteRoutine={deleteRoutine}
              onAddSlot={addRoutineSlot}
              onUpdateSlot={updateRoutineSlot}
              onDeleteSlot={deleteRoutineSlot}
              onActivateRoutine={activateRoutine}
              onDeactivateRoutine={deactivateRoutine}
              onBulkImportSlots={bulkImportSlots}
            />
          )}
        </div>
      </main>
    </div>
  );
}