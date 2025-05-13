import { IsString, IsNotEmpty, MaxLength, IsOptional, IsNumber, Min, IsInt } from 'class-validator';

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
  stock: number;

  @IsInt()
  @IsNotEmpty()
  unitOfMeasureId: number;

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

  @IsInt()
  @IsOptional()
  unitOfMeasureId?: number;

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