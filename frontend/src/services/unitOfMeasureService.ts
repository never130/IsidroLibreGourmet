import axios from 'axios';
import type { UnitOfMeasure, CreateUnitOfMeasureDto, UpdateUnitOfMeasureDto } from '../types/unitOfMeasure';

const API_URL = '/api/units-of-measure'; // Asegúrate que coincida con tu backend

export const unitOfMeasureService = {
  getAll: async (): Promise<UnitOfMeasure[]> => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  getById: async (id: number): Promise<UnitOfMeasure> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateUnitOfMeasureDto): Promise<UnitOfMeasure> => {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  update: async (id: number, data: UpdateUnitOfMeasureDto): Promise<UnitOfMeasure> => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },
}; 