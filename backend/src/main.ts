import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DataSource } from 'typeorm';

async function seedMissingData(dataSource: DataSource) {
  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();
  try {
    const tallerId = 1;

    // 1. PLANES
    const pc = await qr.query(`SELECT COUNT(*)::int as c FROM plan`);
    if (pc[0].c === 0) {
      const plans = [
        ['admin', 0, 0, 999999, 999999, 999999, 999999, true, true, true, true, true],
        ['free', 0, 0, 2, 5, 50, 500, false, false, false, false, false],
        ['starter', 29990, 305898, 5, 200, 500, 5000, true, false, true, false, false],
        ['pro', 59990, 611898, 15, 999999, 999999, 50000, true, true, true, true, false],
        ['enterprise', 0, 0, 999999, 999999, 999999, 999999, true, true, true, true, true],
      ];
      for (const p of plans) {
        await qr.query(
          `INSERT INTO plan (nombre,precio_mensual,precio_anual,max_usuarios,max_ots_mes,max_vehiculos,max_storage_mb,tiene_facturacion,tiene_whatsapp,tiene_portal,tiene_reportes,tiene_api) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (nombre) DO NOTHING`, p);
      }
      console.log('[SEED] Plans: 5 created');
    }

    // 2. SUSCRIPCION
    const sc = await qr.query(`SELECT COUNT(*)::int as c FROM suscripcion WHERE taller_id=$1`, [tallerId]);
    if (sc[0].c === 0) {
      const pp = await qr.query(`SELECT id FROM plan WHERE nombre='pro'`);
      if (pp.length > 0) {
        await qr.query(
          `INSERT INTO suscripcion (taller_id,plan_id,periodo,estado,fecha_inicio,fecha_fin,proximo_cobro,metodo_pago,monto_pagado,descuento_pct,auto_renovar) VALUES ($1,$2,'mensual','activa','2026-01-15','2027-01-15','2026-05-01','transferencia',59990,0,true)`, [tallerId, pp[0].id]);
        const sub = await qr.query(`SELECT id FROM suscripcion WHERE taller_id=$1`, [tallerId]);
        const subId = sub[0].id;
        const pagos = [
          ['2026-01-15','2026-01-15','2026-02-15',59990,'transferencia','TRX-SUB-001','exitoso'],
          ['2026-02-15','2026-02-15','2026-03-15',59990,'transferencia','TRX-SUB-002','exitoso'],
          ['2026-03-15','2026-03-15','2026-04-15',59990,'transferencia','TRX-SUB-003','exitoso'],
        ];
        for (const pg of pagos) {
          await qr.query(`INSERT INTO historial_pago_suscripcion (suscripcion_id,fecha_pago,periodo_desde,periodo_hasta,monto,metodo_pago,referencia,estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [subId,...pg]);
        }
        console.log('[SEED] Subscription: created with 3 payments');
      }
    }

    // 3. HISTORIAL EMAIL
    const ec = await qr.query(`SELECT COUNT(*)::int as c FROM historial_email WHERE taller_id=$1`, [tallerId]);
    if (ec[0].c === 0) {
      const cl = await qr.query(`SELECT id,nombre,email FROM cliente WHERE taller_id=$1 ORDER BY id`, [tallerId]);
      if (cl.length > 0) {
        const emails: [string,string,string,string,string,string][] = [
          ['presupuesto', cl[0]?.email, 'Presupuesto OT-2026-001 - Cambio de frenos Toyota Corolla', 'entregado', '2026-03-01T09:30:00', 'presupuesto_ot'],
          ['ot_finalizada', cl[1]?.email, 'Su vehículo está listo para retiro - Hyundai Tucson', 'abierto', '2026-03-02T14:15:00', 'ot_finalizada'],
          ['factura', cl[2]?.email, 'Factura DTE-00000001 - Servicio de mantención', 'entregado', '2026-03-03T10:00:00', 'factura_email'],
          ['presupuesto', cl[3]?.email, 'Presupuesto OT-2026-004 - Reparación motor', 'enviado', '2026-03-04T11:45:00', 'presupuesto_ot'],
          ['recordatorio', cl[0]?.email, 'Recordatorio: Revisión técnica próxima', 'entregado', '2026-03-05T09:00:00', 'recordatorio_rev_tecnica'],
          ['ot_finalizada', cl[4]?.email, 'Su Mazda 3 está listo para retiro', 'abierto', '2026-03-06T08:20:00', 'ot_finalizada'],
          ['presupuesto', cl[5]?.email, 'Presupuesto OT-2026-006 - Correa distribución', 'entregado', '2026-03-07T09:10:00', 'presupuesto_ot'],
          ['factura', cl[1]?.email, 'Factura DTE-00000002 - Reparación suspensión', 'entregado', '2026-03-08T14:00:00', 'factura_email'],
          ['recordatorio', cl[6]?.email, 'Recordatorio: SOAP vence en 15 días', 'enviado', '2026-03-10T09:00:00', 'recordatorio_soap'],
          ['ot_finalizada', cl[7]?.email, 'Su Nissan Kicks en control de calidad', 'entregado', '2026-03-12T10:30:00', 'ot_finalizada'],
          ['bienvenida', cl[8]?.email, 'Bienvenido a Taller Demo Roadix', 'entregado', '2026-02-20T10:00:00', 'bienvenida_cliente'],
          ['presupuesto', cl[9]?.email, 'Presupuesto OT-2026-010 - Diagnóstico', 'abierto', '2026-03-15T11:20:00', 'presupuesto_ot'],
          ['rev_tecnica', cl[2]?.email, 'Revisión técnica vence - Mercedes Sprinter', 'entregado', '2026-03-18T09:00:00', 'recordatorio_rev_tecnica'],
          ['ot_finalizada', cl[10]?.email, 'Su Ford Ranger está listo', 'abierto', '2026-03-20T15:45:00', 'ot_finalizada'],
          ['factura', cl[4]?.email, 'Factura DTE-00000003 - Servicio Mazda 3', 'entregado', '2026-03-22T10:00:00', 'factura_email'],
          ['recordatorio', cl[11]?.email, 'Recordatorio: Mantención 40.000 km', 'enviado', '2026-03-25T09:00:00', 'recordatorio_mantencion'],
          ['presupuesto', cl[12]?.email, 'Presupuesto OT-2026-012 - Pintura', 'entregado', '2026-03-28T14:10:00', 'presupuesto_ot'],
          ['ot_finalizada', cl[3]?.email, 'Su Kia Morning fue entregado', 'entregado', '2026-03-30T09:50:00', 'ot_finalizada'],
          ['marketing', 'contacto@empresa.cl', 'Promoción Abril: 20% dto mantenciones', 'enviado', '2026-04-01T08:00:00', 'marketing_promo'],
          ['recordatorio', cl[0]?.email, 'Recordatorio: Permiso circulación vence', 'entregado', '2026-04-02T09:00:00', 'recordatorio_permiso'],
        ];
        for (const e of emails) {
          await qr.query(`INSERT INTO historial_email (taller_id,tipo,destinatario,asunto,estado,created_at,template_usado) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [tallerId,...e]);
        }
        console.log(`[SEED] Emails: ${emails.length} created`);
      }
    }

    // 4. RECORDATORIOS
    const rc = await qr.query(`SELECT COUNT(*)::int as c FROM recordatorio WHERE taller_id=$1`, [tallerId]);
    if (rc[0].c === 0) {
      const vh = await qr.query(`SELECT id,patente,cliente_id FROM vehiculo WHERE taller_id=$1 ORDER BY id`, [tallerId]);
      if (vh.length >= 12) {
        const recs: (string|number|null)[][] = [
          [vh[0].cliente_id, vh[0].id, 'rev_tecnica', 'Revisión técnica vence en 15 días - '+vh[0].patente, '2026-04-18T09:00:00', 'email', 'pendiente', null],
          [vh[1].cliente_id, vh[1].id, 'soap', 'SOAP vence en 10 días - '+vh[1].patente, '2026-04-13T09:00:00', 'email', 'pendiente', null],
          [vh[2].cliente_id, vh[2].id, 'mantencion', 'Mantención 50.000 km - '+vh[2].patente, '2026-04-10T09:00:00', 'ambos', 'pendiente', null],
          [vh[3].cliente_id, vh[3].id, 'seguimiento', 'Seguimiento post-reparación - '+vh[3].patente, '2026-03-25T09:00:00', 'email', 'enviado', '2026-03-25T09:05:00'],
          [vh[4].cliente_id, vh[4].id, 'rev_tecnica', 'Rev. técnica vence en 30 días - '+vh[4].patente, '2026-03-20T09:00:00', 'email', 'enviado', '2026-03-20T09:03:00'],
          [vh[5].cliente_id, vh[5].id, 'permiso_circulacion', 'Permiso de circulación por vencer - '+vh[5].patente, '2026-03-15T09:00:00', 'ambos', 'enviado', '2026-03-15T09:02:00'],
          [vh[6].cliente_id, vh[6].id, 'soap', 'SOAP por vencer - '+vh[6].patente, '2026-03-10T09:00:00', 'email', 'enviado', '2026-03-10T09:01:00'],
          [vh[7].cliente_id, vh[7].id, 'mantencion', 'Mantención 80.000 km recomendada - '+vh[7].patente, '2026-03-05T09:00:00', 'wsp', 'enviado', '2026-03-05T09:04:00'],
          [vh[8].cliente_id, vh[8].id, 'seguimiento', 'Seguimiento post-servicio - '+vh[8].patente, '2026-03-01T09:00:00', 'email', 'fallido', null],
          [vh[9].cliente_id, vh[9].id, 'rev_tecnica', 'Revisión técnica próxima - '+vh[9].patente, '2026-04-25T09:00:00', 'email', 'pendiente', null],
          [vh[10].cliente_id, vh[10].id, 'mantencion', 'Mantención preventiva - '+vh[10].patente, '2026-04-20T09:00:00', 'ambos', 'pendiente', null],
          [vh[11].cliente_id, vh[11].id, 'soap', 'SOAP vence próximamente - '+vh[11].patente, '2026-04-15T09:00:00', 'email', 'pendiente', null],
        ];
        for (const r of recs) {
          await qr.query(`INSERT INTO recordatorio (taller_id,cliente_id,vehiculo_id,tipo,mensaje,fecha_envio,canal,estado,enviado_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [tallerId,...r]);
        }
        console.log(`[SEED] Recordatorios: ${recs.length} created`);
      }
    }

    // 5. PRESUPUESTOS
    const presc = await qr.query(`SELECT COUNT(*)::int as c FROM presupuesto WHERE taller_id=$1`, [tallerId]);
    if (presc[0].c === 0) {
      const ots = await qr.query(`SELECT id,numero_ot,subtotal,total,estado FROM orden_trabajo WHERE taller_id=$1 ORDER BY id`, [tallerId]);
      let pn = 1;
      for (const ot of ots.slice(0, 8)) {
        const numero = 'PRES-' + String(pn).padStart(6, '0');
        const items = [
          { tipo: 'servicio', descripcion: 'Mano de obra', cantidad: 1, precio_unit: Math.round(Number(ot.subtotal)*0.4) },
          { tipo: 'repuesto', descripcion: 'Repuestos utilizados', cantidad: 1, precio_unit: Math.round(Number(ot.subtotal)*0.6) },
        ];
        const subtotal = Number(ot.subtotal);
        const iva = Math.round(subtotal * 0.19);
        const total = subtotal + iva;
        const em: Record<string,string> = { recepcion:'borrador', diagnostico:'borrador', presupuesto:'enviado', esperando_aprobacion:'enviado', en_reparacion:'aprobado', control_calidad:'aprobado', listo:'aprobado', entregado:'aprobado', facturado:'aprobado' };
        const estado = em[ot.estado] || 'borrador';
        const apAt = estado === 'aprobado' ? '2026-03-15T10:00:00' : null;
        await qr.query(`INSERT INTO presupuesto (ot_id,taller_id,numero,estado,items_json,subtotal,iva,total,enviado_email,enviado_wsp,aprobado_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [ot.id, tallerId, numero, estado, JSON.stringify(items), subtotal, iva, total, estado !== 'borrador', false, apAt]);
        pn++;
      }
      console.log(`[SEED] Presupuestos: ${pn-1} created`);
    }

    // 6. Assign mecánicos to OTs
    const mecs = await qr.query(`SELECT id FROM mecanico WHERE taller_id=$1 ORDER BY id`, [tallerId]);
    if (mecs.length > 0) {
      const noMec = await qr.query(`SELECT id FROM orden_trabajo WHERE taller_id=$1 AND mecanico_id IS NULL ORDER BY id`, [tallerId]);
      for (let i = 0; i < noMec.length; i++) {
        await qr.query(`UPDATE orden_trabajo SET mecanico_id=$1 WHERE id=$2`, [mecs[i%mecs.length].id, noMec[i].id]);
      }
      if (noMec.length > 0) console.log(`[SEED] OTs mecánico assigned: ${noMec.length}`);
    }

    // 7. Spread OT dates over March for reports
    const allOts = await qr.query(`SELECT id FROM orden_trabajo WHERE taller_id=$1 ORDER BY id`, [tallerId]);
    const dates = ['2026-03-05T08:30:00','2026-03-08T09:15:00','2026-03-12T10:00:00','2026-03-15T11:30:00','2026-03-18T14:00:00','2026-03-20T09:45:00','2026-03-22T13:20:00','2026-03-25T08:00:00','2026-03-28T15:30:00','2026-03-30T10:10:00','2026-04-01T09:00:00','2026-04-03T08:45:00'];
    for (let i = 0; i < Math.min(allOts.length, dates.length); i++) {
      await qr.query(`UPDATE orden_trabajo SET fecha_ingreso=$1, created_at=$2 WHERE id=$3`, [dates[i], dates[i], allOts[i].id]);
    }
    console.log(`[SEED] OT dates spread: ${Math.min(allOts.length, dates.length)}`);

    // 8. Spread caja payments over March
    const pagos = await qr.query(`SELECT id FROM pago WHERE taller_id=$1 ORDER BY id`, [tallerId]);
    const pDates = ['2026-03-10T10:30:00','2026-03-15T14:20:00','2026-03-22T09:45:00','2026-04-03T11:00:00'];
    for (let i = 0; i < Math.min(pagos.length, pDates.length); i++) {
      await qr.query(`UPDATE pago SET fecha_pago=$1 WHERE id=$2`, [pDates[i], pagos[i].id]);
    }
    console.log(`[SEED] Pagos dates spread: ${Math.min(pagos.length, pDates.length)}`);

    await qr.commitTransaction();
    console.log('[SEED] All missing data seeded successfully');
  } catch (err) {
    await qr.rollbackTransaction();
    console.error('[SEED] Error:', err);
  } finally {
    await qr.release();
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = (
    process.env.CORS_ORIGINS ??
    process.env.APP_URL ??
    'http://localhost:5173'
  )
    .split(',')
    .map((o) => o.trim());

  // Always allow the main domain variants
  for (const domain of ['https://roadix.cl', 'https://www.roadix.cl']) {
    if (!allowedOrigins.includes(domain)) allowedOrigins.push(domain);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Run one-time seed for missing demo data
  try {
    const ds = app.get(DataSource);
    await seedMissingData(ds);
  } catch (e) {
    console.error('[SEED] Skipped:', (e as Error).message);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
