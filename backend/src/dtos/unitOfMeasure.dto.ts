import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateUnitOfMeasureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  symbol: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateUnitOfMeasureDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  symbol?: string;

  @IsOptional()
  @IsString()
  description?: string;
} 