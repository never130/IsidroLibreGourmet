import type { OrderType, PaymentMethod } from './order';

export interface CreateOrderItemDto {
  productId: number;
  quantity: number;
  // El precio se tomará del producto en el backend al momento de crear el pedido,
  // o se puede enviar desde el frontend si se permite modificarlo.
  // price?: number; 
}

export interface CreateOrderDto {
  type: OrderType;
  customerName: string;
  customerPhone?: string | null;
  address?: string | null;
  notes?: string | null;
  paymentMethod: PaymentMethod;
  items: CreateOrderItemDto[];
  createdById: number; // El ID del usuario que crea el pedido (se obtiene del contexto de autenticación)
  // El total se calculará en el backend.
}

// Podríamos necesitar otros DTOs, como UpdateOrderStatusDto, pero por ahora esto es suficiente
// para la creación de pedidos y para que orderService.ts no tenga errores de tipo. 