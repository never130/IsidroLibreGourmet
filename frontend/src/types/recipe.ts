import type { Ingredient, IngredientUnit } from './ingredient'; // Asumiendo que Ingredient tiene IngredientUnit
import type { Product } from './product'; // Asumiendo que tienes un tipo Product
import type { UnitOfMeasure } from './unitOfMeasure';

/**
 * Representa un ítem (ingrediente) dentro de una receta en el frontend.
 * Consistente con backend/src/entities/RecipeItem.ts (simplificado).
 */
export interface RecipeItem {
  id: number; // El ID del RecipeItem en sí, no del ingrediente
  ingredientId: number;
  ingredient?: Ingredient; // Opcionalmente cargado para mostrar nombre/unidad
  quantity: number; // En la unidad base del ingrediente (g o cm³)
  notes?: string | null;
  // No hay unitOfMeasure aquí, se infiere del ingrediente
}

/**
 * Representa una receta en el frontend.
 * Consistente con backend/src/entities/Recipe.ts.
 */
export interface Recipe {
  id: number;
  productId: number;
  product?: Product; // Opcionalmente cargado
  name?: string | null;
  description?: string | null;
  notes?: string | null;
  estimatedCost?: number | null;
  items: RecipeItem[];
  createdAt: string;
  updatedAt: string;
}

// --- DTOs para el Frontend --- 

/**
 * DTO para un ítem de receta al crear/actualizar desde el frontend.
 * Consistente con backend/src/dtos/recipe-item.dto.ts.
 */
export interface RecipeItemDto {
  ingredientId: number;
  quantity: number;
  notes?: string | null;
}

/**
 * DTO para crear una receta desde el frontend.
 * Consistente con backend/src/dtos/create-recipe.dto.ts.
 */
export interface CreateRecipeDto {
  productId: number;
  name?: string | null;
  description?: string | null;
  notes?: string | null;
  items: RecipeItemDto[];
}

/**
 * DTO para actualizar una receta desde el frontend.
 * Consistente con backend/src/dtos/update-recipe.dto.ts.
 */
export interface UpdateRecipeDto {
  name?: string | null;
  description?: string | null;
  notes?: string | null;
  items?: RecipeItemDto[]; // Si se provee, reemplaza los ítems existentes
}

// Para el formulario de RecipeItem
export type RecipeItemFormData = {
  ingredientId: number | string; // Puede ser string en el form
  quantity: number;
  // unitOfMeasureId: number | string; // No es necesario si se toma del ingrediente directamente o no se permite cambiar
};

// Para el formulario de Recipe completo
export type RecipeFormData = {
  productId?: number | string; // Permitir seleccionar producto
  name?: string; // Nombre de la receta (puede ser opcional si se deriva del producto)
  description?: string | null;
  notes?: string | null;
  items: RecipeItemFormData[];
}; 