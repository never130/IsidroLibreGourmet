import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { IngredientUnit } from '../enums/ingredient-unit.enum';

export class UpdateIngredientDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(IngredientUnit)
  @IsOptional()
  unitOfMeasure?: IngredientUnit;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  stockQuantity?: number;
} 