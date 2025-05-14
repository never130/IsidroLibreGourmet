import axios from 'axios';
import type { Recipe, CreateRecipeDto, UpdateRecipeDto } from '../types/recipe';

const API_URL = '/api/recipes'; // Asegúrate que coincida con tu backend

export const recipeService = {
  getAll: async (productId?: number): Promise<Recipe[]> => {
    const params = productId ? { productId } : {};
    const response = await axios.get(API_URL, { params });
    return response.data;
  },

  getById: async (id: number): Promise<Recipe> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateRecipeDto): Promise<Recipe> => {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  update: async (id: number, data: UpdateRecipeDto): Promise<Recipe> => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },

  // Si se necesita obtener recetas por producto directamente
  getByProductId: async (productId: number): Promise<Recipe | null> => {
    try {
      const response = await axios.get(`${API_URL}/product/${productId}`);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
        return null; // No encontrada, lo cual es un caso válido
      }
      throw error; // Re-lanzar otros errores
    }
  }
}; 