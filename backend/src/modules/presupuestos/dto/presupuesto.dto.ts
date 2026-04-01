import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
} from 'class-validator';
import { PresupuestoEstado } from '../../../common/enums.js';

export class PresupuestoItemDto {
  tipo: string;
  descripcion: string;
  cantidad: number;
  precio_unit: number;
  descuento?: number;
}

export class CreatePresupuestoDto {
  @IsNumber()
  ot_id: number;

  @IsArray()
  @IsOptional()
  items_json?: PresupuestoItemDto[];
}

export class UpdatePresupuestoDto {
  @IsArray()
  @IsOptional()
  items_json?: PresupuestoItemDto[];

  @IsEnum(PresupuestoEstado)
  @IsOptional()
  estado?: PresupuestoEstado;
}
