import { IsString, IsNotEmpty, MaxLength, IsOptional, IsNumber, Min, IsInt, IsEnum } from 'class-validator';
import { IngredientUnit } from '../enums/ingredient-unit.enum';

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

  @IsEnum(IngredientUnit)
  @IsNotEmpty()
  unitOfMeasure: IngredientUnit;

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

  @IsEnum(IngredientUnit)
  @IsOptional()
  unitOfMeasure?: IngredientUnit;

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