import { Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service.js';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('admin/seed-missing')
  async seedMissing(@Query('key') key: string) {
    if (key !== 'roadix2026seed') return { error: 'unauthorized' };
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    const results: string[] = [];

    try {
      const tallerId = 1;

      // ═══ 1. PLANES ═══
      const existingPlans = await qr.query(`SELECT COUNT(*) as c FROM plan`);
      if (Number(existingPlans[0].c) === 0) {
        const plans = [
          ['admin', 0, 0, 999999, 999999, 999999, 999999, true, true, true, true, true],
          ['free', 0, 0, 2, 5, 50, 500, false, false, false, false, false],
          ['starter', 29990, 305898, 5, 200, 500, 5000, true, false, true, false, false],
          ['pro', 59990, 611898, 15, 999999, 999999, 50000, true, true, true, true, false],
          ['enterprise', 0, 0, 999999, 999999, 999999, 999999, true, true, true, true, true],
        ];
        for (const p of plans) {
          await qr.query(
            `INSERT INTO plan (nombre, precio_mensual, precio_anual, max_usuarios, max_ots_mes, max_vehiculos, max_storage_mb, tiene_facturacion, tiene_whatsapp, tiene_portal, tiene_reportes, tiene_api)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (nombre) DO NOTHING`,
            p,
          );
        }
        results.push('Plans: 5 created');
      } else {
        results.push('Plans: already exist');
      }

      // ═══ 2. SUSCRIPCION for taller 1 ═══
      const existingSub = await qr.query(`SELECT COUNT(*) as c FROM suscripcion WHERE taller_id=$1`, [tallerId]);
      if (Number(existingSub[0].c) === 0) {
        const proPlan = await qr.query(`SELECT id FROM plan WHERE nombre='pro'`);
        if (proPlan.length > 0) {
          await qr.query(
            `INSERT INTO suscripcion (taller_id, plan_id, periodo, estado, fecha_inicio, fecha_fin, proximo_cobro, metodo_pago, monto_pagado, descuento_pct, auto_renovar)
             VALUES ($1, $2, 'mensual', 'activa', '2026-01-15', '2027-01-15', '2026-05-01', 'transferencia', 59990, 0, true)`,
            [tallerId, proPlan[0].id],
          );
          // Add subscription payment history
          const sub = await qr.query(`SELECT id FROM suscripcion WHERE taller_id=$1`, [tallerId]);
          const subId = sub[0].id;
          const pagos = [
            ['2026-01-15', '2026-01-15', '2026-02-15', 59990, 'transferencia', 'TRX-SUB-001', 'exitoso'],
            ['2026-02-15', '2026-02-15', '2026-03-15', 59990, 'transferencia', 'TRX-SUB-002', 'exitoso'],
            ['2026-03-15', '2026-03-15', '2026-04-15', 59990, 'transferencia', 'TRX-SUB-003', 'exitoso'],
          ];
          for (const pg of pagos) {
            await qr.query(
              `INSERT INTO historial_pago_suscripcion (suscripcion_id, fecha_pago, periodo_desde, periodo_hasta, monto, metodo_pago, referencia, estado)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
              [subId, pg[0], pg[1], pg[2], pg[3], pg[4], pg[5], pg[6]],
            );
          }
          results.push('Subscription: created with 3 payments');
        }
      } else {
        results.push('Subscription: already exists');
      }

      // ═══ 3. HISTORIAL EMAIL ═══
      const existingEmails = await qr.query(`SELECT COUNT(*) as c FROM historial_email WHERE taller_id=$1`, [tallerId]);
      if (Number(existingEmails[0].c) === 0) {
        const clientes = await qr.query(`SELECT id, nombre, email FROM cliente WHERE taller_id=$1 ORDER BY id`, [tallerId]);
        const emails = [
          ['presupuesto', clientes[0]?.email || 'cliente1@mail.com', 'Presupuesto OT-2026-001 - Cambio de frenos Toyota Corolla', 'entregado', '2026-03-01T09:30:00', 'presupuesto_ot'],
          ['ot_finalizada', clientes[1]?.email || 'cliente2@mail.com', 'Su vehículo está listo para retiro - Hyundai Tucson', 'abierto', '2026-03-02T14:15:00', 'ot_finalizada'],
          ['factura', clientes[2]?.email || 'cliente3@mail.com', 'Factura DTE-00000001 - Servicio de mantención', 'entregado', '2026-03-03T10:00:00', 'factura_email'],
          ['presupuesto', clientes[3]?.email || 'cliente4@mail.com', 'Presupuesto OT-2026-004 - Reparación motor Kia Morning', 'enviado', '2026-03-04T11:45:00', 'presupuesto_ot'],
          ['recordatorio', clientes[0]?.email || 'cliente1@mail.com', 'Recordatorio: Revisión técnica próxima - Toyota Corolla', 'entregado', '2026-03-05T09:00:00', 'recordatorio_rev_tecnica'],
          ['ot_finalizada', clientes[4]?.email || 'cliente5@mail.com', 'Su Mazda 3 está listo para retiro', 'abierto', '2026-03-06T08:20:00', 'ot_finalizada'],
          ['presupuesto', clientes[5]?.email || 'cliente6@mail.com', 'Presupuesto OT-2026-006 - Cambio correa distribución', 'entregado', '2026-03-07T09:10:00', 'presupuesto_ot'],
          ['factura', clientes[1]?.email || 'cliente2@mail.com', 'Factura DTE-00000002 - Reparación suspensión', 'entregado', '2026-03-08T14:00:00', 'factura_email'],
          ['recordatorio', clientes[6]?.email || 'cliente7@mail.com', 'Recordatorio: SOAP vence en 15 días', 'enviado', '2026-03-10T09:00:00', 'recordatorio_soap'],
          ['ot_finalizada', clientes[7]?.email || 'cliente8@mail.com', 'Su Nissan Kicks está en control de calidad', 'entregado', '2026-03-12T10:30:00', 'ot_finalizada'],
          ['bienvenida', clientes[8]?.email || 'cliente9@mail.com', 'Bienvenido a Taller Demo Roadix', 'entregado', '2026-02-20T10:00:00', 'bienvenida_cliente'],
          ['presupuesto', clientes[9]?.email || 'cliente10@mail.com', 'Presupuesto OT-2026-010 - Diagnóstico electrónico', 'abierto', '2026-03-15T11:20:00', 'presupuesto_ot'],
          ['rev_tecnica', clientes[2]?.email || 'cliente3@mail.com', 'Revisión técnica vence en 30 días - Mercedes Sprinter', 'entregado', '2026-03-18T09:00:00', 'recordatorio_rev_tecnica'],
          ['ot_finalizada', clientes[10]?.email || 'cliente11@mail.com', 'Su Ford Ranger está listo para retiro', 'abierto', '2026-03-20T15:45:00', 'ot_finalizada'],
          ['factura', clientes[4]?.email || 'cliente5@mail.com', 'Factura DTE-00000003 - Servicio completo Mazda 3', 'entregado', '2026-03-22T10:00:00', 'factura_email'],
          ['recordatorio', clientes[11]?.email || 'cliente12@mail.com', 'Recordatorio: Mantención 40.000 km próxima', 'enviado', '2026-03-25T09:00:00', 'recordatorio_mantencion'],
          ['presupuesto', clientes[12]?.email || 'cliente13@mail.com', 'Presupuesto OT-2026-012 - Pintura y desabolladura', 'entregado', '2026-03-28T14:10:00', 'presupuesto_ot'],
          ['ot_finalizada', clientes[3]?.email || 'cliente4@mail.com', 'Su Kia Morning fue entregado exitosamente', 'entregado', '2026-03-30T09:50:00', 'ot_finalizada'],
          ['marketing', 'contacto@empresa.cl', 'Promoción Abril: 20% descuento en mantenciones', 'enviado', '2026-04-01T08:00:00', 'marketing_promo'],
          ['recordatorio', clientes[0]?.email || 'cliente1@mail.com', 'Recordatorio: Permiso de circulación vence pronto', 'entregado', '2026-04-02T09:00:00', 'recordatorio_permiso'],
        ];
        for (const e of emails) {
          await qr.query(
            `INSERT INTO historial_email (taller_id, tipo, destinatario, asunto, estado, created_at, template_usado)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [tallerId, e[0], e[1], e[2], e[3], e[4], e[5]],
          );
        }
        results.push(`Emails: ${emails.length} created`);
      } else {
        results.push('Emails: already exist');
      }

      // ═══ 4. RECORDATORIOS ═══
      const existingRecs = await qr.query(`SELECT COUNT(*) as c FROM recordatorio WHERE taller_id=$1`, [tallerId]);
      if (Number(existingRecs[0].c) === 0) {
        const vehiculos = await qr.query(`SELECT v.id, v.patente, v.cliente_id FROM vehiculo v WHERE v.taller_id=$1 ORDER BY v.id`, [tallerId]);
        const recs = [
          [vehiculos[0]?.cliente_id, vehiculos[0]?.id, 'rev_tecnica', `Revisión técnica vence en 15 días - ${vehiculos[0]?.patente}`, '2026-04-18T09:00:00', 'email', 'pendiente', null],
          [vehiculos[1]?.cliente_id, vehiculos[1]?.id, 'soap', `SOAP vence en 10 días - ${vehiculos[1]?.patente}`, '2026-04-13T09:00:00', 'email', 'pendiente', null],
          [vehiculos[2]?.cliente_id, vehiculos[2]?.id, 'mantencion', `Mantención 50.000 km programada - ${vehiculos[2]?.patente}`, '2026-04-10T09:00:00', 'ambos', 'pendiente', null],
          [vehiculos[3]?.cliente_id, vehiculos[3]?.id, 'seguimiento', `¿Cómo quedó su vehículo después de la reparación? - ${vehiculos[3]?.patente}`, '2026-03-25T09:00:00', 'email', 'enviado', '2026-03-25T09:05:00'],
          [vehiculos[4]?.cliente_id, vehiculos[4]?.id, 'rev_tecnica', `Revisión técnica vence en 30 días - ${vehiculos[4]?.patente}`, '2026-03-20T09:00:00', 'email', 'enviado', '2026-03-20T09:03:00'],
          [vehiculos[5]?.cliente_id, vehiculos[5]?.id, 'permiso_circ', `Permiso de circulación por vencer - ${vehiculos[5]?.patente}`, '2026-03-15T09:00:00', 'ambos', 'enviado', '2026-03-15T09:02:00'],
          [vehiculos[6]?.cliente_id, vehiculos[6]?.id, 'soap', `SOAP por vencer - ${vehiculos[6]?.patente}`, '2026-03-10T09:00:00', 'email', 'enviado', '2026-03-10T09:01:00'],
          [vehiculos[7]?.cliente_id, vehiculos[7]?.id, 'mantencion', `Mantención 80.000 km recomendada - ${vehiculos[7]?.patente}`, '2026-03-05T09:00:00', 'wsp', 'enviado', '2026-03-05T09:04:00'],
          [vehiculos[8]?.cliente_id, vehiculos[8]?.id, 'seguimiento', `Seguimiento post-servicio - ${vehiculos[8]?.patente}`, '2026-03-01T09:00:00', 'email', 'fallido', null],
          [vehiculos[9]?.cliente_id, vehiculos[9]?.id, 'rev_tecnica', `Revisión técnica próxima - ${vehiculos[9]?.patente}`, '2026-04-25T09:00:00', 'email', 'pendiente', null],
          [vehiculos[10]?.cliente_id, vehiculos[10]?.id, 'mantencion', `Mantención preventiva recomendada - ${vehiculos[10]?.patente}`, '2026-04-20T09:00:00', 'ambos', 'pendiente', null],
          [vehiculos[11]?.cliente_id, vehiculos[11]?.id, 'soap', `SOAP vence próximamente - ${vehiculos[11]?.patente}`, '2026-04-15T09:00:00', 'email', 'pendiente', null],
        ];
        for (const r of recs) {
          await qr.query(
            `INSERT INTO recordatorio (taller_id, cliente_id, vehiculo_id, tipo, mensaje, fecha_envio, canal, estado, enviado_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [tallerId, r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]],
          );
        }
        results.push(`Recordatorios: ${recs.length} created`);
      } else {
        results.push('Recordatorios: already exist');
      }

      // ═══ 5. PRESUPUESTOS for some OTs ═══
      const existingPres = await qr.query(`SELECT COUNT(*) as c FROM presupuesto WHERE taller_id=$1`, [tallerId]);
      if (Number(existingPres[0].c) === 0) {
        const ots = await qr.query(`SELECT id, numero_ot, subtotal, total, estado FROM orden_trabajo WHERE taller_id=$1 ORDER BY id`, [tallerId]);
        let presNum = 1;
        for (const ot of ots.slice(0, 8)) {
          const numero = `PRES-${String(presNum).padStart(6, '0')}`;
          const items = [
            { tipo: 'servicio', descripcion: 'Mano de obra', cantidad: 1, precio_unit: Math.round(Number(ot.subtotal) * 0.4) },
            { tipo: 'repuesto', descripcion: 'Repuestos varios', cantidad: 1, precio_unit: Math.round(Number(ot.subtotal) * 0.6) },
          ];
          const subtotal = Number(ot.subtotal);
          const iva = Math.round(subtotal * 0.19);
          const total = subtotal + iva;
          const estadoMap: Record<string, string> = {
            recepcion: 'borrador', diagnostico: 'borrador', presupuesto: 'enviado',
            esperando_aprobacion: 'enviado', en_reparacion: 'aprobado', control_calidad: 'aprobado',
            listo: 'aprobado', entregado: 'aprobado', facturado: 'aprobado',
          };
          const estado = estadoMap[ot.estado] || 'borrador';
          const aprobadoAt = estado === 'aprobado' ? '2026-03-15T10:00:00' : null;
          await qr.query(
            `INSERT INTO presupuesto (ot_id, taller_id, numero, estado, items_json, subtotal, iva, total, enviado_email, enviado_wsp, aprobado_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [ot.id, tallerId, numero, estado, JSON.stringify(items), subtotal, iva, total,
             estado !== 'borrador', false, aprobadoAt],
          );
          presNum++;
        }
        results.push(`Presupuestos: ${presNum - 1} created`);
      } else {
        results.push('Presupuestos: already exist');
      }

      // ═══ 6. Ensure OTs have mecánicos assigned (for efficiency reports) ═══
      const mecanicos = await qr.query(`SELECT id FROM mecanico WHERE taller_id=$1 ORDER BY id`, [tallerId]);
      if (mecanicos.length > 0) {
        const otsNoMec = await qr.query(
          `SELECT id FROM orden_trabajo WHERE taller_id=$1 AND mecanico_id IS NULL ORDER BY id`,
          [tallerId],
        );
        let updated = 0;
        for (let i = 0; i < otsNoMec.length; i++) {
          const mecId = mecanicos[i % mecanicos.length].id;
          await qr.query(`UPDATE orden_trabajo SET mecanico_id=$1 WHERE id=$2`, [mecId, otsNoMec[i].id]);
          updated++;
        }
        results.push(`OTs mecánico assigned: ${updated}`);
      }

      // ═══ 7. Ensure some OTs have recent created_at dates (for reporting date ranges) ═══
      const ots = await qr.query(`SELECT id FROM orden_trabajo WHERE taller_id=$1 ORDER BY id`, [tallerId]);
      const dates = [
        '2026-03-05T08:30:00', '2026-03-08T09:15:00', '2026-03-12T10:00:00',
        '2026-03-15T11:30:00', '2026-03-18T14:00:00', '2026-03-20T09:45:00',
        '2026-03-22T13:20:00', '2026-03-25T08:00:00', '2026-03-28T15:30:00',
        '2026-03-30T10:10:00', '2026-04-01T09:00:00', '2026-04-03T08:45:00',
      ];
      for (let i = 0; i < Math.min(ots.length, dates.length); i++) {
        await qr.query(
          `UPDATE orden_trabajo SET fecha_ingreso=$1, created_at=$2 WHERE id=$3`,
          [dates[i], dates[i], ots[i].id],
        );
      }
      results.push(`OTs dates spread: ${Math.min(ots.length, dates.length)} updated`);

      // ═══ 8. Spread caja payments over March (not just today) ═══
      const pagosExist = await qr.query(`SELECT id FROM pago WHERE taller_id=$1 ORDER BY id`, [tallerId]);
      const pagoFechas = [
        '2026-03-10T10:30:00', '2026-03-15T14:20:00',
        '2026-03-22T09:45:00', '2026-04-03T11:00:00',
      ];
      for (let i = 0; i < Math.min(pagosExist.length, pagoFechas.length); i++) {
        await qr.query(`UPDATE pago SET fecha_pago=$1 WHERE id=$2`, [pagoFechas[i], pagosExist[i].id]);
      }
      results.push(`Pagos dates spread: ${Math.min(pagosExist.length, pagoFechas.length)} updated`);

      await qr.commitTransaction();
      return { ok: true, results };
    } catch (err) {
      await qr.rollbackTransaction();
      return { ok: false, error: String(err), results };
    } finally {
      await qr.release();
    }
  }
}
