import { useState, useEffect, useCallback } from 'react';
import { useCourses } from '../hooks/useCourses';
import { StudyMaterialsGrid } from '../components/study-materials/StudyMaterialsGrid';
import { LoadingScreen } from '../components/LoadingScreen';
import { Book, Search, Filter, FileText } from 'lucide-react';
import type { Course, StudyMaterialCategory } from '../types/course';

export function StudyMaterialsPage() {
  const { courses, materials, loading } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<StudyMaterialCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMaterials, setFilteredMaterials] = useState(materials || []);

  // Update filtered materials whenever dependencies change
  useEffect(() => {
    if (!materials) return;

    const filtered = materials.filter(material => {
      // First check if material matches the selected course
      if (selectedCourse) {
        if (material.courseid !== selectedCourse.id) {
          return false;
        }
      }

      // Then check other filters
      const matchesSearch = searchTerm === '' || 
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    setFilteredMaterials(filtered);
  }, [materials, selectedCourse, selectedCategory, searchTerm]);

  // Handle course change
  const handleCourseChange = useCallback((courseId: string) => {
    if (!courseId) {
      setSelectedCourse(null);
    } else {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        setSelectedCourse(course);
        // Reset filters when selecting a course
        setSelectedCategory('all');
        setSearchTerm('');
      }
    }
  }, [courses]);

  // Handle course click from header
  const handleCourseClick = useCallback((course: Course) => {
    setSelectedCourse(course);
    setSelectedCategory('all');
    setSearchTerm('');
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const categories: (StudyMaterialCategory | 'all')[] = [
    'all',
    'Task',
    'Presentation',
    'Assignment',
    'Quiz',
    'Lab Report',
    'Lab Final',
    'Lab Performance',
    'Documents',
    'BLC',
    'Groups',
    'Others',
    'Midterm',
    'Final Exam',
    'Project',
    'Class Slide',
    'Slide'
  ];

  // Get course-specific counts
  const totalMaterialsForCourse = selectedCourse 
    ? materials?.filter(m => m.courseid === selectedCourse.id).length 
    : materials?.length || 0;

  // Sort courses by code for better organization
  const sortedCourses = [...courses].sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            {selectedCourse ? (
              <button 
                onClick={() => setSelectedCourse(null)}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Study Materials
              </button>
            ) : (
              'Study Materials'
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <span>
              {filteredMaterials.length} of {totalMaterialsForCourse} materials
              {selectedCourse ? ` in ${selectedCourse.code}` : ' available'}
            </span>
            {selectedCourse && (
              <button 
                onClick={() => setSelectedCourse(null)}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Show all materials
              </button>
            )}
          </p>
        </div>

        {/* Course Filter & Search */}
        <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-2xl">
            {/* Course Filter */}
            <div className="relative w-full sm:w-1/2 lg:w-64">
              <select
                value={selectedCourse?.id || ''}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none cursor-pointer text-sm"
              >
                <option value="">All Courses</option>
                {sortedCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
              <Book className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Category Filter */}
            <div className="relative w-full sm:w-1/2 lg:w-56">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as StudyMaterialCategory | 'all')}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none cursor-pointer text-sm"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-full lg:w-64">
              <input
                type="text"
                placeholder={`Search ${selectedCourse ? selectedCourse.code : ''} materials...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Course Navigation (if course is selected) */}
      {selectedCourse && (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm">
            <button 
              onClick={() => setSelectedCourse(null)}
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Study Materials
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {selectedCourse.code} - {selectedCourse.name}
            </span>
          </div>
        </div>
      )}

      {/* Materials Grid */}
      <StudyMaterialsGrid materials={filteredMaterials} />
    </div>
  );
}