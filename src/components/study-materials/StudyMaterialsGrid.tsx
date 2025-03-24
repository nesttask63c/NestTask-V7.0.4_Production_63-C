import { useState } from 'react';
import { Book } from 'lucide-react';
import { StudyMaterialCard } from './StudyMaterialCard';
import { StudyMaterialDetailsModal } from './StudyMaterialDetailsModal';
import type { StudyMaterial } from '../../types/course';

interface StudyMaterialsGridProps {
  materials: StudyMaterial[];
}

export function StudyMaterialsGrid({ materials }: StudyMaterialsGridProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);

  return (
    <div className="space-y-6">
      {/* Materials Grid */}
      {materials.length === 0 ? (
        <div className="text-center py-12">
          <Book className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No study materials found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <StudyMaterialCard
              key={material.id}
              material={material}
              onClick={() => setSelectedMaterial(material)}
            />
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedMaterial && (
        <StudyMaterialDetailsModal
          material={selectedMaterial}
          isOpen={!!selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
        />
      )}
    </div>
  );
}