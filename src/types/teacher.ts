import { Course } from './course';

export interface Teacher {
  id: string;
  name: string;
  email?: string;
  phone: string;
  department?: string;
  officeRoom?: string;
  createdAt: string;
  createdBy: string;
  courses?: Course[];
  _isOffline?: boolean;
  _isOfflineUpdated?: boolean;
  _isOfflineDeleted?: boolean;
}

export type NewTeacher = Omit<Teacher, 'id' | 'createdAt' | 'createdBy' | 'courses' | '_isOffline' | '_isOfflineUpdated' | '_isOfflineDeleted'>;

export interface TeacherCourse {
  teacherId: string;
  courseId: string;
  createdAt: string;
}