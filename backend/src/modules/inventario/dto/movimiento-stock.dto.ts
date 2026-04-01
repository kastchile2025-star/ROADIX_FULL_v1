import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { TipoMovimientoStock } from '../../../common/enums.js';

export class MovimientoStockDto {
  @IsNumber()
  repuesto_id: number;

  @IsEnum(TipoMovimientoStock)
  tipo: TipoMovimientoStock;

  @IsNumber()
  cantidad: number;

  @IsString()
  @IsOptional()
  motivo?: string;

  @IsNumber()
  @IsOptional()
  ot_detalle_id?: number;
}
