import { IsString, IsInt, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { TipoVehiculo, Combustible } from '../../../common/enums.js';

export class CreateVehiculoDto {
  @IsInt()
  cliente_id: number;

  @IsString()
  patente: string;

  @IsString()
  @IsOptional()
  marca?: string;

  @IsString()
  @IsOptional()
  modelo?: string;

  @IsInt()
  @IsOptional()
  anio?: number;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsEnum(TipoVehiculo)
  @IsOptional()
  tipo_vehiculo?: TipoVehiculo;

  @IsInt()
  @IsOptional()
  km_actual?: number;

  @IsEnum(Combustible)
  @IsOptional()
  combustible?: Combustible;

  @IsDateString()
  @IsOptional()
  rev_tecnica?: string;

  @IsDateString()
  @IsOptional()
  permiso_circ?: string;

  @IsDateString()
  @IsOptional()
  soap_vence?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
