import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { Presupuesto } from '../../database/entities/presupuesto.entity.js';
import { Factura } from '../../database/entities/factura.entity.js';
import { Taller } from '../../database/entities/taller.entity.js';

interface PresupuestoItem {
  descripcion: string;
  cantidad: number;
  precio_unit: number;
  descuento: number;
  subtotal: number;
}

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(Presupuesto) private presupuestoRepo: Repository<Presupuesto>,
    @InjectRepository(Factura) private facturaRepo: Repository<Factura>,
    @InjectRepository(Taller) private tallerRepo: Repository<Taller>,
  ) {}

  async generarPresupuestoPdf(presupuestoId: number, tallerId: number): Promise<Buffer> {
    const presupuesto = await this.presupuestoRepo.findOne({
      where: { id: presupuestoId, taller_id: tallerId },
      relations: ['orden_trabajo', 'orden_trabajo.cliente', 'orden_trabajo.vehiculo'],
    });
    if (!presupuesto) throw new Error('Presupuesto no encontrado');

    const taller = await this.tallerRepo.findOneBy({ id: tallerId });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    const ot = presupuesto.orden_trabajo;
    const cliente = ot?.cliente;
    const vehiculo = ot?.vehiculo;
    const items: PresupuestoItem[] = (presupuesto.items_json as PresupuestoItem[]) ?? [];

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text(taller?.nombre ?? 'Taller', { align: 'center' });
    doc.fontSize(9).font('Helvetica').text(
      [taller?.direccion, taller?.telefono, taller?.rut].filter(Boolean).join(' | '),
      { align: 'center' },
    );
    doc.moveDown(1.5);

    // Title
    doc.fontSize(14).font('Helvetica-Bold').text(`Presupuesto ${presupuesto.numero}`, { align: 'center' });
    doc.moveDown(0.5);

    // Info grid
    doc.fontSize(10).font('Helvetica');
    const infoY = doc.y;
    doc.text(`Cliente: ${cliente?.nombre ?? '-'}`, 50, infoY);
    doc.text(`RUT: ${cliente?.rut ?? '-'}`, 50, infoY + 15);
    doc.text(`Vehículo: ${vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.patente}` : '-'}`, 300, infoY);
    doc.text(`O.T.: ${ot?.numero_ot ?? '-'}`, 300, infoY + 15);
    doc.text(`Fecha: ${new Date(presupuesto.created_at).toLocaleDateString('es-CL')}`, 300, infoY + 30);
    doc.moveDown(3);

    // Items table
    const tableTop = doc.y;
    const colX = { desc: 50, cant: 300, precio: 360, desc2: 420, sub: 480 };

    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Descripción', colX.desc, tableTop);
    doc.text('Cant.', colX.cant, tableTop, { width: 50, align: 'right' });
    doc.text('P. Unit.', colX.precio, tableTop, { width: 55, align: 'right' });
    doc.text('Desc.%', colX.desc2, tableTop, { width: 50, align: 'right' });
    doc.text('Subtotal', colX.sub, tableTop, { width: 65, align: 'right' });

    doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).stroke();

    doc.font('Helvetica').fontSize(9);
    let y = tableTop + 20;
    for (const item of items) {
      doc.text(item.descripcion ?? '', colX.desc, y, { width: 245 });
      doc.text(String(item.cantidad ?? 0), colX.cant, y, { width: 50, align: 'right' });
      doc.text(this.formatCLP(item.precio_unit), colX.precio, y, { width: 55, align: 'right' });
      doc.text(`${item.descuento ?? 0}%`, colX.desc2, y, { width: 50, align: 'right' });
      doc.text(this.formatCLP(item.subtotal), colX.sub, y, { width: 65, align: 'right' });
      y += 18;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    }

    // Totals
    doc.moveTo(380, y + 5).lineTo(545, y + 5).stroke();
    y += 12;
    doc.font('Helvetica').fontSize(10);
    doc.text('Subtotal:', 380, y, { width: 95, align: 'right' });
    doc.text(this.formatCLP(Number(presupuesto.subtotal)), colX.sub, y, { width: 65, align: 'right' });
    y += 16;
    doc.text('IVA (19%):', 380, y, { width: 95, align: 'right' });
    doc.text(this.formatCLP(Number(presupuesto.iva)), colX.sub, y, { width: 65, align: 'right' });
    y += 16;
    doc.font('Helvetica-Bold');
    doc.text('TOTAL:', 380, y, { width: 95, align: 'right' });
    doc.text(this.formatCLP(Number(presupuesto.total)), colX.sub, y, { width: 65, align: 'right' });

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  async generarFacturaPdf(facturaId: number, tallerId: number): Promise<Buffer> {
    const factura = await this.facturaRepo.findOne({
      where: { id: facturaId, taller_id: tallerId },
      relations: ['orden_trabajo', 'orden_trabajo.cliente', 'orden_trabajo.vehiculo', 'orden_trabajo.detalles'],
    });
    if (!factura) throw new Error('Factura no encontrada');

    const taller = await this.tallerRepo.findOneBy({ id: tallerId });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    const ot = factura.orden_trabajo;
    const cliente = ot?.cliente;
    const vehiculo = ot?.vehiculo;
    const detalles = ot?.detalles ?? [];
    const tipoDteLabel = factura.tipo_dte === 'boleta' ? 'BOLETA ELECTRÓNICA' : factura.tipo_dte === 'factura' ? 'FACTURA ELECTRÓNICA' : 'NOTA DE CRÉDITO';

    // ── Header: taller info ──
    doc.fontSize(20).font('Helvetica-Bold').text(taller?.nombre ?? 'Taller', 50, 50);
    doc.fontSize(9).font('Helvetica').fillColor('#555');
    let headerY = 75;
    if (taller?.direccion) { doc.text(taller.direccion, 50, headerY); headerY += 12; }
    if (taller?.telefono) { doc.text(`Tel: ${taller.telefono}`, 50, headerY); headerY += 12; }
    if (taller?.rut) { doc.text(`RUT: ${taller.rut}`, 50, headerY); headerY += 12; }

    // ── DTE Box (right side) ──
    const boxX = 360; const boxY = 45; const boxW = 185; const boxH = 60;
    doc.lineWidth(2).strokeColor('#dc2626').rect(boxX, boxY, boxW, boxH).stroke();
    doc.fillColor('#dc2626').fontSize(11).font('Helvetica-Bold')
      .text(tipoDteLabel, boxX, boxY + 12, { width: boxW, align: 'center' });
    doc.fontSize(13)
      .text(`N° ${factura.numero_dte}`, boxX, boxY + 28, { width: boxW, align: 'center' });
    doc.fillColor('#555').fontSize(9).font('Helvetica')
      .text(`Fecha: ${new Date(factura.created_at).toLocaleDateString('es-CL')}`, boxX, boxY + 46, { width: boxW, align: 'center' });

    // ── Horizontal line ──
    const lineY = Math.max(headerY + 8, boxY + boxH + 12);
    doc.moveTo(50, lineY).lineTo(545, lineY).lineWidth(0.5).strokeColor('#ccc').stroke();

    // ── Client & vehicle info ──
    doc.fillColor('#000');
    let iy = lineY + 12;
    doc.fontSize(11).font('Helvetica-Bold').text('DATOS DEL CLIENTE', 50, iy);
    iy += 18;
    doc.fontSize(9).font('Helvetica');
    doc.text(`Nombre: ${cliente?.nombre ?? '-'}`, 50, iy);
    doc.text(`O.T.: ${ot?.numero_ot ?? '-'}`, 300, iy);
    iy += 14;
    doc.text(`RUT: ${cliente?.rut ?? factura.rut_receptor ?? '-'}`, 50, iy);
    doc.text(`Servicio: ${ot?.tipo_servicio ?? '-'}`, 300, iy);
    iy += 14;
    doc.text(`Email: ${cliente?.email ?? '-'}`, 50, iy);
    doc.text(`Vehículo: ${vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : '-'}`, 300, iy);
    iy += 14;
    doc.text(`Teléfono: ${cliente?.telefono ?? '-'}`, 50, iy);
    doc.text(`Patente: ${vehiculo?.patente ?? '-'}`, 300, iy);
    iy += 14;
    doc.text(`Dirección: ${cliente?.direccion ?? '-'}`, 50, iy);
    if (vehiculo?.anio) doc.text(`Año: ${vehiculo.anio}`, 300, iy);
    iy += 20;

    // ── Items table ──
    doc.moveTo(50, iy).lineTo(545, iy).strokeColor('#333').lineWidth(0.5).stroke();
    iy += 6;
    const colX = { desc: 50, cant: 320, precio: 380, sub: 470 };

    // Table header with background
    doc.rect(50, iy - 2, 495, 16).fill('#f3f4f6');
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(9);
    doc.text('Descripción', colX.desc + 4, iy);
    doc.text('Cant.', colX.cant, iy, { width: 50, align: 'right' });
    doc.text('P. Unit.', colX.precio, iy, { width: 80, align: 'right' });
    doc.text('Subtotal', colX.sub, iy, { width: 75, align: 'right' });
    iy += 18;
    doc.moveTo(50, iy).lineTo(545, iy).strokeColor('#ccc').stroke();

    doc.font('Helvetica').fontSize(9);
    let rowIdx = 0;
    for (const d of detalles) {
      if (rowIdx % 2 === 1) {
        doc.rect(50, iy, 495, 16).fill('#fafafa');
        doc.fillColor('#000');
      }
      doc.text(d.descripcion ?? '', colX.desc + 4, iy + 3, { width: 265 });
      doc.text(String(d.cantidad ?? 0), colX.cant, iy + 3, { width: 50, align: 'right' });
      doc.text(this.formatCLP(Number(d.precio_unit)), colX.precio, iy + 3, { width: 80, align: 'right' });
      doc.text(this.formatCLP(Number(d.subtotal)), colX.sub, iy + 3, { width: 75, align: 'right' });
      iy += 18;
      rowIdx++;
      if (iy > 700) {
        doc.addPage();
        iy = 50;
      }
    }

    // ── Totals ──
    doc.moveTo(360, iy + 5).lineTo(545, iy + 5).strokeColor('#333').stroke();
    iy += 14;
    doc.font('Helvetica').fontSize(10);
    doc.text('Neto:', 360, iy, { width: 105, align: 'right' });
    doc.text(this.formatCLP(Number(factura.monto_neto)), colX.sub, iy, { width: 75, align: 'right' });
    iy += 16;
    doc.text('IVA (19%):', 360, iy, { width: 105, align: 'right' });
    doc.text(this.formatCLP(Number(factura.iva)), colX.sub, iy, { width: 75, align: 'right' });
    iy += 18;
    doc.rect(360, iy - 4, 185, 22).fill('#1e40af');
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(12);
    doc.text('TOTAL:', 360, iy, { width: 105, align: 'right' });
    doc.text(this.formatCLP(Number(factura.monto_total)), colX.sub, iy, { width: 75, align: 'right' });
    doc.fillColor('#000');

    // ── Footer ──
    const footerY = 760;
    doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#ccc').lineWidth(0.5).stroke();
    doc.font('Helvetica').fontSize(7).fillColor('#888')
      .text('Documento tributario electrónico generado por Roadix — Sistema de Gestión de Taller Mecánico', 50, footerY + 6, { align: 'center', width: 495 });

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  private formatCLP(value: number): string {
    return `$${(value ?? 0).toLocaleString('es-CL')}`;
  }
}
