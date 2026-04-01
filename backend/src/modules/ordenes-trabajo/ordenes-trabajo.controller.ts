import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { OrdenesTrabajoService } from './ordenes-trabajo.service.js';
import {
  CreateOrdenTrabajoDto,
  UpdateOrdenTrabajoDto,
  CambiarEstadoDto,
  AddOtDetalleDto,
  GuardarFirmaDto,
} from './dto/orden-trabajo.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums.js';
import { PlanLimitGuard } from '../../common/guards/plan-limit.guard.js';
import { PlanLimit } from '../../common/decorators/plan-limit.decorator.js';

@Controller('ordenes-trabajo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdenesTrabajoController {
  constructor(private readonly otService: OrdenesTrabajoService) {}

  @Get()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.MECANICO, UserRole.VIEWER)
  findAll(
    @CurrentUser('taller_id') tallerId: number,
    @Query('search') search?: string,
    @Query('estado') estado?: string,
  ) {
    return this.otService.findAll(tallerId, search, estado);
  }

  @Get('kanban')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.MECANICO)
  kanban(@CurrentUser('taller_id') tallerId: number) {
    return this.otService.findByEstado(tallerId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.MECANICO, UserRole.VIEWER)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.otService.findOne(id, tallerId);
  }

  @Post()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  @UseGuards(PlanLimitGuard)
  @PlanLimit('ots')
  create(
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: CreateOrdenTrabajoDto,
  ) {
    return this.otService.create(tallerId, dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: UpdateOrdenTrabajoDto,
  ) {
    return this.otService.update(id, tallerId, dto);
  }

  @Patch(':id/estado')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.MECANICO)
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: CambiarEstadoDto,
  ) {
    return this.otService.cambiarEstado(id, tallerId, dto);
  }

  @Patch(':id/mecanico/:mecanicoId')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  asignarMecanico(
    @Param('id', ParseIntPipe) id: number,
    @Param('mecanicoId', ParseIntPipe) mecanicoId: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.otService.asignarMecanico(id, tallerId, mecanicoId);
  }

  @Post(':id/detalles')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.MECANICO)
  addDetalle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: AddOtDetalleDto,
  ) {
    return this.otService.addDetalle(id, tallerId, dto);
  }

  @Delete(':id/detalles/:detalleId')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  removeDetalle(
    @Param('id', ParseIntPipe) id: number,
    @Param('detalleId', ParseIntPipe) detalleId: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.otService.removeDetalle(id, detalleId, tallerId);
  }

  @Post(':id/fotos')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA, UserRole.MECANICO)
  addFoto(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Body() data: { url: string; tipo: string; descripcion?: string },
  ) {
    return this.otService.addFoto(id, tallerId, data);
  }

  @Delete(':id/fotos/:fotoId')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  removeFoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('fotoId', ParseIntPipe) fotoId: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.otService.removeFoto(id, fotoId, tallerId);
  }

  @Put(':id/checklist')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  updateChecklist(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Body() items: { zona_vehiculo: string; estado: string; foto_url?: string; notas?: string }[],
  ) {
    return this.otService.updateChecklist(id, tallerId, items);
  }

  @Patch(':id/firma')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN, UserRole.RECEPCIONISTA)
  guardarFirma(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: GuardarFirmaDto,
  ) {
    return this.otService.guardarFirma(id, tallerId, dto.firma_base64);
  }
}
