import { IsString, IsOptional, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { RecipeItemDto } from './recipe-item.dto';

export class UpdateRecipeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @IsOptional() // Permitir no enviar los items si solo se actualizan otros campos de la receta
  @Type(() => RecipeItemDto)
  items?: RecipeItemDto[]; // Si se provee, reemplaza la lista de items existente
} 