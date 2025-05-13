import type { Ingredient } from './ingredient';
import type { Product } from './product'; // Para la relación con Product
import type { UnitOfMeasure } from './unitOfMeasure';

export interface RecipeItem {
  id?: string; // ID del RecipeItem, si existe (podría ser uuid si se persiste individualmente)
  recipeId?: string; // ID de la Receta a la que pertenece (string)
  ingredientId: number; // ID del Ingrediente (number)
  ingredient?: Ingredient;
  quantity: number;
  unitOfMeasureId: number; // Asumo que esta es la ID de la unidad del ingrediente en la receta
  unitOfMeasure?: UnitOfMeasure;
  cost?: number; // Costo de este item en la receta
}

export interface Recipe {
  id: string; // CAMBIADO a string (UUID)
  productId: number; // ID del Producto al que esta receta puede pertenecer (number)
  product?: Partial<Product>;
  name: string; // El backend no tiene 'name' en Recipe, usa el del Producto. Considerar si el frontend lo necesita.
  description?: string | null;
  notes?: string | null;
  items: RecipeItem[];
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
}

// Para el formulario de RecipeItem
export type RecipeItemFormData = {
  ingredientId: number | string; // Puede ser string en el form
  quantity: number;
  // unitOfMeasureId: number | string; // No es necesario si se toma del ingrediente directamente o no se permite cambiar
};

export type CreateRecipeDto = {
  productId: number;
  // name: string; // Se tomará del producto o se definirá en el backend si es necesario
  description?: string | null;
  notes?: string | null;
  items: Array<Omit<RecipeItemFormData, 'unitOfMeasureId'>>; // Ajustado para DTO del backend
};

// Si Recipe.id es string, UpdateRecipeDto debe reflejarlo para el servicio que espera { id: string, data: ... }
export type UpdateRecipeDto = Partial<Omit<CreateRecipeDto, 'productId'>> & { items?: Array<Omit<RecipeItemFormData, 'unitOfMeasureId'>> };

// Para el formulario de Recipe completo
export type RecipeFormData = {
  productId?: number | string; // Permitir seleccionar producto
  name?: string; // Nombre de la receta (puede ser opcional si se deriva del producto)
  description?: string | null;
  notes?: string | null;
  items: RecipeItemFormData[];
}; 