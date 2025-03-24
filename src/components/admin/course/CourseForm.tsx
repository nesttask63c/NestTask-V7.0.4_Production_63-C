import { useState } from 'react';
import { 
  Book, 
  Code, 
  User, 
  GitBranch as BrandTelegram, 
  Plus, 
  Lock, 
  Link,
  GraduationCap,
  Hash,
  CreditCard
} from 'lucide-react';
import type { NewCourse } from '../../../types/course';
import type { Teacher } from '../../../types/teacher';
import type { Course } from '../../../types/course';

interface CourseFormProps {
  onSubmit: (course: NewCourse) => Promise<Course | void>;
  teachers: Teacher[];
}

export function CourseForm({ onSubmit, teachers }: CourseFormProps) {
  const [course, setCourse] = useState<NewCourse>({
    name: '',
    code: '',
    teacher: '',
    classTimes: [],
    telegramGroup: '',
    blcLink: '',
    blcEnrollKey: '',
    teacherId: undefined,
    credit: undefined,
    section: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // If a teacher is selected, use their name as the teacher field
      const selectedTeacher = teachers.find(t => t.id === course.teacherId);
      await onSubmit({
        ...course,
        teacher: selectedTeacher ? selectedTeacher.name : course.teacher
      });
      setCourse({
        name: '',
        code: '',
        teacher: '',
        classTimes: [],
        telegramGroup: '',
        blcLink: '',
        blcEnrollKey: '',
        teacherId: undefined,
        credit: undefined,
        section: ''
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Course</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create a new course for students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Course Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={course.name}
              onChange={(e) => setCourse(prev => ({ ...prev, name: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <Book className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Course Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Course Code
          </label>
          <div className="relative">
            <input
              type="text"
              value={course.code}
              onChange={(e) => setCourse(prev => ({ ...prev, code: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Credit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Credit
          </label>
          <div className="relative">
            <input
              type="number"
              value={course.credit || ''}
              onChange={(e) => setCourse(prev => ({ ...prev, credit: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Section
          </label>
          <div className="relative">
            <input
              type="text"
              value={course.section || ''}
              onChange={(e) => setCourse(prev => ({ ...prev, section: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Teacher Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Teacher
          </label>
          <div className="relative">
            <select
              value={course.teacherId || ''}
              onChange={(e) => {
                const teacherId = e.target.value;
                setCourse(prev => ({
                  ...prev,
                  teacherId: teacherId || undefined,
                  teacher: teacherId ? '' : prev.teacher // Clear manual teacher name if a teacher is selected
                }));
              }}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
            >
              <option value="">Select a teacher</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} {teacher.department ? `(${teacher.department})` : ''}
                </option>
              ))}
              <option value="other">Other (Enter manually)</option>
            </select>
            <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Manual Teacher Input (shown only when "Other" is selected) */}
        {course.teacherId === 'other' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Teacher Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={course.teacher}
                onChange={(e) => setCourse(prev => ({ ...prev, teacher: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        )}

        {/* BLC Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            BLC Link (Optional)
          </label>
          <div className="relative">
            <input
              type="url"
              value={course.blcLink}
              onChange={(e) => setCourse(prev => ({ ...prev, blcLink: e.target.value }))}
              placeholder="Enter BLC course link"
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* BLC Enroll Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            BLC Enroll Key (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              value={course.blcEnrollKey}
              onChange={(e) => setCourse(prev => ({ ...prev, blcEnrollKey: e.target.value }))}
              placeholder="Enter BLC enroll key"
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Telegram Group */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Telegram Group (Optional)
          </label>
          <div className="relative">
            <input
              type="url"
              value={course.telegramGroup || ''}
              onChange={(e) => setCourse(prev => ({ ...prev, telegramGroup: e.target.value }))}
              placeholder="https://t.me/your-group"
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <BrandTelegram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-full mt-6 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white
          ${isSubmitting 
            ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }
          transition-colors duration-200 shadow-sm hover:shadow-md
        `}
      >
        <Plus className="w-5 h-5" />
        {isSubmitting ? 'Creating Course...' : 'Create Course'}
      </button>
    </form>
  );
}