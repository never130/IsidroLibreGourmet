import axios from 'axios';
import type { Order } from '../types/order'; // Supondremos que existe o crearemos un tipo Order básico
import type { CreateOrderDto } from '../types/order.dto'; // Supondremos que existe o crearemos DTOs básicos

const API_URL = '/api/orders';

// Definir un tipo para los filtros opcionales
interface GetOrdersFilters {
  statuses?: string[]; // Array de estados, ej: ['pending', 'in_progress']
  // Otros filtros podrían añadirse aquí en el futuro (ej: dateRange, customerId, etc.)
}

export const orderService = {
  // Crear un nuevo pedido
  createOrder: async (orderData: CreateOrderDto): Promise<Order> => {
    const response = await axios.post<Order>(API_URL, orderData);
    return response.data;
  },

  // Obtener un pedido por ID
  getOrderById: async (id: number): Promise<Order> => {
    const response = await axios.get<Order>(`${API_URL}/${id}`);
    return response.data;
  },

  // Obtener todos los pedidos, ahora con filtros opcionales
  getAllOrders: async (filters?: GetOrdersFilters): Promise<Order[]> => {
    let url = API_URL;
    if (filters && filters.statuses && filters.statuses.length > 0) {
      const statusesQuery = filters.statuses.map(status => `statuses[]=${encodeURIComponent(status)}`).join('&');
      url += `?${statusesQuery}`;
    }
    // Aquí podrían añadirse más lógicas para otros filtros

    const response = await axios.get<Order[]>(url);
    return response.data;
  },

  // Marcar un pedido como completado (y disparar descuento de stock en backend)
  completeOrder: async (id: number): Promise<Order> => {
    const response = await axios.post<Order>(`${API_URL}/${id}/complete`);
    return response.data;
  },

  // Actualizar el estado de un pedido (ej. a 'cancelled', 'in_progress')
  // updateOrderStatus: async (id: number, status: OrderStatus): Promise<Order> => {
  //   const response = await axios.patch<Order>(`${API_URL}/${id}/status`, { status });
  //   return response.data;
  // },
  
  // Podrían añadirse más funciones como cancelar pedido, etc.
};

// Nota: Necesitaremos definir los tipos Order, CreateOrderDto y OrderStatus en el frontend
// en archivos como frontend/src/types/order.ts y frontend/src/types/order.dto.ts
