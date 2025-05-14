import { IsInt, IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class RecipeItemDto {
  @IsInt()
  ingredientId: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001) // Evitar cantidades cero o negativas
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
} 