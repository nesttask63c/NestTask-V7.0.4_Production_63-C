export interface Course {
  id: string;
  name: string;
  code: string;
  teacher: string;
  teacherId?: string;
  classTimes: ClassTime[];
  telegramGroup?: string;
  blcLink?: string;
  blcEnrollKey?: string;
  credit?: number;
  section?: string;
  createdAt: string;
  createdBy: string;
  _isOffline?: boolean;
  _isOfflineUpdated?: boolean;
  _isOfflineDeleted?: boolean;
}

export interface ClassTime {
  day: string;
  time: string;
  classroom?: string;
}

export type NewCourse = Omit<Course, 'id' | 'createdAt' | 'createdBy'>;

export type StudyMaterialCategory = 
  | 'Task'
  | 'Presentation'
  | 'Assignment'
  | 'Quiz'
  | 'Lab Report'
  | 'Lab Final'
  | 'Lab Performance'
  | 'Documents'
  | 'BLC'
  | 'Groups'
  | 'Others'
  | 'Midterm'
  | 'Final Exam'
  | 'Project'
  | 'Class Slide'
  | 'Slide';

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  courseId: string;
  category: StudyMaterialCategory;
  fileUrls: string[];
  originalFileNames: string[];
  createdAt: string;
  createdBy: string;
  course?: Course;
  _isOffline?: boolean;
  _isOfflineUpdated?: boolean;
  _isOfflineDeleted?: boolean;
}

export type NewStudyMaterial = Omit<StudyMaterial, 'id' | 'createdAt' | 'createdBy' | 'course' | '_isOffline' | '_isOfflineUpdated' | '_isOfflineDeleted'>;