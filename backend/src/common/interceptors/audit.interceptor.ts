import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditoriaLog } from '../../database/entities/auditoria-log.entity.js';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditoriaLog)
    private readonly auditRepo: Repository<AuditoriaLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;

    if (!MUTATION_METHODS.has(method)) {
      return next.handle();
    }

    const user = req.user;
    if (!user) {
      return next.handle();
    }

    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const entidad = controller.replace('Controller', '');
    const entidadId = req.params?.id ? Number(req.params.id) : undefined;
    const ip = req.ip || req.connection?.remoteAddress;

    return next.handle().pipe(
      tap((responseData) => {
        const log = this.auditRepo.create({
          taller_id: user.taller_id,
          usuario_id: user.sub ?? user.id,
          accion: `${method} ${handler}`,
          entidad,
          entidad_id: entidadId,
          datos_despues: method === 'DELETE' ? undefined : (responseData as Record<string, unknown>),
          ip: ip as string,
        });
        this.auditRepo.save(log).catch(() => {});
      }),
    );
  }
}
