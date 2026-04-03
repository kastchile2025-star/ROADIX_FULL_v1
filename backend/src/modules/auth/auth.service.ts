import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Usuario } from '../../database/entities/usuario.entity.js';
import { Taller } from '../../database/entities/taller.entity.js';
import { Suscripcion } from '../../database/entities/suscripcion.entity.js';
import { Plan } from '../../database/entities/plan.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { InviteUserDto } from './dto/invite-user.dto.js';
import { UserRole, SuscripcionEstado, SuscripcionPeriodo, TipoEmail } from '../../common/enums.js';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Taller)
    private readonly tallerRepo: Repository<Taller>,
    @InjectRepository(Suscripcion)
    private readonly suscripcionRepo: Repository<Suscripcion>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  private async findLoginUser(identifier: string) {
    const normalizedIdentifier = identifier.trim();
    const loweredIdentifier = normalizedIdentifier.toLowerCase();

    if (loweredIdentifier === 'admin' || loweredIdentifier === 'admin@roadix.cl') {
      const adminUser = await this.usuarioRepo.findOne({
        where: { email: 'admin', activo: true },
      });

      if (adminUser) {
        return adminUser;
      }

      return this.usuarioRepo.findOne({
        where: { email: 'admin@roadix.cl', activo: true },
      });
    }

    return this.usuarioRepo.findOne({
      where: { email: normalizedIdentifier, activo: true },
    });
  }

  async login(dto: LoginDto) {
    const user = await this.findLoginUser(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        taller_id: user.taller_id,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.usuarioRepo.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Create taller
    const taller = this.tallerRepo.create({
      nombre: dto.taller_nombre,
      rut: dto.taller_rut,
    });
    const savedTaller = await this.tallerRepo.save(taller);

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create admin user
    const usuario = this.usuarioRepo.create({
      taller_id: savedTaller.id,
      nombre: dto.nombre,
      email: dto.email,
      password: hashedPassword,
      rol: UserRole.ADMIN_TALLER,
      telefono: dto.telefono,
    });
    const savedUser = await this.usuarioRepo.save(usuario);

    // Create trial subscription with free plan
    const freePlan = await this.planRepo.findOneBy({ nombre: 'free' });
    if (freePlan) {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 14);

      const suscripcion = this.suscripcionRepo.create({
        taller_id: savedTaller.id,
        plan_id: freePlan.id,
        periodo: SuscripcionPeriodo.MENSUAL,
        estado: SuscripcionEstado.TRIAL,
        fecha_inicio: now,
        trial_hasta: trialEnd,
      });
      await this.suscripcionRepo.save(suscripcion);
    }

    const tokens = await this.generateTokens(savedUser);
    await this.updateRefreshToken(savedUser.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: savedUser.id,
        nombre: savedUser.nombre,
        email: savedUser.email,
        rol: savedUser.rol,
        taller_id: savedUser.taller_id,
      },
    };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usuarioRepo.findOne({
        where: { id: payload.sub, activo: true },
      });
      if (!user || !user.refresh_token) {
        throw new UnauthorizedException();
      }

      const isMatch = await bcrypt.compare(dto.refreshToken, user.refresh_token);
      if (!isMatch) {
        throw new UnauthorizedException();
      }

      const tokens = await this.generateTokens(user);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Token de refresco inválido');
    }
  }

  async getMe(userId: number) {
    const user = await this.usuarioRepo.findOne({
      where: { id: userId },
      relations: ['taller'],
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const { password, refresh_token, ...result } = user;
    return result;
  }

  async logout(userId: number) {
    await this.usuarioRepo.update(userId, { refresh_token: undefined });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usuarioRepo.findOne({
      where: { email: dto.email, activo: true },
      relations: ['taller'],
    });
    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(token, 12);

    // Store hashed token in refresh_token field (temporary reuse)
    // In production you'd use a separate password_reset_token + expiry column
    await this.usuarioRepo.update(user.id, { refresh_token: hash });

    const resetUrl = `${this.config.get('APP_URL', 'http://localhost:5173')}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    await this.emailService.enviar(
      user.taller_id,
      TipoEmail.RESET_PASSWORD,
      user.email,
      'Restablecer contraseña — Roadix',
      'reset_password',
      { nombre: user.nombre, taller_nombre: user.taller?.nombre ?? 'Roadix', reset_url: resetUrl },
    );

    return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // Find users that have a stored reset token
    const users = await this.usuarioRepo.find({ where: { activo: true } });
    let targetUser: Usuario | null = null;

    for (const user of users) {
      if (user.refresh_token) {
        const isMatch = await bcrypt.compare(dto.token, user.refresh_token);
        if (isMatch) {
          targetUser = user;
          break;
        }
      }
    }

    if (!targetUser) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    await this.usuarioRepo.update(targetUser.id, {
      password: hashedPassword,
      refresh_token: undefined,
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usuarioRepo.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.usuarioRepo.update(userId, { password: hashedPassword });

    return { message: 'Contraseña actualizada correctamente' };
  }

  async inviteUser(adminUserId: number, dto: InviteUserDto) {
    const admin = await this.usuarioRepo.findOne({
      where: { id: adminUserId },
      relations: ['taller'],
    });
    if (!admin) {
      throw new UnauthorizedException();
    }

    const existingUser = await this.usuarioRepo.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Create a temp password that will be overridden when user activates
    const tempToken = crypto.randomBytes(32).toString('hex');
    const hashedTemp = await bcrypt.hash(tempToken, 12);

    const usuario = this.usuarioRepo.create({
      taller_id: admin.taller_id,
      nombre: dto.nombre,
      email: dto.email,
      password: hashedTemp,
      rol: dto.rol,
      telefono: dto.telefono,
      activo: false, // Inactive until they set their password
      refresh_token: await bcrypt.hash(tempToken, 12),
    });
    const savedUser = await this.usuarioRepo.save(usuario);

    const inviteUrl = `${this.config.get('APP_URL', 'http://localhost:5173')}/activate?token=${tempToken}&email=${encodeURIComponent(dto.email)}`;

    await this.emailService.enviar(
      admin.taller_id,
      TipoEmail.INVITACION,
      dto.email,
      `Te han invitado a ${admin.taller?.nombre ?? 'Roadix'}`,
      'invitacion',
      {
        nombre: dto.nombre,
        taller_nombre: admin.taller?.nombre ?? 'Roadix',
        rol: dto.rol,
        invite_url: inviteUrl,
      },
    );

    return { id: savedUser.id, nombre: savedUser.nombre, email: savedUser.email, rol: savedUser.rol };
  }

  async activateAccount(token: string, password: string) {
    // Find user with matching invite token
    const users = await this.usuarioRepo.find({ where: { activo: false } });
    let targetUser: Usuario | null = null;

    for (const user of users) {
      if (user.refresh_token) {
        const isMatch = await bcrypt.compare(token, user.refresh_token);
        if (isMatch) {
          targetUser = user;
          break;
        }
      }
    }

    if (!targetUser) {
      throw new BadRequestException('Token de invitación inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await this.usuarioRepo.update(targetUser.id, {
      password: hashedPassword,
      activo: true,
      refresh_token: undefined,
    });

    const tokens = await this.generateTokens(targetUser);
    await this.updateRefreshToken(targetUser.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: targetUser.id,
        nombre: targetUser.nombre,
        email: targetUser.email,
        rol: targetUser.rol,
        taller_id: targetUser.taller_id,
      },
    };
  }

  private async generateTokens(user: Usuario) {
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      taller_id: user.taller_id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 12);
    await this.usuarioRepo.update(userId, { refresh_token: hash });
  }
}
