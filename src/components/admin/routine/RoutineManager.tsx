import { useState } from 'react';
import { RoutineForm } from './RoutineForm';
import { RoutineList } from './RoutineList';
import { BulkSlotImport } from './BulkSlotImport';
import { Calendar, Plus, Download, Upload, List, Grid, Settings, FileText, Filter } from 'lucide-react';
import type { Routine, RoutineSlot } from '../../../types/routine';
import type { Course } from '../../../types/course';
import type { Teacher } from '../../../types/teacher';

// Define tab types for better organization
type RoutineTab = 'list' | 'create' | 'import' | 'export' | 'settings';

interface RoutineManagerProps {
  routines: Routine[];
  courses: Course[];
  teachers: Teacher[];
  onCreateRoutine: (routine: Omit<Routine, 'id' | 'createdAt'>) => Promise<Routine>;
  onUpdateRoutine: (id: string, updates: Partial<Routine>) => Promise<void>;
  onDeleteRoutine: (id: string) => Promise<void>;
  onAddSlot: (routineId: string, slot: Omit<RoutineSlot, 'id' | 'routineId' | 'createdAt'>) => Promise<RoutineSlot>;
  onUpdateSlot: (routineId: string, slotId: string, updates: Partial<RoutineSlot>) => Promise<void>;
  onDeleteSlot: (routineId: string, slotId: string) => Promise<void>;
  onActivateRoutine: (routineId: string) => Promise<void>;
  onDeactivateRoutine: (routineId: string) => Promise<void>;
  onBulkImportSlots?: (routineId: string, slots: any[]) => Promise<{ success: number; errors: any[] }>;
}

export function RoutineManager({
  routines,
  courses,
  teachers,
  onCreateRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
  onAddSlot,
  onUpdateSlot,
  onDeleteSlot,
  onActivateRoutine,
  onDeactivateRoutine,
  onBulkImportSlots
}: RoutineManagerProps) {
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [activeTab, setActiveTab] = useState<RoutineTab>('list');
  const [filterSemester, setFilterSemester] = useState<string>('');

  // Extract unique semester values for filtering
  const semesters = Array.from(new Set(routines.map(r => r.semester))).sort();

  // Handle export of routine data
  const handleExportRoutine = () => {
    if (!selectedRoutine) return;
    
    // Create export data including slots
    const exportData = {
      ...selectedRoutine,
      slots: selectedRoutine.slots || []
    };
    
    // Convert to JSON and create download link
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = `routine-${selectedRoutine.name.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter routines based on semester
  const filteredRoutines = filterSemester 
    ? routines.filter(r => r.semester === filterSemester)
    : routines;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Routine Management</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create and manage class schedules and time slots
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {semesters.length > 0 && (
            <div className="relative">
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
              >
                <option value="">All Semesters</option>
                {semesters.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border dark:border-gray-700">
        <div className="flex border-b dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <List className="w-4 h-4" />
            Routines
          </button>
          
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
          
          <button
            onClick={() => setActiveTab('import')}
            disabled={!selectedRoutine}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              !selectedRoutine
                ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
                : activeTab === 'import'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Import Slots
          </button>
          
          <button
            onClick={() => setActiveTab('export')}
            disabled={!selectedRoutine}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              !selectedRoutine
                ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
                : activeTab === 'export'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
        
        <div className="p-5">
          {/* Tab content */}
          {activeTab === 'list' && (
            <RoutineList 
              routines={filteredRoutines}
              courses={courses}
              teachers={teachers}
              selectedRoutine={selectedRoutine}
              onSelectRoutine={setSelectedRoutine}
              onUpdateRoutine={onUpdateRoutine}
              onDeleteRoutine={onDeleteRoutine}
              onAddSlot={onAddSlot}
              onUpdateSlot={onUpdateSlot}
              onDeleteSlot={onDeleteSlot}
              onActivateRoutine={onActivateRoutine}
              onDeactivateRoutine={onDeactivateRoutine}
            />
          )}
          
          {activeTab === 'create' && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New Routine</h3>
              <RoutineForm onSubmit={onCreateRoutine} />
            </div>
          )}
          
          {activeTab === 'import' && selectedRoutine && onBulkImportSlots && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Import Slots for {selectedRoutine.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Semester: {selectedRoutine.semester}
                </p>
              </div>
              <BulkSlotImport 
                routineId={selectedRoutine.id}
                teachers={teachers}
                courses={courses}
                onImportSlots={onBulkImportSlots}
              />
            </div>
          )}
          
          {activeTab === 'export' && selectedRoutine && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Export Routine</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Export the selected routine with all its time slots
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border dark:border-gray-700">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">
                      {selectedRoutine.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {selectedRoutine.semester}
                      {selectedRoutine.isActive && (
                        <span className="ml-2 inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                          Active
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Contains {selectedRoutine.slots?.length || 0} time slots
                    </p>
                    
                    <button
                      onClick={handleExportRoutine}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export as JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Routine Settings</h3>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300 mb-4">
                <p>Settings options will be available in future updates.</p>
              </div>
              
              {/* Example settings options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Show Inactive Routines</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Display routines that are not currently active</p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      id="toggleInactive" 
                      className="sr-only"
                      checked={true}
                      readOnly
                    />
                    <label 
                      htmlFor="toggleInactive" 
                      className="block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-700 cursor-pointer"
                    >
                      <span className={`block h-6 w-6 rounded-full bg-white transform translate-x-4 transition-transform`}></span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Default View Mode</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Choose the default view for routines</p>
                  </div>
                  <select 
                    className="border dark:border-gray-600 rounded-lg py-1.5 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    defaultValue="list"
                  >
                    <option value="list">List View</option>
                    <option value="grid">Grid View</option>
                    <option value="calendar">Calendar View</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}