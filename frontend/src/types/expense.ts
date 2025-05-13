import type { User } from './user';
import { PaymentMethod } from './common';

export enum ExpenseCategory {
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  SUPPLIES = 'SUPPLIES',
  SALARY = 'SALARY',
  MAINTENANCE = 'MAINTENANCE',
  MARKETING = 'MARKETING',
  OTHER = 'OTHER'
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