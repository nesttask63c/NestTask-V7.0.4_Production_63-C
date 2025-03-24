export interface RoutineSlot {
  id: string;
  routineId: string;
  courseId?: string;
  teacherId?: string;
  courseName?: string;
  teacherName?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  section?: string;
  createdAt: string;
  
  // Offline tracking properties
  _isOffline?: boolean;
  _isOfflineUpdated?: boolean;
  _isOfflineDeleted?: boolean;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  semester: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
  slots?: RoutineSlot[];
  
  // Offline tracking properties
  _isOffline?: boolean;
  _isOfflineUpdated?: boolean;
  _isOfflineDeleted?: boolean;
}