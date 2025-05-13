export interface UnitOfMeasure {
  id: number;
  name: string;
  abbreviation: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateUnitOfMeasureDto = Omit<UnitOfMeasure, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUnitOfMeasureDto = Partial<CreateUnitOfMeasureDto>;

// Para formularios, podría ser útil tener un tipo específico
export type UnitOfMeasureFormData = {
  name: string;
  abbreviation: string;
}; 