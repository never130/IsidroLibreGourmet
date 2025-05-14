import type { UnitOfMeasure } from './unitOfMeasure';

/**
 * Enum para las unidades de medida de los ingredientes.
 * Debe ser consistente con el enum del backend: backend/src/enums/ingredient-unit.enum.ts
 */
export enum IngredientUnit {
  GRAMS = 'g',
  CUBIC_CENTIMETERS = 'cm³'
}

/**
 * Interfaz para representar un ingrediente.
 * Debe ser consistente con la entidad del backend: backend/src/entities/Ingredient.ts
 */
export interface Ingredient {
  id: number;
  name: string;
  description?: string | null;
  unitOfMeasure: IngredientUnit;
  stockQuantity: number; // Asegurar consistencia con el backend
  costPrice?: number | null;
  lowStockThreshold?: number | null;
  supplier?: string | null;
  createdAt: string; 
  updatedAt: string; 
  isLowStock?: boolean; 
}

/**
 * DTO para crear un ingrediente.
 * Consistente con backend/src/dtos/create-ingredient.dto.ts
 */
export interface CreateIngredientDto {
  name: string;
  unitOfMeasure: IngredientUnit; // Debe ser del tipo IngredientUnit
  stockQuantity: number; // Nombre y tipo consistentes con el backend
  // Campos opcionales que podrían estar en tu entidad Ingredient y que quieras incluir al crear
  description?: string | null;
  costPrice?: number | null;
  lowStockThreshold?: number | null;
  supplier?: string | null;
}

/**
 * DTO para actualizar un ingrediente.
 * Consistente con backend/src/dtos/update-ingredient.dto.ts
 */
export interface UpdateIngredientDto { // Todos los campos opcionales para la actualización
  name?: string;
  unitOfMeasure?: IngredientUnit;
  stockQuantity?: number;
  description?: string | null;
  costPrice?: number | null;
  lowStockThreshold?: number | null;
  supplier?: string | null;
}

/**
 * DTO para ajustar el stock (usado por ingredientService.ts existente).
 */
export interface AdjustStockDto {
    quantity: number;
    isAddition: boolean; 
}

// Si tienes un formulario de ingredientes, podrías tener un tipo específico para él, 
// que podría ser ligeramente diferente al DTO si necesitas manejar campos de forma distinta en la UI.
// Por ejemplo:
// export type IngredientFormData = Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt' | 'isLowStock'> & {
//   // Campos adicionales o diferentes para el formulario si es necesario
// }; 