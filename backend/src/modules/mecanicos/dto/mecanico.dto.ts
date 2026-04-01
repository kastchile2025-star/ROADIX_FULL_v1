import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateMecanicoDto {
  @IsNumber()
  @IsOptional()
  usuario_id?: number;

  @IsString()
  @IsOptional()
  especialidad?: string;

  @IsNumber()
  @IsOptional()
  tarifa_hora?: number;
}

export class UpdateMecanicoDto {
  @IsString()
  @IsOptional()
  especialidad?: string;

  @IsNumber()
  @IsOptional()
  tarifa_hora?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
