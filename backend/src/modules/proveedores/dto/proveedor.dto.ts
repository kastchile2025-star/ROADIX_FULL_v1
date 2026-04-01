import {
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  razon_social: string;

  @IsString()
  @IsOptional()
  rut?: string;

  @IsString()
  @IsOptional()
  contacto?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefono?: string;
}

export class UpdateProveedorDto {
  @IsString()
  @IsOptional()
  razon_social?: string;

  @IsString()
  @IsOptional()
  rut?: string;

  @IsString()
  @IsOptional()
  contacto?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefono?: string;
}
