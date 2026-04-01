import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Prioridad, ZonaVehiculo, EstadoChecklist } from '../../../common/enums.js';

export class ChecklistItemDto {
  @IsEnum(ZonaVehiculo)
  zona_vehiculo: ZonaVehiculo;

  @IsEnum(EstadoChecklist)
  @IsOptional()
  estado?: EstadoChecklist;

  @IsString()
  @IsOptional()
  foto_url?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

export class CreateOrdenTrabajoDto {
  @IsNumber()
  vehiculo_id: number;

  @IsNumber()
  cliente_id: number;

  @IsNumber()
  @IsOptional()
  mecanico_id?: number;

  @IsString()
  @IsOptional()
  tipo_servicio?: string;

  @IsNumber()
  @IsOptional()
  km_ingreso?: number;

  @IsString()
  @IsOptional()
  combustible_ing?: string;

  @IsString()
  @IsOptional()
  diagnostico?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsOptional()
  fecha_prometida?: string;

  @IsEnum(Prioridad)
  @IsOptional()
  prioridad?: Prioridad;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  @IsOptional()
  checklist?: ChecklistItemDto[];

  @IsString()
  @IsOptional()
  firma_base64?: string;
}

export class GuardarFirmaDto {
  @IsString()
  firma_base64: string;
}

export class UpdateOrdenTrabajoDto {
  @IsNumber()
  @IsOptional()
  mecanico_id?: number;

  @IsString()
  @IsOptional()
  tipo_servicio?: string;

  @IsString()
  @IsOptional()
  diagnostico?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsOptional()
  fecha_prometida?: string;

  @IsEnum(Prioridad)
  @IsOptional()
  prioridad?: Prioridad;
}

export class CambiarEstadoDto {
  @IsString()
  estado: string;
}

export class AddOtDetalleDto {
  @IsString()
  tipo: string; // 'mano_obra' | 'repuesto'

  @IsNumber()
  @IsOptional()
  repuesto_id?: number;

  @IsString()
  descripcion: string;

  @IsNumber()
  @IsOptional()
  cantidad?: number;

  @IsNumber()
  @IsOptional()
  precio_unit?: number;

  @IsNumber()
  @IsOptional()
  descuento?: number;
}
