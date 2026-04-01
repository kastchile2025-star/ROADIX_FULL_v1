import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { TipoDte } from '../../../common/enums.js';

export class EmitirDteDto {
  @IsNumber()
  ot_id: number;

  @IsEnum(TipoDte)
  tipo_dte: TipoDte;

  @IsString()
  @IsOptional()
  rut_receptor?: string;
}
