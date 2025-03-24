import { StudyMaterialForm } from './StudyMaterialForm';
import { StudyMaterialList } from './StudyMaterialList';
import type { Course, StudyMaterial, NewStudyMaterial } from '../../../types/course';

interface StudyMaterialManagerProps {
  courses: Course[];
  materials: StudyMaterial[];
  onCreateMaterial: (material: NewStudyMaterial) => Promise<void>;
  onDeleteMaterial: (id: string) => Promise<void>;
}

export function StudyMaterialManager({
  courses,
  materials,
  onCreateMaterial,
  onDeleteMaterial
}: StudyMaterialManagerProps) {
  return (
    <div>
      <StudyMaterialForm 
        courses={courses}
        onSubmit={onCreateMaterial}
      />
      <StudyMaterialList 
        materials={materials}
        onDelete={onDeleteMaterial}
      />
    </div>
  );
}