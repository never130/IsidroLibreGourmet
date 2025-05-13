import axios from 'axios';
import type { Product } from '../types/product';

const API_URL = '/api/products'; // Asegúrate que coincida con tu backend

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  // Podrías añadir más métodos según se necesiten (getById, create, update, delete)
  // Ejemplo:
  // getById: async (id: number): Promise<Product> => {
  //   const response = await axios.get(`${API_URL}/${id}`);
  //   return response.data;
  // },
}; 