import axios from 'axios';
import type { Ingredient, CreateIngredientDto, UpdateIngredientDto, AdjustStockDto } from '../types/ingredient';

const API_URL = '/api/ingredients'; // Asegúrate que coincida con tu backend

export const ingredientService = {
  getAll: async (): Promise<Ingredient[]> => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  getById: async (id: number): Promise<Ingredient> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateIngredientDto): Promise<Ingredient> => {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  update: async (id: number, data: UpdateIngredientDto): Promise<Ingredient> => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },

  adjustStock: async (id: number, quantity: number, isAddition: boolean): Promise<Ingredient> => {
    const payload: AdjustStockDto = { quantity, isAddition };
    const response = await axios.patch(`${API_URL}/${id}/adjust-stock`, payload);
    return response.data;
  },

  getLowStock: async (): Promise<Ingredient[]> => {
    const response = await axios.get(`${API_URL}/low-stock`);
    return response.data;
  }
}; 