import { IsString, IsNumber, IsEnum, IsOptional, IsDate } from 'class-validator';
import { ExpenseCategory, PaymentMethodExpense } from '../entities/Expense';

export class CreateExpenseDto {
  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsEnum(PaymentMethodExpense)
  paymentMethod: PaymentMethodExpense;

  @IsDate()
  date: Date;

  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateExpenseDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @IsEnum(PaymentMethodExpense)
  @IsOptional()
  paymentMethod?: PaymentMethodExpense;

  @IsDate()
  @IsOptional()
  date?: Date;

  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
} 