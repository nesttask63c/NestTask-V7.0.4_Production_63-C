import { useState } from 'react';
import { 
  Home, Calendar, Bell, Search, X, Settings, Users, LogOut,
  User, ChevronRight, BarChart2, CheckCircle2, Clock, AlertCircle,
  HelpCircle, Share2, Download, Star, Book, FileText, File, Notebook,
  GraduationCap, ShieldCheck, FolderPlus, BookPlus, BookOpen, CalendarDays
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { NavPage } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { StudyMaterialsModal } from '../study-materials/StudyMaterialsModal';
import { useCourses } from '../../hooks/useCourses';

interface SlidingNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: NavPage;
  onPageChange: (page: NavPage) => void;
  onLogout: () => void;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  taskStats: {
    total: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

export function SlidingNavigation({ 
  isOpen, 
  onClose, 
  activePage, 
  onPageChange,
  onLogout,
  user,
  taskStats
}: SlidingNavigationProps) {
  const { isDark, toggle } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showStudyMaterials, setShowStudyMaterials] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const { materials } = useCourses();

  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'upcoming' as const, label: 'Upcoming', icon: Calendar },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'search' as const, label: 'Search', icon: Search },
    { id: 'study-materials' as const, label: 'Study Materials', icon: BookOpen },
    { id: 'courses' as const, label: 'Courses', icon: GraduationCap },
    { id: 'routine' as const, label: 'Routine', icon: CalendarDays },
    { 
      id: 'admin' as const,
      icon: ShieldCheck,
      label: 'Admin Dashboard',
      hasSubmenu: true,
      adminOnly: true,
      submenuItems: [
        { icon: FolderPlus, label: 'Manage Study Materials' },
        { icon: BookPlus, label: 'Manage Courses' }
      ]
    }
  ];

  const handleStudyMaterialClick = (category: string) => {
    setSelectedCategory(category);
    setShowMaterialsModal(true);
    setShowStudyMaterials(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
              onClick={onClose}
            />

            {/* Sliding Panel */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 h-[100dvh] w-[85vw] sm:w-[320px] max-w-[320px] bg-white dark:bg-gray-900 shadow-2xl z-[101] flex flex-col overflow-hidden"
            >
              {/* Header with User Profile */}
              <div className="flex-shrink-0 p-4 sm:p-5 bg-gradient-to-br from-blue-600 to-indigo-600">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white/80 shadow-lg" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-white truncate">{user.name}</h2>
                      <p className="text-xs text-blue-100/80 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Task Counter */}
                <div className="mt-4 p-3 bg-gradient-to-br from-white/10 to-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <p className="text-sm text-blue-100/80">Total Tasks</p>
                      <p className="text-2xl font-bold">{taskStats.total}</p>
                    </div>
                    <button 
                      onClick={() => setShowStats(!showStats)}
                      className={`
                        p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-white/20
                        ${showStats ? 'bg-white/20' : 'hover:bg-white/10'}
                      `}
                    >
                      <BarChart2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content Scroll Area */}
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                {/* Stats Section */}
                <AnimatePresence>
                  {showStats && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-b border-gray-100 dark:border-gray-800"
                    >
                      <div className="p-4 grid grid-cols-3 gap-3">
                        {[
                          { icon: CheckCircle2, label: 'Completed', value: taskStats.completed, color: 'text-green-500' },
                          { icon: Clock, label: 'In Progress', value: taskStats.inProgress, color: 'text-blue-500' },
                          { icon: AlertCircle, label: 'Overdue', value: taskStats.overdue, color: 'text-red-500' }
                        ].map((stat) => (
                          <div 
                            key={stat.label} 
                            className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                          >
                            <div className="flex justify-center mb-1">
                              <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                              {stat.value}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {stat.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Items */}
                <nav className="flex-1 px-2 py-3">
                  <ul className="space-y-1">
                    {navItems
                      .filter(item => !item.adminOnly || user.email === 'admin@example.com')
                      .map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            if (item.hasSubmenu) {
                              if (item.id === 'study') {
                                setShowStudyMaterials(!showStudyMaterials);
                              } else if (item.id === 'admin') {
                                setShowAdminMenu(!showAdminMenu);
                              }
                            } else {
                              onPageChange(item.id);
                              onClose();
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            activePage === item.id
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{item.label}</span>
                          {item.hasSubmenu && (
                            <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${
                              (item.id === 'study' && showStudyMaterials) || 
                              (item.id === 'admin' && showAdminMenu) ? 'rotate-90' : ''
                            }`} />
                          )}
                        </button>
                        
                        {/* Submenu for Study Materials and Admin */}
                        {item.hasSubmenu && ((item.id === 'study' && showStudyMaterials) || 
                                           (item.id === 'admin' && showAdminMenu)) && (
                          <ul className="mt-1 ml-4 space-y-1">
                            {item.submenuItems?.map((subItem, index) => (
                              <li key={index}>
                                <button
                                  onClick={() => {
                                    if (item.id === 'study') {
                                      handleStudyMaterialClick(subItem.label);
                                    } else if (item.id === 'admin') {
                                      onPageChange('admin');
                                      onClose();
                                    }
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <subItem.icon className="w-4 h-4" />
                                  <span className="text-sm">{subItem.label}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {/* Bottom Section */}
              <div className="flex-shrink-0 p-3 bg-gray-50/80 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 backdrop-blur-sm">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Share2 className="w-5 h-5 text-blue-500 mb-1.5" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Share App</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Star className="w-5 h-5 text-yellow-500 mb-1.5" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Rate Us</span>
                  </motion.button>
                </div>

                {/* Settings & Version */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Version 1.0.0</span>
                    <button className="p-1 hover:text-blue-500 transition-colors">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggle}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5" />
                      <span className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </motion.button>

                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onLogout}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm font-medium">Logout</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Study Materials Modal */}
      <StudyMaterialsModal
        isOpen={showMaterialsModal}
        onClose={() => setShowMaterialsModal(false)}
        category={selectedCategory}
        materials={materials?.filter(m => 
          m.category.toLowerCase() === selectedCategory.toLowerCase()
        )}
      />
    </>
  );
}