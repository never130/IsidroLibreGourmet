import { IsString, IsNotEmpty, MaxLength, IsOptional, IsNumber, Min, IsInt, IsEnum } from 'class-validator';
import { UnitOfMeasure } from '../entities/Ingredient';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string | null;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsNotEmpty()
  stockQuantity: number;

  @IsEnum(UnitOfMeasure)
  @IsNotEmpty()
  unitOfMeasure: UnitOfMeasure;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  lowStockThreshold?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  costPrice?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  supplier?: string;
}

export class UpdateIngredientDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string | null;

  @IsEnum(UnitOfMeasure)
  @IsOptional()
  unitOfMeasure?: UnitOfMeasure;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  costPrice?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  supplier?: string;
}

export class AdjustStockDto {
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  isAddition: boolean;
} 