import type { Recipe } from './recipe';

export enum ProductCategory {
  BEBIDAS = 'Bebidas',
  PLATOS_FUERTES = 'Platos Fuertes',
  ENTRADAS = 'Entradas',
  POSTRES = 'Postres',
  SNACKS = 'Snacks',
  OTROS = 'Otros',
  // Comentados los valores anteriores para referencia:
  // FOOD = 'FOOD',
  // DRINK = 'DRINK',
  // SNACK = 'SNACK',
  // OTHER = 'OTHER'
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  category: ProductCategory;
  cost: number | null;
  imageUrl?: string | null;
  manageStock: boolean;
  recipeId?: string | null;
  recipe?: Partial<Recipe> | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateProductDto = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'recipe'>;
export type UpdateProductDto = Partial<CreateProductDto>;

export type ProductFormData = {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  category: ProductCategory;
  cost: number;
  imageUrl?: string | null;
  manageStock: boolean;
  recipeId?: string | null;
};

// Opcional: si quieres tipos específicos para lo que envías, aunque los DTOs del backend son la guía.
// export type CreateProductPayload = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
// export type UpdateProductPayload = Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id: number }>; 