import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { SuscripcionPeriodo } from '../../../common/enums.js';

export class EnterpriseContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  taller_nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  telefono?: string;

  @IsEnum(SuscripcionPeriodo)
  periodo: SuscripcionPeriodo;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  mensaje?: string;
}