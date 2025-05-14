import { IsString, IsNotEmpty, IsEnum, IsNumber, Min, IsOptional } from 'class-validator';
import { IngredientUnit } from '../enums/ingredient-unit.enum';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(IngredientUnit)
  @IsNotEmpty()
  unitOfMeasure: IngredientUnit;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsNotEmpty()
  stockQuantity: number;
} 