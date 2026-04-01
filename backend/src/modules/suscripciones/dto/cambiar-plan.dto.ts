import { IsInt, IsEnum } from 'class-validator';
import { SuscripcionPeriodo } from '../../../common/enums.js';

export class CambiarPlanDto {
  @IsInt()
  plan_id: number;

  @IsEnum(SuscripcionPeriodo)
  periodo: SuscripcionPeriodo;
}
