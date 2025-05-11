import type { User } from './user';

export enum ExpenseCategory {
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  SUPPLIES = 'SUPPLIES',
  SALARY = 'SALARY',
  MAINTENANCE = 'MAINTENANCE',
  MARKETING = 'MARKETING',
  OTHER = 'OTHER'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer'
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  paymentMethod?: PaymentMethod;
  notes?: string;
  receiptNumber?: string;
  createdBy?: Partial<User>;
  createdAt: string;
  updatedAt: string;
} 