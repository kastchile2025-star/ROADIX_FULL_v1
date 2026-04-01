import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Res,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PresupuestosService } from './presupuestos.service.js';
import { CreatePresupuestoDto, UpdatePresupuestoDto } from './dto/presupuesto.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums.js';
import { PdfService } from '../pdf/pdf.service.js';
import type { Response } from 'express';

@Controller('presupuestos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PresupuestosController {
  constructor(
    private readonly presupuestosService: PresupuestosService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.VIEWER)
  findByOt(
    @Query('ot_id', ParseIntPipe) otId: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.presupuestosService.findByOt(otId, tallerId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.VIEWER)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.presupuestosService.findOne(id, tallerId);
  }

  @Post()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  create(
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: CreatePresupuestoDto,
  ) {
    return this.presupuestosService.create(tallerId, dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: UpdatePresupuestoDto,
  ) {
    return this.presupuestosService.update(id, tallerId, dto);
  }

  @Patch(':id/enviar')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  enviar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.presupuestosService.enviar(id, tallerId);
  }

  @Get(':id/pdf')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.VIEWER)
  async pdf(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Res() res: Response,
  ) {
    const buffer = await this.pdfService.generarPresupuestoPdf(id, tallerId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="presupuesto-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
