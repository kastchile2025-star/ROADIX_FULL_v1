import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Factura } from '../../database/entities/factura.entity.js';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { EmitirDteDto } from './dto/facturacion.dto.js';
import { OtEstado, TipoEmail } from '../../common/enums.js';
import { PdfService } from '../pdf/pdf.service.js';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class FacturacionService {
  constructor(
    @InjectRepository(Factura)
    private readonly facturaRepo: Repository<Factura>,
    @InjectRepository(OrdenTrabajo)
    private readonly otRepo: Repository<OrdenTrabajo>,
    private readonly pdfService: PdfService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(tallerId: number) {
    return this.facturaRepo.find({
      where: { taller_id: tallerId },
      relations: ['orden_trabajo'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number, tallerId: number) {
    const f = await this.facturaRepo.findOne({
      where: { id, taller_id: tallerId },
      relations: ['orden_trabajo'],
    });
    if (!f) throw new NotFoundException('Factura no encontrada');
    return f;
  }

  async emitir(tallerId: number, dto: EmitirDteDto) {
    const ot = await this.otRepo.findOne({
      where: { id: dto.ot_id, taller_id: tallerId },
    });
    if (!ot) throw new NotFoundException('Orden de trabajo no encontrada');

    const count = await this.facturaRepo.count({ where: { taller_id: tallerId } });
    const numero_dte = `DTE-${(count + 1).toString().padStart(8, '0')}`;

    const monto_neto = Number(ot.subtotal);
    const iva = Number(ot.iva);
    const monto_total = Number(ot.total);

    const factura = this.facturaRepo.create({
      ot_id: dto.ot_id,
      taller_id: tallerId,
      numero_dte,
      tipo_dte: dto.tipo_dte,
      rut_receptor: dto.rut_receptor,
      estado_sii: 'pendiente',
      monto_neto,
      iva,
      monto_total,
    });

    const saved = await this.facturaRepo.save(factura);

    // Mark OT as facturado
    await this.otRepo.update(ot.id, { estado: OtEstado.FACTURADO });

    return saved;
  }

  async anular(id: number, tallerId: number) {
    const factura = await this.findOne(id, tallerId);
    factura.estado_sii = 'anulado';
    return this.facturaRepo.save(factura);
  }

  async enviarPorEmail(id: number, tallerId: number) {
    const factura = await this.facturaRepo.findOne({
      where: { id, taller_id: tallerId },
      relations: ['orden_trabajo', 'orden_trabajo.cliente', 'orden_trabajo.vehiculo', 'orden_trabajo.detalles'],
    });
    if (!factura) throw new NotFoundException('Factura no encontrada');

    const cliente = factura.orden_trabajo?.cliente;
    if (!cliente?.email) {
      throw new BadRequestException('El cliente no tiene correo electrónico registrado');
    }

    const tipoDteLabel = factura.tipo_dte === 'boleta' ? 'Boleta' : factura.tipo_dte === 'factura' ? 'Factura' : 'Nota de Crédito';

    await this.emailService.enviar(
      tallerId,
      TipoEmail.FACTURA,
      cliente.email,
      `${tipoDteLabel} N° ${factura.numero_dte} — Roadix`,
      'factura',
      {
        cliente_nombre: cliente.nombre,
        tipo_dte: tipoDteLabel,
        numero_dte: factura.numero_dte,
        numero_ot: factura.orden_trabajo?.numero_ot ?? '-',
        monto_neto: Number(factura.monto_neto).toLocaleString('es-CL'),
        iva: Number(factura.iva).toLocaleString('es-CL'),
        monto_total: Number(factura.monto_total).toLocaleString('es-CL'),
        pdf_url: '',
      },
    );

    return { message: `Email enviado a ${cliente.email}` };
  }
}
