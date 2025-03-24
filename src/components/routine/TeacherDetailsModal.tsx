import { X, Mail, Phone, Building, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Teacher } from '../../types/teacher';

interface TeacherDetailsModalProps {
  teacher: Teacher;
  onClose: () => void;
}

export function TeacherDetailsModal({ teacher, onClose }: TeacherDetailsModalProps) {
  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="fixed inset-x-4 top-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-600">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="relative px-6 pb-6">
          <div className="absolute -top-16 left-6 w-32 h-32 rounded-2xl bg-white dark:bg-gray-700 shadow-lg flex items-center justify-center">
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {teacher.name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="pt-20">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {teacher.name}
            </h2>
            {teacher.department && (
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {teacher.department}
              </p>
            )}

            {/* Contact Information */}
            <div className="space-y-4 mb-8">
              {teacher.email && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <a 
                    href={`mailto:${teacher.email}`}
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {teacher.email}
                  </a>
                </div>
              )}

              {teacher.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <a 
                    href={`tel:${teacher.phone}`}
                    className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  >
                    {teacher.phone}
                  </a>
                </div>
              )}

              {teacher.department && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {teacher.department}
                  </span>
                </div>
              )}
            </div>

            {/* Courses */}
            {teacher.courses && teacher.courses.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Courses
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teacher.courses.map(course => (
                    <div 
                      key={course.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {course.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {course.code}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}