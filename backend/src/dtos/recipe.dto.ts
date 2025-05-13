import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsInt,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecipeItemDto {
  @IsInt()
  @IsNotEmpty()
  ingredientId: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001) // La cantidad debe ser positiva
  quantity: number;

  @IsInt()
  @IsNotEmpty()
  unitOfMeasureId: number; // Por ahora, asumimos que esta unidad es directamente utilizable.

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRecipeDto {
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1) // Una receta debe tener al menos un ingrediente
  @Type(() => RecipeItemDto)
  items: RecipeItemDto[];
}

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional() // Si se envía, reemplaza todos los ítems. Si no se envía, los ítems no se modifican.
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => RecipeItemDto)
  items?: RecipeItemDto[];
} 