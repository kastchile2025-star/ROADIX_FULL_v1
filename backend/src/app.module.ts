import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js';
import { AuditoriaLog } from './database/entities/auditoria-log.entity.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';
import { TalleresModule } from './modules/talleres/talleres.module.js';
import { ClientesModule } from './modules/clientes/clientes.module.js';
import { VehiculosModule } from './modules/vehiculos/vehiculos.module.js';
import { PlanesModule } from './modules/planes/planes.module.js';
import { SuscripcionesModule } from './modules/suscripciones/suscripciones.module.js';
import { MecanicosModule } from './modules/mecanicos/mecanicos.module.js';
import { OrdenesTrabajoModule } from './modules/ordenes-trabajo/ordenes-trabajo.module.js';
import { PresupuestosModule } from './modules/presupuestos/presupuestos.module.js';
import { RepuestosModule } from './modules/repuestos/repuestos.module.js';
import { ProveedoresModule } from './modules/proveedores/proveedores.module.js';
import { InventarioModule } from './modules/inventario/inventario.module.js';
import { CajaModule } from './modules/caja/caja.module.js';
import { FacturacionModule } from './modules/facturacion/facturacion.module.js';
import { EmailModule } from './modules/email/email.module.js';
import { RecordatoriosModule } from './modules/recordatorios/recordatorios.module.js';
import { PortalClienteModule } from './modules/portal-cliente/portal-cliente.module.js';
import { ReportesModule } from './modules/reportes/reportes.module.js';
import { ArchivosModule } from './modules/archivos/archivos.module.js';
import { FlowModule } from './modules/flow/flow.module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'roadix_user'),
        password: config.get<string>('DB_PASSWORD', 'roadix_dev_pass'),
        database: config.get<string>('DB_DATABASE', 'roadix'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    TypeOrmModule.forFeature([AuditoriaLog]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsuariosModule,
    TalleresModule,
    ClientesModule,
    VehiculosModule,
    PlanesModule,
    SuscripcionesModule,
    MecanicosModule,
    OrdenesTrabajoModule,
    PresupuestosModule,
    RepuestosModule,
    ProveedoresModule,
    InventarioModule,
    CajaModule,
    FacturacionModule,
    EmailModule,
    RecordatoriosModule,
    PortalClienteModule,
    ReportesModule,
    ArchivosModule,
    FlowModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
