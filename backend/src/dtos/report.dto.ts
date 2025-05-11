import { IsISO8601, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer'; // Necesario para la transformación de tipos de query params (strings)

export class DateRangeQueryDto {
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
}

export class ReportParamsDto extends DateRangeQueryDto {
  @IsOptional()
  @Type(() => Number) // Transforma el string de query a número
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @Max(100, { message: 'limit no puede ser mayor a 100' }) // Límite máximo razonable
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'threshold debe ser un número entero' })
  @Min(0, { message: 'threshold no puede ser negativo' })
  threshold?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'days debe ser un número entero' })
  @Min(1, { message: 'days debe ser al menos 1' })
  days?: number;
}

// DTO específico para los parámetros de Top Products
export class TopProductsParamsDto extends DateRangeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @Max(100, { message: 'limit no puede ser mayor a 100' })
  limit?: number;
}

// DTO específico para los parámetros de Low Stock Products
export class LowStockParamsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'threshold debe ser un número entero' })
  @Min(0, { message: 'threshold no puede ser negativo' })
  threshold?: number;
} 