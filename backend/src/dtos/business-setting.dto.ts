import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { Currency } from '../entities/BusinessSetting'; // Ajusta la ruta si es necesario

export class BusinessSettingDto {
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'El nombre del negocio no debe exceder los 255 caracteres' })
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'El teléfono no debe exceder los 50 caracteres' })
  phone?: string;

  @IsOptional()
  @IsEnum(Currency, { message: 'La moneda proporcionada no es válida' })
  currency?: Currency;

  // @IsOptional()
  // @IsString()
  // @MaxLength(255)
  // logoUrl?: string; // Para el futuro
} 