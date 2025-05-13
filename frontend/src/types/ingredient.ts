import type { UnitOfMeasure } from './unitOfMeasure';

export interface Ingredient {
  id: number;
  name: string;
  description?: string | null;
  stock: number;
  unitOfMeasureId: number;
  unitOfMeasure?: UnitOfMeasure; // Para mostrar info de la unidad
  lowStockThreshold: number;
  costPrice?: number | null;
  isLowStock?: boolean; // Calculado por el backend, opcionalmente
  createdAt: string;
  updatedAt: string;
}

export type CreateIngredientDto = Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt' | 'unitOfMeasure' | 'isLowStock'>;
export type UpdateIngredientDto = Partial<Omit<CreateIngredientDto, 'unitOfMeasureId'>>; // unitOfMeasureId no se actualiza directamente así

export type IngredientFormData = {
  name: string;
  description?: string | null;
  stock: number;
  unitOfMeasureId: number | string; // En el form puede ser string inicialmente
  lowStockThreshold: number;
  costPrice?: number | null;
  // costPrice?: number; // Se añadirá cuando esté disponible
};

export interface AdjustStockDto {
  quantity: number; // Cantidad a sumar o restar
  isAddition: boolean; // true si se suma, false si se resta
} 