import { useState } from 'react';
import { Book, Calendar, User, GitBranch as BrandTelegram, Link, Lock, Search, ExternalLink, MapPin } from 'lucide-react';
import { useCourses } from '../hooks/useCourses';
import type { Course } from '../types/course';

export function CoursePage() {
  const { courses, loading } = useCourses();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {searchTerm ? 'No courses match your search' : 'No courses available'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {searchTerm ? 'Try a different search term' : 'Check back later for updates'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative p-6 space-y-4">
                {/* Course Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course.name}
                    </h2>
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                      {course.code}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{course.teacher}</span>
                  </div>
                </div>

                {/* Class Times */}
                <div className="space-y-2">
                  {course.classTimes.map((time, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2"
                    >
                      <Calendar className="w-4 h-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                      <span className="text-sm">{time.day} at {time.time}</span>
                      {time.classroom && (
                        <div className="flex items-center gap-1 ml-2 text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{time.classroom}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Course Links */}
                <div className="pt-4 space-y-2 border-t border-gray-100 dark:border-gray-700">
                  {course.blcLink && (
                    <a
                      href={course.blcLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group"
                    >
                      <Link className="w-4 h-4 transition-transform group-hover:-rotate-12" />
                      <span className="flex-grow">BLC Course</span>
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}

                  {course.blcEnrollKey && (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <Lock className="w-4 h-4" />
                      <span>Enroll Key: {course.blcEnrollKey}</span>
                    </div>
                  )}

                  {course.telegramGroup && (
                    <a
                      href={course.telegramGroup}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group"
                    >
                      <BrandTelegram className="w-4 h-4 transition-transform group-hover:-rotate-12" />
                      <span className="flex-grow">Join Telegram Group</span>
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}