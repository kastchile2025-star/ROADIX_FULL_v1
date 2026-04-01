import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { MetodoPago } from '../../../common/enums.js';

export class RegistrarPagoDto {
  @IsNumber()
  ot_id: number;

  @IsNumber()
  monto: number;

  @IsEnum(MetodoPago)
  metodo_pago: MetodoPago;

  @IsString()
  @IsOptional()
  referencia?: string;
}
