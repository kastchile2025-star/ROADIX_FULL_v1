import dataSource from '../../config/data-source.js';

/**
 * Seed: demo data for Caja (pagos del día) and Notificaciones (historial_email + recordatorios).
 * Run:  npx tsc && node dist/database/seeds/caja-notif.seed.js
 */
async function seedCajaNotif() {
  await dataSource.initialize();
  console.log('Connected. Seeding Caja & Notificaciones data...');

  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    const tallerId = 1;

    // Get existing OTs with entregado/facturado status for pagos
    const existingOts: { id: number; total: string; numero_ot: string; cliente_id: number }[] = await qr.query(
      `SELECT id, total, numero_ot, cliente_id FROM orden_trabajo WHERE taller_id=$1 AND estado IN ('entregado','facturado') ORDER BY id`,
      [tallerId],
    );

    // Get all OTs for today's payments
    const allOts: { id: number; total: string; numero_ot: string }[] = await qr.query(
      `SELECT id, total, numero_ot FROM orden_trabajo WHERE taller_id=$1 ORDER BY id DESC LIMIT 20`,
      [tallerId],
    );

    // Get clientes
    const clientes: { id: number; nombre: string; email: string }[] = await qr.query(
      `SELECT id, nombre, email FROM cliente WHERE taller_id=$1 ORDER BY id`,
      [tallerId],
    );

    // Get vehiculos
    const vehiculos: { id: number; patente: string; cliente_id: number }[] = await qr.query(
      `SELECT id, patente, cliente_id FROM vehiculo WHERE taller_id=$1 ORDER BY id`,
      [tallerId],
    );

    // ═══════════════════════════════════════
    // ── CAJA: Pagos de hoy (08-03-2026) ──
    // ═══════════════════════════════════════
    const today = '2026-03-08';
    const metodos = ['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia'];
    const referencias = ['', 'TRX-20260308-001', 'TRX-20260308-002', '', 'TRX-20260308-003', '', 'TRX-20260308-004', 'TRX-20260308-005'];

    // Create pagos for today using existing OTs
    const pagosHoy = [
      { hora: '08:32', monto: 85000, metodo: 'efectivo', ref: '' },
      { hora: '09:15', monto: 125000, metodo: 'tarjeta_debito', ref: 'TRX-20260308-001' },
      { hora: '09:48', monto: 45000, metodo: 'efectivo', ref: '' },
      { hora: '10:20', monto: 210000, metodo: 'transferencia', ref: 'TRX-20260308-002' },
      { hora: '11:05', monto: 67500, metodo: 'tarjeta_credito', ref: 'TRX-20260308-003' },
      { hora: '12:30', monto: 158000, metodo: 'tarjeta_debito', ref: 'TRX-20260308-004' },
      { hora: '13:15', monto: 35000, metodo: 'efectivo', ref: '' },
      { hora: '14:00', monto: 320000, metodo: 'transferencia', ref: 'TRX-20260308-005' },
      { hora: '14:45', monto: 92000, metodo: 'tarjeta_credito', ref: 'TRX-20260308-006' },
      { hora: '15:20', monto: 54000, metodo: 'efectivo', ref: '' },
      { hora: '16:10', monto: 175000, metodo: 'tarjeta_debito', ref: 'TRX-20260308-007' },
      { hora: '16:55', monto: 48000, metodo: 'transferencia', ref: 'TRX-20260308-008' },
    ];

    let pagoCount = 0;
    for (let i = 0; i < pagosHoy.length; i++) {
      const p = pagosHoy[i];
      const otId = allOts[i % allOts.length]?.id;
      if (!otId) continue;
      const fechaPago = `${today}T${p.hora}:00`;
      await qr.query(
        `INSERT INTO pago (ot_id, taller_id, monto, metodo_pago, referencia, fecha_pago)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [otId, tallerId, p.monto, p.metodo, p.ref || null, fechaPago],
      );
      pagoCount++;
    }
    console.log(`  ✔ ${pagoCount} pagos del día insertados`);

    // ═══════════════════════════════════════════════════
    // ── NOTIFICACIONES: Historial de emails enviados ──
    // ═══════════════════════════════════════════════════
    const emailsData = [
      { dest: 'roberto@gmail.com', asunto: 'Presupuesto OT-2026-0101 - Toyota Yaris', tipo: 'presupuesto', estado: 'entregado', fecha: '2026-03-01T09:30:00' },
      { dest: 'daniela@gmail.com', asunto: 'Su vehículo está listo - Hyundai Tucson', tipo: 'ot_finalizada', estado: 'abierto', fecha: '2026-03-01T14:15:00' },
      { dest: 'contacto@tlagos.cl', asunto: 'OT finalizada - Sprinter mantención', tipo: 'ot_finalizada', estado: 'enviado', fecha: '2026-03-02T10:00:00' },
      { dest: 'francisca@gmail.com', asunto: 'Presupuesto OT-2026-0104 - Kia Morning', tipo: 'presupuesto', estado: 'entregado', fecha: '2026-03-02T11:45:00' },
      { dest: 'miguel@gmail.com', asunto: 'Su Mazda 3 está listo para retiro', tipo: 'ot_finalizada', estado: 'abierto', fecha: '2026-03-03T08:20:00' },
      { dest: 'patricia@gmail.com', asunto: 'Recordatorio: Revisión técnica próxima', tipo: 'recordatorio', estado: 'entregado', fecha: '2026-03-03T09:00:00' },
      { dest: 'flota@andes.cl', asunto: 'OT finalizada - Ford Ranger reparación', tipo: 'ot_finalizada', estado: 'enviado', fecha: '2026-03-03T16:30:00' },
      { dest: 'andres@gmail.com', asunto: 'Presupuesto OT-2026-0108 - Nissan Kicks', tipo: 'presupuesto', estado: 'abierto', fecha: '2026-03-04T09:10:00' },
      { dest: 'info@elsol.cl', asunto: 'Su Fiat Fiorino está en reparación', tipo: 'ot_finalizada', estado: 'entregado', fecha: '2026-03-04T14:00:00' },
      { dest: 'valentina@gmail.com', asunto: 'Recordatorio: SOAP vence pronto', tipo: 'recordatorio', estado: 'enviado', fecha: '2026-03-05T09:00:00' },
      { dest: 'sebastian@gmail.com', asunto: 'Presupuesto OT-2026-0110 - Peugeot 208', tipo: 'presupuesto', estado: 'entregado', fecha: '2026-03-05T11:20:00' },
      { dest: 'flota@losrobles.cl', asunto: 'OT finalizada - Mitsubishi L200', tipo: 'ot_finalizada', estado: 'abierto', fecha: '2026-03-05T15:45:00' },
      { dest: 'javiera@gmail.com', asunto: 'Su Honda CR-V está listo para retiro', tipo: 'ot_finalizada', estado: 'entregado', fecha: '2026-03-06T10:30:00' },
      { dest: 'ignacio@hotmail.com', asunto: 'Recordatorio: Mantención 20.000 km', tipo: 'recordatorio', estado: 'entregado', fecha: '2026-03-06T09:00:00' },
      { dest: 'carolina@gmail.com', asunto: 'Presupuesto OT-2026-0113 - Chevrolet Sail', tipo: 'presupuesto', estado: 'enviado', fecha: '2026-03-06T14:10:00' },
      { dest: 'roberto@gmail.com', asunto: 'Su Toyota Hilux está listo', tipo: 'ot_finalizada', estado: 'abierto', fecha: '2026-03-07T09:50:00' },
      { dest: 'daniela@gmail.com', asunto: 'Revisión técnica próxima - Hyundai Tucson', tipo: 'rev_tecnica', estado: 'entregado', fecha: '2026-03-07T12:00:00' },
      { dest: 'miguel@gmail.com', asunto: 'Recordatorio: Permiso de circulación', tipo: 'recordatorio', estado: 'enviado', fecha: '2026-03-07T09:00:00' },
      { dest: 'contacto@tlagos.cl', asunto: 'Presupuesto mantención flota Marzo', tipo: 'presupuesto', estado: 'abierto', fecha: '2026-03-07T16:20:00' },
      { dest: 'patricia@gmail.com', asunto: 'Su Suzuki Swift está listo para retiro', tipo: 'ot_finalizada', estado: 'entregado', fecha: '2026-03-08T08:45:00' },
      { dest: 'flota@andes.cl', asunto: 'OT finalizada - Nissan NP300', tipo: 'ot_finalizada', estado: 'enviado', fecha: '2026-03-08T10:15:00' },
      { dest: 'andres@gmail.com', asunto: 'Su BYD Dolphin está en control de calidad', tipo: 'ot_finalizada', estado: 'entregado', fecha: '2026-03-08T11:30:00' },
      { dest: 'info@elsol.cl', asunto: 'Recordatorio: Revisión técnica Fiat Fiorino', tipo: 'rev_tecnica', estado: 'enviado', fecha: '2026-03-08T09:00:00' },
      { dest: 'valentina@gmail.com', asunto: 'Presupuesto OT-2026-0119 - MG ZS', tipo: 'presupuesto', estado: 'fallido', fecha: '2026-03-08T13:40:00' },
      { dest: 'carolina@gmail.com', asunto: 'Bienvenida a Roadix', tipo: 'bienvenida', estado: 'entregado', fecha: '2026-02-15T10:00:00' },
    ];

    let emailCount = 0;
    for (const e of emailsData) {
      await qr.query(
        `INSERT INTO historial_email (taller_id, destinatario, asunto, tipo, estado, created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [tallerId, e.dest, e.asunto, e.tipo, e.estado, e.fecha],
      );
      emailCount++;
    }
    console.log(`  ✔ ${emailCount} emails en historial`);

    // ── Update existing recordatorios to have more varied states ──
    const existingRecs: { id: number }[] = await qr.query(
      `SELECT id FROM recordatorio WHERE taller_id=$1 ORDER BY id`,
      [tallerId],
    );
    // Mark some as enviado with enviado_at
    for (let i = 0; i < existingRecs.length; i++) {
      if (i < 4) {
        await qr.query(
          `UPDATE recordatorio SET estado='enviado', enviado_at=$1 WHERE id=$2`,
          [`2026-03-0${i + 1}T09:00:00`, existingRecs[i].id],
        );
      }
      // leave the rest as pendiente
    }
    console.log(`  ✔ Updated ${Math.min(4, existingRecs.length)} recordatorios to enviado`);

    // Add more recordatorios with varied data
    const newRecs = [
      { tipo: 'rev_tecnica', msg: 'Revisión técnica vence en 15 días - Toyota Hilux DDEE34', canal: 'email', estado: 'enviado', fecha: '2026-02-25T09:00:00' },
      { tipo: 'soap', msg: 'SOAP vence el 31 de marzo - Hyundai Tucson FFGG56', canal: 'email', estado: 'enviado', fecha: '2026-03-01T09:00:00' },
      { tipo: 'mantencion', msg: 'Mantención de 50.000 km recomendada - Kia Morning MMNN12', canal: 'wsp', estado: 'enviado', fecha: '2026-03-02T10:00:00' },
      { tipo: 'seguimiento', msg: '¿Cómo quedó su Mazda 3 después de la reparación?', canal: 'email', estado: 'enviado', fecha: '2026-03-03T09:00:00' },
      { tipo: 'rev_tecnica', msg: 'Revisión técnica vence en 30 días - Ford Ranger QQRR56', canal: 'ambos', estado: 'enviado', fecha: '2026-03-04T09:00:00' },
      { tipo: 'permiso_circ', msg: 'Permiso de circulación próximo a vencer - Nissan X-Trail', canal: 'email', estado: 'fallido', fecha: '2026-03-05T09:00:00' },
      { tipo: 'mantencion', msg: 'Mantención de 80.000 km lista para agendar - Chevrolet Sail', canal: 'email', estado: 'pendiente', fecha: '2026-03-10T09:00:00' },
      { tipo: 'soap', msg: 'SOAP vence en abril - BYD Dolphin AA8B34', canal: 'wsp', estado: 'pendiente', fecha: '2026-03-12T09:00:00' },
      { tipo: 'seguimiento', msg: '¿Todo bien con su Honda CR-V?', canal: 'email', estado: 'pendiente', fecha: '2026-03-15T09:00:00' },
      { tipo: 'rev_tecnica', msg: 'Revisión técnica próxima - Peugeot 208 IUJ12', canal: 'email', estado: 'pendiente', fecha: '2026-03-20T09:00:00' },
    ];

    let recCount = 0;
    for (let i = 0; i < newRecs.length; i++) {
      const r = newRecs[i];
      const cliId = clientes[i % clientes.length]?.id;
      const vehId = vehiculos[i % vehiculos.length]?.id;
      const enviadoAt = r.estado === 'enviado' ? r.fecha : null;
      await qr.query(
        `INSERT INTO recordatorio (taller_id, cliente_id, vehiculo_id, tipo, mensaje, fecha_envio, canal, estado, enviado_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [tallerId, cliId, vehId, r.tipo, r.msg, r.fecha, r.canal, r.estado, enviadoAt],
      );
      recCount++;
    }
    console.log(`  ✔ ${recCount} nuevos recordatorios`);

    await qr.commitTransaction();
    console.log('\n✅ Caja & Notificaciones demo data seeded!');
  } catch (err) {
    await qr.rollbackTransaction();
    throw err;
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

seedCajaNotif().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
