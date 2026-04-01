import {
  IsString,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateRepuestoDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  codigo?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  categoria?: string;

  @IsNumber()
  @IsOptional()
  proveedor_id?: number;

  @IsNumber()
  @IsOptional()
  precio_compra?: number;

  @IsNumber()
  @IsOptional()
  precio_venta?: number;

  @IsNumber()
  @IsOptional()
  stock_actual?: number;

  @IsNumber()
  @IsOptional()
  stock_minimo?: number;

  @IsString()
  @IsOptional()
  ubicacion_bodega?: string;
}

export class UpdateRepuestoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  codigo?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  categoria?: string;

  @IsNumber()
  @IsOptional()
  proveedor_id?: number;

  @IsNumber()
  @IsOptional()
  precio_compra?: number;

  @IsNumber()
  @IsOptional()
  precio_venta?: number;

  @IsNumber()
  @IsOptional()
  stock_minimo?: number;

  @IsString()
  @IsOptional()
  ubicacion_bodega?: string;
}
