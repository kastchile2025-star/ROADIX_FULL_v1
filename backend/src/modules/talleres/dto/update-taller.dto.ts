import { IsString, IsOptional } from 'class-validator';

export class UpdateTallerDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  rut?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsOptional()
  config_json?: Record<string, unknown>;
}
