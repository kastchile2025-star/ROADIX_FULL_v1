import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { TipoCliente } from '../../../common/enums.js';

export class UpdateClienteDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  rut?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsEnum(TipoCliente)
  @IsOptional()
  tipo?: TipoCliente;
}
