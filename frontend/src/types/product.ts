export enum ProductCategory {
  FOOD = 'FOOD',
  DRINK = 'DRINK',
  SNACK = 'SNACK',
  OTHER = 'OTHER'
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
  createdAt: string;
  updatedAt: string;
}

export type CreateProductDto = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
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
};

// Opcional: si quieres tipos específicos para lo que envías, aunque los DTOs del backend son la guía.
// export type CreateProductPayload = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
// export type UpdateProductPayload = Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id: number }>; 