import type { Product } from './product';
import type { UserSummary } from './user';
import { PaymentMethod } from './common';

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKE_AWAY = 'takeaway',
  DELIVERY = 'delivery'
}

export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface OrderItem {
  id: number;
  productId: number;
  product?: Partial<Product>;
  quantity: number;
  priceAtPurchase: number;
}

export interface Order {
  id: number;
  type: OrderType;
  status: OrderStatus;
  customerName: string;
  customerPhone?: string | null;
  address?: string | null;
  notes?: string | null;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  createdBy?: UserSummary;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemDto {
  productId: number;
  quantity: number;
}

export interface CreateOrderDto {
  type: OrderType;
  customerName: string;
  customerPhone?: string | null;
  address?: string | null;
  items: CreateOrderItemDto[];
  paymentMethod: PaymentMethod;
  notes?: string | null;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

export interface CreateOrderPOSItemDto {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderPOSDto {
  items: CreateOrderPOSItemDto[];
  paymentMethod: PaymentMethod;
  totalAmount: number;
  notes?: string;
} 