import { IsString, IsNumber, IsEnum, IsOptional, IsDate } from 'class-validator';
import { ExpenseCategory, PaymentMethod } from '../entities/Expense';

export class CreateExpenseDto {
  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

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

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

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