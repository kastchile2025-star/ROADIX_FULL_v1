import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { OtDetalle } from '../../database/entities/ot-detalle.entity.js';
import { OtFoto } from '../../database/entities/ot-foto.entity.js';
import { ChecklistRecepcion } from '../../database/entities/checklist-recepcion.entity.js';
import {
  CreateOrdenTrabajoDto,
  UpdateOrdenTrabajoDto,
  CambiarEstadoDto,
  AddOtDetalleDto,
} from './dto/orden-trabajo.dto.js';
import { OtEstado } from '../../common/enums.js';
import { randomUUID } from 'crypto';
import { ArchivosService } from '../archivos/archivos.service.js';

@Injectable()
export class OrdenesTrabajoService {
  constructor(
    @InjectRepository(OrdenTrabajo)
    private readonly otRepo: Repository<OrdenTrabajo>,
    @InjectRepository(OtDetalle)
    private readonly detalleRepo: Repository<OtDetalle>,
    @InjectRepository(OtFoto)
    private readonly fotoRepo: Repository<OtFoto>,
    @InjectRepository(ChecklistRecepcion)
    private readonly checklistRepo: Repository<ChecklistRecepcion>,
    private readonly archivosService: ArchivosService,
  ) {}

  async findAll(tallerId: number, search?: string, estado?: string) {
    const qb = this.otRepo
      .createQueryBuilder('ot')
      .leftJoinAndSelect('ot.vehiculo', 'vehiculo')
      .leftJoinAndSelect('ot.cliente', 'cliente')
      .leftJoinAndSelect('ot.mecanico', 'mecanico')
      .where('ot.taller_id = :tallerId', { tallerId })
      .orderBy('ot.created_at', 'DESC');

    if (estado) {
      qb.andWhere('ot.estado = :estado', { estado });
    }
    if (search) {
      qb.andWhere(
        '(ot.numero_ot ILIKE :search OR cliente.nombre ILIKE :search OR vehiculo.patente ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    return qb.getMany();
  }

  async findByEstado(tallerId: number) {
    const ots = await this.otRepo.find({
      where: { taller_id: tallerId },
      relations: ['vehiculo', 'cliente', 'mecanico'],
      order: { prioridad: 'DESC', created_at: 'ASC' },
    });

    const grouped: Record<string, OrdenTrabajo[]> = {};
    for (const estado of Object.values(OtEstado)) {
      grouped[estado] = [];
    }
    for (const ot of ots) {
      grouped[ot.estado].push(ot);
    }
    return grouped;
  }

  async findOne(id: number, tallerId: number) {
    const ot = await this.otRepo.findOne({
      where: { id, taller_id: tallerId },
      relations: ['vehiculo', 'cliente', 'mecanico', 'detalles', 'fotos', 'checklist'],
    });
    if (!ot) throw new NotFoundException('Orden de trabajo no encontrada');
    return ot;
  }

  async create(tallerId: number, dto: CreateOrdenTrabajoDto) {
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const numero_ot = await this.generateNumeroOt(tallerId);
      const token_portal = randomUUID();

      const ot = this.otRepo.create({
        taller_id: tallerId,
        vehiculo_id: dto.vehiculo_id,
        cliente_id: dto.cliente_id,
        mecanico_id: dto.mecanico_id,
        tipo_servicio: dto.tipo_servicio,
        km_ingreso: dto.km_ingreso,
        combustible_ing: dto.combustible_ing,
        diagnostico: dto.diagnostico,
        observaciones: dto.observaciones,
        fecha_prometida: dto.fecha_prometida ? new Date(dto.fecha_prometida) : undefined,
        prioridad: dto.prioridad,
        numero_ot,
        token_portal,
        estado: OtEstado.RECEPCION,
      });

      if (dto.firma_base64) {
        ot.firma_cliente_url = this.archivosService.saveBase64(dto.firma_base64, 'firma');
      }

      try {
        const saved = await this.otRepo.save(ot);

        if (dto.checklist?.length) {
          const items = dto.checklist.map((c) =>
            this.checklistRepo.create({ ot_id: saved.id, ...c }),
          );
          await this.checklistRepo.save(items);
        }

        return this.findOne(saved.id, tallerId);
      } catch (err: any) {
        const isDuplicate = err?.code === '23505' || err?.detail?.includes('numero_ot');
        if (isDuplicate && attempt < maxRetries - 1) continue;
        throw err;
      }
    }
  }

  async update(id: number, tallerId: number, dto: UpdateOrdenTrabajoDto) {
    const ot = await this.findOne(id, tallerId);
    if (dto.fecha_prometida) {
      (ot as any).fecha_prometida = new Date(dto.fecha_prometida);
      delete (dto as any).fecha_prometida;
    }
    Object.assign(ot, dto);
    await this.otRepo.save(ot);
    return this.findOne(id, tallerId);
  }

  async cambiarEstado(id: number, tallerId: number, dto: CambiarEstadoDto) {
    const ot = await this.findOne(id, tallerId);
    const nuevoEstado = dto.estado as OtEstado;

    if (!Object.values(OtEstado).includes(nuevoEstado)) {
      throw new BadRequestException(`Estado inválido: ${dto.estado}`);
    }

    ot.estado = nuevoEstado;

    if (nuevoEstado === OtEstado.ENTREGADO && !ot.fecha_entrega) {
      ot.fecha_entrega = new Date();
    }

    await this.otRepo.save(ot);
    return this.findOne(id, tallerId);
  }

  async addDetalle(otId: number, tallerId: number, dto: AddOtDetalleDto) {
    await this.findOne(otId, tallerId);

    const subtotal = (dto.cantidad ?? 1) * (dto.precio_unit ?? 0);
    const descuentoMonto = subtotal * ((dto.descuento ?? 0) / 100);

    const detalle = this.detalleRepo.create({
      ot_id: otId,
      tipo: dto.tipo as any,
      repuesto_id: dto.repuesto_id,
      descripcion: dto.descripcion,
      cantidad: dto.cantidad ?? 1,
      precio_unit: dto.precio_unit ?? 0,
      descuento: dto.descuento ?? 0,
      subtotal: subtotal - descuentoMonto,
    });

    await this.detalleRepo.save(detalle);
    await this.recalcularTotales(otId);
    return this.findOne(otId, tallerId);
  }

  async removeDetalle(otId: number, detalleId: number, tallerId: number) {
    await this.findOne(otId, tallerId);
    const detalle = await this.detalleRepo.findOne({
      where: { id: detalleId, ot_id: otId },
    });
    if (!detalle) throw new NotFoundException('Detalle no encontrado');
    await this.detalleRepo.remove(detalle);
    await this.recalcularTotales(otId);
    return this.findOne(otId, tallerId);
  }

  async addFoto(otId: number, tallerId: number, data: { url: string; tipo: string; descripcion?: string }) {
    await this.findOne(otId, tallerId);
    const foto = this.fotoRepo.create({
      ot_id: otId,
      url: data.url,
      tipo: data.tipo as any,
      descripcion: data.descripcion,
    });
    return this.fotoRepo.save(foto);
  }

  async removeFoto(otId: number, fotoId: number, tallerId: number) {
    await this.findOne(otId, tallerId);
    const foto = await this.fotoRepo.findOne({
      where: { id: fotoId, ot_id: otId },
    });
    if (!foto) throw new NotFoundException('Foto no encontrada');
    this.archivosService.deleteFileByUrl(foto.url);
    return this.fotoRepo.remove(foto);
  }

  async updateChecklist(
    otId: number,
    tallerId: number,
    items: { zona_vehiculo: string; estado: string; foto_url?: string; notas?: string }[],
  ) {
    await this.findOne(otId, tallerId);
    await this.checklistRepo.delete({ ot_id: otId });
    for (const c of items) {
      const item = this.checklistRepo.create({ ot_id: otId, ...c } as any);
      await this.checklistRepo.save(item);
    }
    return this.findOne(otId, tallerId);
  }

  async asignarMecanico(otId: number, tallerId: number, mecanicoId: number) {
    const ot = await this.findOne(otId, tallerId);
    ot.mecanico_id = mecanicoId;
    await this.otRepo.save(ot);
    return this.findOne(otId, tallerId);
  }

  async guardarFirma(otId: number, tallerId: number, firmaBase64: string) {
    const ot = await this.findOne(otId, tallerId);
    if (ot.firma_cliente_url) {
      this.archivosService.deleteFileByUrl(ot.firma_cliente_url);
    }
    ot.firma_cliente_url = this.archivosService.saveBase64(firmaBase64, 'firma');
    await this.otRepo.save(ot);
    return this.findOne(otId, tallerId);
  }

  private async recalcularTotales(otId: number) {
    const detalles = await this.detalleRepo.find({ where: { ot_id: otId } });
    const subtotal = detalles.reduce((sum, d) => sum + Number(d.subtotal), 0);
    const iva = Math.round(subtotal * 0.19);
    const total = subtotal + iva;
    await this.otRepo.update(otId, { subtotal, iva, total });
  }

  private async generateNumeroOt(tallerId: number): Promise<string> {
    const count = await this.otRepo.count({ where: { taller_id: tallerId } });
    const num = (count + 1).toString().padStart(6, '0');
    return `OT-T${tallerId}-${num}`;
  }
}
