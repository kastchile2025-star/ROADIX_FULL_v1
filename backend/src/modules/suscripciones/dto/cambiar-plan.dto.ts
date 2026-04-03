import { IsInt, IsEnum, IsEmail, IsOptional } from 'class-validator';
import { SuscripcionPeriodo } from '../../../common/enums.js';

export class CambiarPlanDto {
  @IsInt()
  plan_id: number;

  @IsEnum(SuscripcionPeriodo)
  periodo: SuscripcionPeriodo;

  @IsEmail()
  @IsOptional()
  billing_email?: string;
}
