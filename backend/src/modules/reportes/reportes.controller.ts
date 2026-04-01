import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ReportesService } from './reportes.service.js';

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private reportesService: ReportesService) {}

  @Get('ingresos')
  ingresos(
    @Request() req: any,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Query('agrupacion') agrupacion?: 'dia' | 'semana' | 'mes',
  ) {
    return this.reportesService.ingresos(req.user.taller_id, desde, hasta, agrupacion);
  }

  @Get('ots-por-estado')
  otsPorEstado(@Request() req: any) {
    return this.reportesService.otsPorEstado(req.user.taller_id);
  }

  @Get('eficiencia-mecanicos')
  eficienciaMecanicos(
    @Request() req: any,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportesService.eficienciaMecanicos(req.user.taller_id, desde, hasta);
  }

  @Get('top-servicios')
  topServicios(@Request() req: any, @Query('limite') limite?: number) {
    return this.reportesService.topServicios(req.user.taller_id, limite ? +limite : 5);
  }

  @Get('rotacion-inventario')
  rotacionInventario(@Request() req: any) {
    return this.reportesService.rotacionInventario(req.user.taller_id);
  }

  @Get('clientes-top')
  clientesTop(@Request() req: any, @Query('limite') limite?: number) {
    return this.reportesService.clientesTop(req.user.taller_id, limite ? +limite : 10);
  }

  @Get('resumen-diario')
  resumenDiario(@Request() req: any) {
    return this.reportesService.resumenDiario(req.user.taller_id);
  }
}
