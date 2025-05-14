import { IsInt, IsString, IsOptional, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { RecipeItemDto } from './recipe-item.dto';

export class CreateRecipeDto {
  @IsInt()
  productId: number; // El ID del producto al que pertenece esta receta

  @IsString()
  @IsOptional()
  name?: string; // Nombre opcional para la receta, ej: "Receta Clásica"

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1) // Una receta debe tener al menos un ingrediente
  @Type(() => RecipeItemDto)
  items: RecipeItemDto[];
} 