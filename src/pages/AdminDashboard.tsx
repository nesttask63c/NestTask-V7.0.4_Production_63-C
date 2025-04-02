import { useState, useEffect } from 'react';
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
import { isOverdue } from '../utils/dateUtils';
import type { User } from '../types/auth';
import type { Task } from '../types/index';
import type { NewTask } from '../types/task';
import type { Teacher, NewTeacher } from '../types/teacher';
import type { AdminTab } from '../types/admin';

interface AdminDashboardProps {
  users: User[];
  tasks: Task[];
  onLogout: () => void;
  onCreateTask: (task: NewTask) => void;
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  
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
  const dueTasks = tasks.filter(task => isOverdue(task.dueDate) && task.status !== 'completed');

  // Check for mobile view on mount and resize
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleToggleSidebar = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  // Function to handle tab changes
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    
    // If navigating to tasks, show the task form
    if (tab === 'tasks') {
      setShowTaskForm(true);
    } else {
      setShowTaskForm(false);
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
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <SideNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={onLogout}
        onCollapse={handleToggleSidebar}
      />
      
      <main className={`
        flex-1 overflow-y-auto w-full transition-all duration-300
        ${isMobileView ? 'pt-16' : isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
      `}>
        <div className="max-w-full mx-auto p-3 sm:p-5 lg:p-6">
          <header className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'tasks' && 'Task Management'}
                {activeTab === 'due-tasks' && 'Due Tasks'}
                {activeTab === 'announcements' && 'Announcements'}
                {activeTab === 'teachers' && 'Teacher Management'}
                {activeTab === 'courses' && 'Course Management'}
                {activeTab === 'study-materials' && 'Study Materials'}
                {activeTab === 'routine' && 'Routine Management'}
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </header>

          <div className="space-y-4 sm:space-y-6">
            {activeTab === 'dashboard' && (
              <Dashboard users={users} tasks={tasks} />
            )}

            {activeTab === 'users' && (
              <div className="space-y-4 sm:space-y-6">
                <UserStats users={users} tasks={tasks} />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="lg:col-span-2">
                    <UserActiveGraph users={users} />
                  </div>
                  <div>
                    <UserActivity users={users} />
                  </div>
                </div>
                
                <UserList users={users} onDeleteUser={handleDeleteUser} />
              </div>
            )}
            
            {activeTab === 'tasks' && (
              <TaskManager
                tasks={tasks}
                onCreateTask={onCreateTask}
                onDeleteTask={onDeleteTask}
                onUpdateTask={onUpdateTask}
                showTaskForm={showTaskForm}
              />
            )}

            {activeTab === 'due-tasks' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-5 gap-2">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Due Tasks</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Tasks that are overdue and require attention
                    </p>
                  </div>
                  <div className="px-3 py-1.5 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded-lg text-sm font-medium self-start sm:self-center">
                    {dueTasks.length} {dueTasks.length === 1 ? 'task' : 'tasks'} overdue
                  </div>
                </div>
                
                {dueTasks.length === 0 ? (
                  <div className="text-center py-10 sm:py-12">
                    <p className="text-gray-500 dark:text-gray-400">No overdue tasks at the moment</p>
                  </div>
                ) : (
                  <TaskList 
                    tasks={dueTasks} 
                    onDeleteTask={onDeleteTask}
                    showDeleteButton={true}
                  />
                )}
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 overflow-hidden">
                <AnnouncementManager
                  announcements={announcements}
                  onCreateAnnouncement={createAnnouncement}
                  onDeleteAnnouncement={deleteAnnouncement}
                />
              </div>
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
        </div>
      </main>
    </div>
  );
}