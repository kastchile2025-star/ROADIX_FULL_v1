import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Res,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { FacturacionService } from './facturacion.service.js';
import { EmitirDteDto } from './dto/facturacion.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums.js';
import { PdfService } from '../pdf/pdf.service.js';
import type { Response } from 'express';

@Controller('facturacion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacturacionController {
  constructor(
    private readonly facturacionService: FacturacionService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.CAJERO, UserRole.VIEWER)
  findAll(@CurrentUser('taller_id') tallerId: number) {
    return this.facturacionService.findAll(tallerId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.CAJERO)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.facturacionService.findOne(id, tallerId);
  }

  @Post('emitir')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.CAJERO)
  emitir(
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: EmitirDteDto,
  ) {
    return this.facturacionService.emitir(tallerId, dto);
  }

  @Patch(':id/anular')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  anular(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.facturacionService.anular(id, tallerId);
  }

  @Get(':id/pdf')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.CAJERO, UserRole.VIEWER)
  async pdf(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Res() res: Response,
  ) {
    const buffer = await this.pdfService.generarFacturaPdf(id, tallerId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="factura-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post(':id/enviar-email')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.CAJERO)
  enviarEmail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.facturacionService.enviarPorEmail(id, tallerId);
  }
}
