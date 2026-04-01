import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PlanLimitGuard } from '../../common/guards/plan-limit.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { PlanLimit } from '../../common/decorators/plan-limit.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums.js';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  findAll(@CurrentUser('taller_id') tallerId: number) {
    return this.usuariosService.findAll(tallerId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.usuariosService.findOne(id, tallerId);
  }

  @Post()
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  @UseGuards(PlanLimitGuard)
  @PlanLimit('usuarios')
  create(
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: CreateUsuarioDto,
  ) {
    return this.usuariosService.create(tallerId, dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, tallerId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('taller_id') tallerId: number,
  ) {
    return this.usuariosService.remove(id, tallerId);
  }
}
