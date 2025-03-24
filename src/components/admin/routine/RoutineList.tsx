import { useState } from 'react';
import { Search, Trash2, Edit2, Plus, Clock, MapPin, Filter, Download, Printer,
  ChevronLeft,
  ChevronRight,
  Users,
  BookOpen,
  GraduationCap,
  Building,
  Check,
  Power,
  PowerOff,
  Eye,
  MoreHorizontal,
  Calendar,
  ListFilter,
  Grid as GridIcon
} from 'lucide-react';
import { RoutineSlotModal } from './RoutineSlotModal';
import type { Routine, RoutineSlot } from '../../../types/routine';
import type { Course } from '../../../types/course';
import type { Teacher } from '../../../types/teacher';

type ViewMode = 'list' | 'grid' | 'compact';
type GroupedRoutines = [string, Routine[]][];

interface RoutineListProps {
  routines: Routine[];
  courses: Course[];
  teachers: Teacher[];
  selectedRoutine: Routine | null;
  onSelectRoutine: (routine: Routine | null) => void;
  onUpdateRoutine: (id: string, updates: Partial<Routine>) => Promise<void>;
  onDeleteRoutine: (id: string) => Promise<void>;
  onAddSlot: (routineId: string, slot: Omit<RoutineSlot, 'id' | 'routineId' | 'createdAt'>) => Promise<RoutineSlot>;
  onUpdateSlot: (routineId: string, slotId: string, updates: Partial<RoutineSlot>) => Promise<void>;
  onDeleteSlot: (routineId: string, slotId: string) => Promise<void>;
  onActivateRoutine: (routineId: string) => Promise<void>;
  onDeactivateRoutine: (routineId: string) => Promise<void>;
}

export function RoutineList({
  routines,
  courses,
  teachers,
  selectedRoutine,
  onSelectRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
  onAddSlot,
  onUpdateSlot,
  onDeleteSlot,
  onActivateRoutine,
  onDeactivateRoutine
}: RoutineListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<RoutineSlot | null>(null);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'semester'>('none');

  const filteredRoutines = routines.filter(routine => {
    return (
    routine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routine.semester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routine.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Group routines by semester if requested
  const groupedRoutines: GroupedRoutines = groupBy === 'semester' 
    ? Object.entries(
        filteredRoutines.reduce<Record<string, Routine[]>>((acc, routine) => {
          const semester = routine.semester || 'Undefined';
          if (!acc[semester]) acc[semester] = [];
          acc[semester].push(routine);
          return acc;
        }, {})
      )
    : [['All', filteredRoutines]];

  const handleAddSlot = () => {
    console.log('Opening slot modal with teachers:', teachers?.length || 0, teachers);
    setSelectedSlot(null);
    setShowSlotModal(true);
  };

  const handleEditSlot = (slot: RoutineSlot) => {
    console.log('Opening edit slot modal with teachers:', teachers?.length || 0, 'Slot teacher ID:', slot?.teacherId);
    setSelectedSlot(slot);
    setShowSlotModal(true);
  };

  const handleActivateRoutine = async (routineId: string) => {
    try {
      setIsActivating(routineId);
      await onActivateRoutine(routineId);
    } finally {
      setIsActivating(null);
    }
  };

  const handleDeactivateRoutine = async (routineId: string) => {
    try {
      setIsDeactivating(routineId);
      await onDeactivateRoutine(routineId);
    } finally {
      setIsDeactivating(null);
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (window.confirm('Are you sure you want to delete this routine? This action cannot be undone.')) {
      await onDeleteRoutine(routineId);
      if (selectedRoutine?.id === routineId) {
        onSelectRoutine(null);
      }
    }
  };

  const toggleExpand = (routineId: string) => {
    setExpandedRoutineId(expandedRoutineId === routineId ? null : routineId);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search routines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="List view"
              >
                <ListFilter className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Grid view"
              >
                <GridIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 ${
                  viewMode === 'compact' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Compact view"
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>
            
            <select 
              className="border dark:border-gray-600 rounded-lg py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'none' | 'semester')}
            >
              <option value="none">No Grouping</option>
              <option value="semester">Group by Semester</option>
            </select>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 dark:bg-blue-800/40 rounded-full mt-0.5">
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Managing Routines</h4>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Only one routine can be active at a time. The active routine will be shown to users.
                Select a routine to view and manage its slots.
                </p>
              </div>
            </div>
          </div>

        {filteredRoutines.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No routines found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm ? 'Try a different search term' : 'Create your first routine to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedRoutines.map(([group, routinesGroup]) => (
              <div key={group}>
                {group !== 'All' && (
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                    {group}
                  </h3>
                )}
                
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {routinesGroup.map((routine) => (
              <div
                key={routine.id}
                className={`
                          bg-white dark:bg-gray-800 rounded-xl shadow-sm border 
                          ${routine.isActive 
                    ? 'border-green-200 dark:border-green-800' 
                            : 'border-gray-200 dark:border-gray-700'
                  }
                          ${selectedRoutine?.id === routine.id ? 'ring-2 ring-blue-500' : ''}
                  hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200
                        `}
                      >
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                      {routine.isActive && (
                                <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {routine.name}
                              </h3>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <div className="flex items-center mb-1">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                              {routine.semester}
                            </div>
                            
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                              {routine.slots?.length || 0} time slots
                            </div>
                          </div>
                          
                          {routine.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                              {routine.description}
                            </p>
                          )}
                          
                          <div className="flex justify-between items-center mt-4 pt-3 border-t dark:border-gray-700">
                            <button
                              onClick={() => onSelectRoutine(routine)}
                              className={`
                                px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5
                                ${selectedRoutine?.id === routine.id
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                              `}
                            >
                              <Eye className="w-4 h-4" />
                              {selectedRoutine?.id === routine.id ? 'Selected' : 'View'}
                            </button>
                            
                            <div className="flex items-center gap-1">
                              {routine.isActive ? (
                                <button
                                  onClick={() => handleDeactivateRoutine(routine.id)}
                                  disabled={isDeactivating === routine.id}
                                  className="p-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                  title="Deactivate this routine"
                                >
                                  <PowerOff className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivateRoutine(routine.id)}
                                  disabled={isActivating === routine.id}
                                  className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                  title="Activate this routine"
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteRoutine(routine.id)}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete this routine"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : viewMode === 'compact' ? (
                  <div className="overflow-hidden border dark:border-gray-700 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Semester
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Slots
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {routinesGroup.map((routine) => (
                          <tr 
                            key={routine.id} 
                            className={`
                              ${selectedRoutine?.id === routine.id 
                                ? 'bg-blue-50 dark:bg-blue-900/10'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                              cursor-pointer transition-colors
                            `}
                            onClick={() => onSelectRoutine(routine)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  {routine.isActive ? (
                                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                      <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {routine.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {routine.semester}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {routine.isActive ? (
                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {routine.slots?.length || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end items-center space-x-2">
                                {routine.isActive ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeactivateRoutine(routine.id);
                                    }}
                                    className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                                  >
                                    <PowerOff className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleActivateRoutine(routine.id);
                                    }}
                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  >
                                    <Power className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRoutine(routine.id);
                                  }}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {routinesGroup.map((routine) => (
                      <div
                        key={routine.id}
                        className={`
                          bg-white dark:bg-gray-800 rounded-xl border 
                          ${routine.isActive 
                            ? 'border-green-200 dark:border-green-800' 
                            : 'border-gray-200 dark:border-gray-700'
                          }
                          ${selectedRoutine?.id === routine.id ? 'ring-2 ring-blue-500' : ''}
                          hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200
                        `}
                      >
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {routine.isActive && (
                                <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                              )}
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {routine.name}
                          {routine.isActive && (
                            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                              Active
                            </span>
                          )}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {routine.isActive ? (
                        <button
                          onClick={() => handleDeactivateRoutine(routine.id)}
                          disabled={isDeactivating === routine.id}
                                  className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                          title="Deactivate this routine"
                        >
                          <PowerOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateRoutine(routine.id)}
                          disabled={isActivating === routine.id}
                                  className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Activate this routine"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onSelectRoutine(routine)}
                                className={`
                                  p-2 rounded-lg transition-colors 
                                  ${selectedRoutine?.id === routine.id
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}
                                `}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                                onClick={() => handleDeleteRoutine(routine.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete this routine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                              <button
                                onClick={() => toggleExpand(routine.id)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                {expandedRoutineId === routine.id ? (
                                  <ChevronRight className="w-4 h-4 transform rotate-90" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                    </div>
                  </div>

                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <div className="flex items-center mb-1">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                              {routine.semester}
                            </div>
                            
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                              {routine.slots?.length || 0} time slots
                            </div>
                          </div>
                          
                          {routine.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {routine.description}
                            </p>
                          )}
                          
                          {expandedRoutineId === routine.id && (
                            <div className="mt-4 border-t dark:border-gray-700 pt-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  Time Slots
                                </h4>
                                {selectedRoutine?.id === routine.id && (
                                  <button
                                    onClick={handleAddSlot}
                                    className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded flex items-center"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Slot
                                  </button>
                                )}
                              </div>
                              
                              {routine.slots && routine.slots.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                      <tr>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                          Day
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                          Time
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                          Course
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                          Room
                                        </th>
                                        {selectedRoutine?.id === routine.id && (
                                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Actions
                                          </th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                      {routine.slots.map((slot) => (
                                        <tr key={slot.id}>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            {slot.dayOfWeek}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            {slot.startTime?.substring(0, 5)} - {slot.endTime?.substring(0, 5)}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            {slot.courseName || 'No course assigned'}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            {slot.roomNumber || 'N/A'}
                                            {slot.section && ` (${slot.section})`}
                                          </td>
                                          {selectedRoutine?.id === routine.id && (
                                            <td className="px-3 py-2 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleEditSlot(slot)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-2"
                            >
                                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteSlot(routine.id, slot.id)}
                                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                                                <Trash2 className="w-4 h-4" />
                            </button>
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                                  No time slots added yet
                                </div>
                              )}
                            </div>
                          )}
                          </div>
                        </div>
                      ))}
                    </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showSlotModal && selectedRoutine && (
        <RoutineSlotModal
          routineId={selectedRoutine.id}
          slot={selectedSlot}
          courses={courses}
          teachers={teachers}
          onClose={() => setShowSlotModal(false)}
          onSubmit={selectedSlot ? onUpdateSlot : onAddSlot}
        />
      )}
    </>
  );
}