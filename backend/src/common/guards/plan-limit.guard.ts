import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Suscripcion } from '../../database/entities/suscripcion.entity.js';
import { Usuario } from '../../database/entities/usuario.entity.js';
import { Vehiculo } from '../../database/entities/vehiculo.entity.js';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { SuscripcionEstado, UserRole } from '../../common/enums.js';

export const PLAN_LIMIT_KEY = 'plan-limit';

export type PlanLimitType = 'usuarios' | 'vehiculos' | 'ots';

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Suscripcion)
    private readonly suscripcionRepo: Repository<Suscripcion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepo: Repository<Vehiculo>,
    @InjectRepository(OrdenTrabajo)
    private readonly otRepo: Repository<OrdenTrabajo>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitType = this.reflector.get<PlanLimitType>(
      PLAN_LIMIT_KEY,
      context.getHandler(),
    );
    if (!limitType) return true;

    const request = context.switchToHttp().getRequest();
    const userRole: string = request.user?.rol;
    if (userRole === UserRole.SUPERADMIN || userRole === UserRole.ADMIN_TALLER) {
      return true;
    }

    const tallerId: number = request.user?.taller_id;
    if (!tallerId) throw new ForbiddenException('Taller no identificado');

    const suscripcion = await this.suscripcionRepo.findOne({
      where: { taller_id: tallerId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    if (!suscripcion || !suscripcion.plan) {
      throw new ForbiddenException('Sin suscripción activa');
    }

    const activeStatuses: string[] = [SuscripcionEstado.ACTIVA, SuscripcionEstado.TRIAL];
    if (!activeStatuses.includes(suscripcion.estado)) {
      throw new ForbiddenException(
        'Tu suscripción no está activa. Renueva tu plan para continuar.',
      );
    }

    if (
      suscripcion.estado === SuscripcionEstado.TRIAL &&
      suscripcion.trial_hasta &&
      new Date(suscripcion.trial_hasta) < new Date()
    ) {
      throw new ForbiddenException(
        'Tu período de prueba ha expirado. Selecciona un plan para continuar.',
      );
    }

    const plan = suscripcion.plan;

    if (limitType === 'usuarios') {
      const count = await this.usuarioRepo.count({
        where: { taller_id: tallerId, activo: true },
      });
      if (count >= plan.max_usuarios) {
        throw new ForbiddenException(
          `Has alcanzado el límite de ${plan.max_usuarios} usuarios en tu plan ${plan.nombre}. Actualiza tu plan para agregar más.`,
        );
      }
    }

    if (limitType === 'vehiculos') {
      const count = await this.vehiculoRepo.count({
        where: { taller_id: tallerId },
      });
      if (count >= plan.max_vehiculos) {
        throw new ForbiddenException(
          `Has alcanzado el límite de ${plan.max_vehiculos} vehículos en tu plan ${plan.nombre}. Actualiza tu plan para agregar más.`,
        );
      }
    }

    if (limitType === 'ots') {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      const count = await this.otRepo.count({
        where: { taller_id: tallerId, created_at: MoreThanOrEqual(inicioMes) },
      });
      if (count >= plan.max_ots_mes) {
        throw new ForbiddenException(
          `Has alcanzado el límite de ${plan.max_ots_mes} OTs/mes en tu plan ${plan.nombre}. Actualiza tu plan para crear más.`,
        );
      }
    }

    return true;
  }
}
