import dataSource from '../../config/data-source.js';
import * as bcrypt from 'bcrypt';

/**
 * Massive seed: data for all of 2025 and 2026 (up to March 2026).
 * ~120 OTs, pagos, facturas, movimientos de stock spread across months.
 */
async function seedFull() {
  await dataSource.initialize();
  console.log('Connected. Wiping old demo data and seeding massive data...');

  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    const tallerId = 1;

    // ── Clean existing demo data (keep admin user id=1 and taller id=1) ──
    await qr.query(`DELETE FROM recordatorio WHERE taller_id=$1`, [tallerId]);
    await qr.query(`DELETE FROM checklist_recepcion WHERE ot_id IN (SELECT id FROM orden_trabajo WHERE taller_id=$1)`, [tallerId]);
    await qr.query(`DELETE FROM movimiento_stock WHERE repuesto_id IN (SELECT id FROM repuesto WHERE taller_id=$1)`, [tallerId]);
    await qr.query(`DELETE FROM presupuesto WHERE taller_id=$1`, [tallerId]);
    await qr.query(`DELETE FROM factura WHERE taller_id=$1`, [tallerId]);
    await qr.query(`DELETE FROM pago WHERE taller_id=$1`, [tallerId]);
    await qr.query(`DELETE FROM ot_detalle WHERE ot_id IN (SELECT id FROM orden_trabajo WHERE taller_id=$1)`, [tallerId]);
    await qr.query(`DELETE FROM ot_foto WHERE ot_id IN (SELECT id FROM orden_trabajo WHERE taller_id=$1)`, [tallerId]);
    await qr.query(`DELETE FROM orden_trabajo WHERE taller_id=$1`, [tallerId]);
    await qr.query(`DELETE FROM vehiculo WHERE taller_id=$1`, [tallerId]);
    await qr.query(`DELETE FROM cliente WHERE taller_id=$1`, [tallerId]);
    await qr.query(`DELETE FROM repuesto WHERE taller_id=$1`, [tallerId]);
    await qr.query(`DELETE FROM proveedor WHERE taller_id=$1`, [tallerId]);
    await qr.query(`DELETE FROM mecanico WHERE taller_id=$1`, [tallerId]);
    await qr.query(`DELETE FROM usuario WHERE taller_id=$1 AND id != 1`, [tallerId]);
    console.log('  ✔ Old data cleared');

    // ── Usuarios ──
    const hash = await bcrypt.hash('1234', 12);
    const usersData = [
      { nombre: 'Carlos Muñoz', email: 'carlos', rol: 'mecanico', tel: '+56912345001' },
      { nombre: 'Pedro Soto', email: 'pedro', rol: 'mecanico', tel: '+56912345002' },
      { nombre: 'Luis Contreras', email: 'luis', rol: 'mecanico', tel: '+56912345003' },
      { nombre: 'Rodrigo Díaz', email: 'rodrigo', rol: 'mecanico', tel: '+56912345006' },
      { nombre: 'María López', email: 'maria', rol: 'recepcionista', tel: '+56912345004' },
      { nombre: 'Ana Torres', email: 'ana', rol: 'bodeguero', tel: '+56912345005' },
      { nombre: 'Sofía Rojas', email: 'sofia', rol: 'cajero', tel: '+56912345007' },
    ];
    const userIds: number[] = [];
    for (const u of usersData) {
      const res = await qr.query(
        `INSERT INTO usuario (taller_id, nombre, email, password, rol, telefono, activo)
         VALUES ($1,$2,$3,$4,$5,$6,true) ON CONFLICT (email) DO UPDATE SET nombre=EXCLUDED.nombre RETURNING id`,
        [tallerId, u.nombre, u.email, hash, u.rol, u.tel],
      );
      userIds.push(res[0].id);
    }
    console.log(`  ✔ ${userIds.length} usuarios`);

    // ── Mecánicos ──
    const mecData = [
      { uid: 0, esp: 'Motor y transmisión', tarifa: 18000 },
      { uid: 1, esp: 'Frenos y suspensión', tarifa: 15000 },
      { uid: 2, esp: 'Eléctrica automotriz', tarifa: 20000 },
      { uid: 3, esp: 'Diagnóstico computarizado', tarifa: 22000 },
    ];
    const mecIds: number[] = [];
    for (const m of mecData) {
      const res = await qr.query(
        `INSERT INTO mecanico (usuario_id, taller_id, especialidad, tarifa_hora, activo)
         VALUES ($1,$2,$3,$4,true) ON CONFLICT DO NOTHING RETURNING id`,
        [userIds[m.uid], tallerId, m.esp, m.tarifa],
      );
      mecIds.push(res[0]?.id || 0);
    }
    console.log(`  ✔ ${mecIds.length} mecánicos`);

    // ── Proveedores ──
    const provData = [
      { razon: 'Repuestos Chile SpA', rut: '76.123.456-7', contacto: 'Jorge Vega', email: 'ventas@repuestoschile.cl', tel: '+56222334455' },
      { razon: 'AutoParts Ltda', rut: '76.654.321-0', contacto: 'Sandra Muñoz', email: 'pedidos@autoparts.cl', tel: '+56222556677' },
      { razon: 'Lubricantes del Sur SA', rut: '76.999.888-K', contacto: 'Matías Rojas', email: 'info@lubrisur.cl', tel: '+56222778899' },
      { razon: 'Neumáticos Express SA', rut: '76.555.666-1', contacto: 'Camila Bravo', email: 'ventas@neumaticos.cl', tel: '+56222112233' },
    ];
    const provIds: number[] = [];
    for (const p of provData) {
      const res = await qr.query(
        `INSERT INTO proveedor (taller_id, razon_social, rut, contacto, email, telefono)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id`,
        [tallerId, p.razon, p.rut, p.contacto, p.email, p.tel],
      );
      provIds.push(res[0]?.id || 0);
    }
    console.log(`  ✔ ${provIds.length} proveedores`);

    // ── Repuestos ──
    const repData = [
      { codigo: 'FIL-ACE-001', nombre: 'Filtro de aceite universal Mann', cat: 'Filtros', pv: 8990, pc: 4500, stock: 35, min: 5, prov: 0 },
      { codigo: 'FIL-AIR-001', nombre: 'Filtro de aire Toyota Yaris Sakura', cat: 'Filtros', pv: 12990, pc: 6500, stock: 20, min: 3, prov: 0 },
      { codigo: 'PAS-FRE-001', nombre: 'Pastillas de freno delanteras Bosch', cat: 'Frenos', pv: 24990, pc: 14000, stock: 18, min: 4, prov: 1 },
      { codigo: 'ACE-5W30-4L', nombre: 'Aceite 5W-30 4 litros Castrol', cat: 'Lubricantes', pv: 32990, pc: 18000, stock: 30, min: 5, prov: 2 },
      { codigo: 'BUJ-NGK-001', nombre: 'Bujía NGK estándar', cat: 'Encendido', pv: 3990, pc: 1800, stock: 50, min: 10, prov: 0 },
      { codigo: 'COR-DIS-001', nombre: 'Correa distribución Hyundai Gates', cat: 'Motor', pv: 45990, pc: 25000, stock: 8, min: 2, prov: 1 },
      { codigo: 'AMO-DEL-001', nombre: 'Amortiguador delantero Monroe', cat: 'Suspensión', pv: 39990, pc: 22000, stock: 10, min: 2, prov: 1 },
      { codigo: 'BAT-60A-001', nombre: 'Batería 60Ah Bosch', cat: 'Eléctrico', pv: 89990, pc: 55000, stock: 6, min: 2, prov: 0 },
      { codigo: 'LIQ-FRE-001', nombre: 'Líquido de frenos DOT4 Prestone', cat: 'Lubricantes', pv: 7990, pc: 3500, stock: 22, min: 5, prov: 2 },
      { codigo: 'REF-VER-001', nombre: 'Refrigerante verde 1L Prestone', cat: 'Lubricantes', pv: 5990, pc: 2800, stock: 28, min: 5, prov: 2 },
      { codigo: 'NEU-195-001', nombre: 'Neumático 195/65R15 Firestone', cat: 'Neumáticos', pv: 54990, pc: 32000, stock: 16, min: 4, prov: 3 },
      { codigo: 'NEU-205-001', nombre: 'Neumático 205/55R16 Michelin', cat: 'Neumáticos', pv: 69990, pc: 42000, stock: 12, min: 4, prov: 3 },
      { codigo: 'DIS-FRE-001', nombre: 'Disco de freno ventilado TRW', cat: 'Frenos', pv: 34990, pc: 19000, stock: 10, min: 2, prov: 1 },
      { codigo: 'EMB-KIT-001', nombre: 'Kit de embrague Valeo', cat: 'Transmisión', pv: 159990, pc: 95000, stock: 4, min: 1, prov: 1 },
      { codigo: 'ALT-12V-001', nombre: 'Alternador 12V remanufacturado', cat: 'Eléctrico', pv: 125990, pc: 72000, stock: 3, min: 1, prov: 0 },
    ];
    const repIds: number[] = [];
    for (const r of repData) {
      const res = await qr.query(
        `INSERT INTO repuesto (taller_id, codigo, nombre, categoria, precio_venta, precio_compra, stock_actual, stock_minimo, proveedor_id, ubicacion_bodega)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Estante A') ON CONFLICT DO NOTHING RETURNING id`,
        [tallerId, r.codigo, r.nombre, r.cat, r.pv, r.pc, r.stock, r.min, provIds[r.prov]],
      );
      repIds.push(res[0]?.id || 0);
    }
    console.log(`  ✔ ${repIds.length} repuestos`);

    // ── Clientes ──
    const cliData = [
      { nombre: 'Roberto González', rut: '12.345.678-5', email: 'roberto@gmail.com', tel: '+56911111111', tipo: 'persona' },
      { nombre: 'Daniela Fuentes', rut: '13.456.789-0', email: 'daniela@gmail.com', tel: '+56922222222', tipo: 'persona' },
      { nombre: 'Transporte Lagos SpA', rut: '76.111.222-3', email: 'contacto@tlagos.cl', tel: '+56933333333', tipo: 'empresa' },
      { nombre: 'Francisca Ortega', rut: '14.567.890-1', email: 'francisca@gmail.com', tel: '+56944444444', tipo: 'persona' },
      { nombre: 'Miguel Herrera', rut: '15.678.901-2', email: 'miguel@gmail.com', tel: '+56955555555', tipo: 'persona' },
      { nombre: 'Constructora Andes Ltda', rut: '76.333.444-5', email: 'flota@andes.cl', tel: '+56966666666', tipo: 'empresa' },
      { nombre: 'Patricia Vargas', rut: '16.789.012-3', email: 'patricia@gmail.com', tel: '+56977777777', tipo: 'persona' },
      { nombre: 'Andrés Riquelme', rut: '17.890.123-4', email: 'andres@gmail.com', tel: '+56988888888', tipo: 'persona' },
      { nombre: 'Comercial El Sol Ltda', rut: '76.444.555-6', email: 'info@elsol.cl', tel: '+56999999999', tipo: 'empresa' },
      { nombre: 'Valentina Contreras', rut: '18.901.234-5', email: 'valentina@gmail.com', tel: '+56911112222', tipo: 'persona' },
      { nombre: 'Sebastián Navarro', rut: '19.012.345-6', email: 'sebastian@gmail.com', tel: '+56922223333', tipo: 'persona' },
      { nombre: 'Agrícola Los Robles SA', rut: '76.555.777-8', email: 'flota@losrobles.cl', tel: '+56933334444', tipo: 'empresa' },
      { nombre: 'Javiera Morales', rut: '20.123.456-7', email: 'javiera@gmail.com', tel: '+56944445555', tipo: 'persona' },
      { nombre: 'Ignacio Pereira', rut: '21.234.567-8', email: 'ignacio@hotmail.com', tel: '+56955556666', tipo: 'persona' },
      { nombre: 'Carolina Espinoza', rut: '22.345.678-9', email: 'carolina@gmail.com', tel: '+56966667777', tipo: 'persona' },
    ];
    const cliIds: number[] = [];
    for (const c of cliData) {
      const res = await qr.query(
        `INSERT INTO cliente (taller_id, nombre, rut, email, telefono, tipo)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id`,
        [tallerId, c.nombre, c.rut, c.email, c.tel, c.tipo],
      );
      cliIds.push(res[0]?.id || 0);
    }
    console.log(`  ✔ ${cliIds.length} clientes`);

    // ── Vehículos ──
    const vehData = [
      { cli: 0, pat: 'BBCC12', marca: 'Toyota', modelo: 'Yaris', anio: 2020, color: 'Blanco', tipo: 'automovil', km: 45000, comb: 'bencina' },
      { cli: 0, pat: 'DDEE34', marca: 'Toyota', modelo: 'Hilux', anio: 2019, color: 'Gris', tipo: 'camioneta', km: 88000, comb: 'diesel' },
      { cli: 1, pat: 'FFGG56', marca: 'Hyundai', modelo: 'Tucson', anio: 2021, color: 'Azul', tipo: 'suv', km: 32000, comb: 'bencina' },
      { cli: 2, pat: 'HHJJ78', marca: 'Mercedes-Benz', modelo: 'Sprinter', anio: 2018, color: 'Blanco', tipo: 'van', km: 150000, comb: 'diesel' },
      { cli: 2, pat: 'KKLL90', marca: 'Hyundai', modelo: 'HD78', anio: 2017, color: 'Blanco', tipo: 'camion', km: 210000, comb: 'diesel' },
      { cli: 3, pat: 'MMNN12', marca: 'Kia', modelo: 'Morning', anio: 2022, color: 'Rojo', tipo: 'automovil', km: 18000, comb: 'bencina' },
      { cli: 4, pat: 'PPQQ34', marca: 'Chevrolet', modelo: 'Sail', anio: 2020, color: 'Negro', tipo: 'automovil', km: 62000, comb: 'bencina' },
      { cli: 5, pat: 'RRSS56', marca: 'Ford', modelo: 'Ranger', anio: 2021, color: 'Plata', tipo: 'camioneta', km: 95000, comb: 'diesel' },
      { cli: 5, pat: 'TTUV78', marca: 'Volvo', modelo: 'FH16', anio: 2019, color: 'Rojo', tipo: 'camion', km: 320000, comb: 'diesel' },
      { cli: 6, pat: 'WWXX90', marca: 'Suzuki', modelo: 'Swift', anio: 2023, color: 'Celeste', tipo: 'automovil', km: 8000, comb: 'bencina' },
      { cli: 7, pat: 'YYZZ12', marca: 'Nissan', modelo: 'Kicks', anio: 2022, color: 'Blanco', tipo: 'suv', km: 25000, comb: 'bencina' },
      { cli: 7, pat: 'AABB34', marca: 'BYD', modelo: 'Dolphin', anio: 2024, color: 'Verde', tipo: 'automovil', km: 5000, comb: 'electrico' },
      { cli: 8, pat: 'CCDD56', marca: 'Fiat', modelo: 'Fiorino', anio: 2020, color: 'Blanco', tipo: 'van', km: 72000, comb: 'bencina' },
      { cli: 8, pat: 'EEFF78', marca: 'Renault', modelo: 'Kangoo', anio: 2019, color: 'Blanco', tipo: 'van', km: 98000, comb: 'diesel' },
      { cli: 9, pat: 'GGHH90', marca: 'MG', modelo: 'ZS', anio: 2023, color: 'Azul', tipo: 'suv', km: 15000, comb: 'bencina' },
      { cli: 10, pat: 'IIJJ12', marca: 'Peugeot', modelo: '208', anio: 2022, color: 'Gris', tipo: 'automovil', km: 28000, comb: 'bencina' },
      { cli: 11, pat: 'KKLL34', marca: 'Toyota', modelo: 'Hilux', anio: 2020, color: 'Blanco', tipo: 'camioneta', km: 130000, comb: 'diesel' },
      { cli: 11, pat: 'MMNN56', marca: 'John Deere', modelo: '5075E', anio: 2018, color: 'Verde', tipo: 'maquinaria', km: 5600, comb: 'diesel' },
      { cli: 12, pat: 'OOPP78', marca: 'Mazda', modelo: 'CX-5', anio: 2023, color: 'Rojo', tipo: 'suv', km: 12000, comb: 'bencina' },
      { cli: 13, pat: 'QQRR90', marca: 'Volkswagen', modelo: 'Amarok', anio: 2021, color: 'Negro', tipo: 'camioneta', km: 65000, comb: 'diesel' },
      { cli: 14, pat: 'SSTT12', marca: 'Honda', modelo: 'Civic', anio: 2022, color: 'Plata', tipo: 'automovil', km: 35000, comb: 'bencina' },
    ];
    const vehIds: number[] = [];
    for (const v of vehData) {
      const res = await qr.query(
        `INSERT INTO vehiculo (cliente_id, taller_id, patente, marca, modelo, anio, color, tipo_vehiculo, km_actual, combustible)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING RETURNING id`,
        [cliIds[v.cli], tallerId, v.pat, v.marca, v.modelo, v.anio, v.color, v.tipo, v.km, v.comb],
      );
      vehIds.push(res[0]?.id || 0);
    }
    console.log(`  ✔ ${vehIds.length} vehículos`);

    // ── Helper: date from YYYY-MM-DD ──
    const d = (s: string) => new Date(s + 'T10:00:00');

    // ── Tipos de servicio realistas ──
    const servicios = [
      'Mantención 10.000 km', 'Mantención 20.000 km', 'Mantención 30.000 km',
      'Mantención 50.000 km', 'Mantención 100.000 km', 'Cambio de aceite y filtros',
      'Reparación frenos', 'Cambio pastillas de freno', 'Reparación suspensión',
      'Cambio amortiguadores', 'Reparación eléctrica', 'Cambio alternador',
      'Cambio de batería', 'Cambio correa distribución', 'Reparación motor',
      'Cambio de embrague', 'Diagnóstico computarizado', 'Revisión pre-compra',
      'Alineación y balanceo', 'Cambio de neumáticos', 'Reparación aire acondicionado',
      'Escáner y borrado de códigos', 'Cambio bujías', 'Reparación transmisión',
    ];

    const diagnosticos = [
      'Cambio de aceite, filtros y revisión general. Todo dentro de parámetros.',
      'Pastillas delanteras desgastadas, disco dentro de tolerancia. Se recomienda cambio.',
      'Mantención programada. Niveles correctos, sin fugas.',
      'Alternador no carga. Reemplazo y chequeo circuito eléctrico.',
      'Correa con desgaste avanzado. Cambio preventivo junto con tensor.',
      'Sonido irregular en motor en ralentí. Se diagnostica falla de bujías.',
      'Frenos con ruido metálico. Pastillas y discos desgastados.',
      'Suspensión vencida. Amortiguadores sin rebote, reemplazo necesario.',
      'A/C no enfría. Fuga de refrigerante en compresor.',
      'Batería sin carga. Prueba indica celda dañada. Reemplazo.',
      'Embrague patina. Kit de embrague desgastado, reemplazo completo.',
      'Vibración en volante a 80+ km/h. Desbalanceo y posible rótula desgastada.',
      'Revisión general pre-compra solicitada. Sin hallazgos mayores.',
      'Check engine encendido. Código P0300: falla múltiple de cilindros.',
      'Mantención mayor. Cambio aceite, filtros, bujías, líquido frenos, refrigerante.',
    ];

    const prioridades = ['baja', 'media', 'media', 'media', 'alta', 'alta', 'urgente'];

    // ── Generate ~120 OTs spread across Jan 2025 – Mar 2026 ──
    interface OtSeed {
      numero: string; veh: number; cli: number; mec: number;
      estado: string; tipo: string; diag: string; prioridad: string;
      km: number; f_ing: string; f_prom: string; f_ent: string | null;
      subtotal: number; iva: number; total: number;
    }

    const allOts: OtSeed[] = [];
    let otCounter = 0;

    // Mapping from veh index to its cli index
    const vehToCli = vehData.map(v => v.cli);

    // Monthly distribution: OTs per month (realistic growth)
    const monthlyOts: { year: number; month: number; count: number }[] = [
      // 2025
      { year: 2025, month: 1, count: 6 }, { year: 2025, month: 2, count: 5 },
      { year: 2025, month: 3, count: 7 }, { year: 2025, month: 4, count: 6 },
      { year: 2025, month: 5, count: 8 }, { year: 2025, month: 6, count: 7 },
      { year: 2025, month: 7, count: 9 }, { year: 2025, month: 8, count: 8 },
      { year: 2025, month: 9, count: 10 }, { year: 2025, month: 10, count: 9 },
      { year: 2025, month: 11, count: 11 }, { year: 2025, month: 12, count: 8 },
      // 2026
      { year: 2026, month: 1, count: 10 }, { year: 2026, month: 2, count: 9 },
      { year: 2026, month: 3, count: 7 },
    ];

    // Seeded pseudo-random from index (deterministic)
    const pick = <T>(arr: T[], idx: number) => arr[idx % arr.length];

    for (const { year, month, count } of monthlyOts) {
      for (let i = 0; i < count; i++) {
        otCounter++;
        const numStr = String(otCounter).padStart(4, '0');
        const dayIng = Math.min(1 + Math.floor((i / count) * 27) + (otCounter % 3), 28);
        const fIng = `${year}-${String(month).padStart(2, '0')}-${String(dayIng).padStart(2, '0')}`;
        const dayProm = Math.min(dayIng + 3 + (otCounter % 4), 28);
        const fProm = `${year}-${String(month).padStart(2, '0')}-${String(dayProm).padStart(2, '0')}`;

        const vehIdx = otCounter % vehIds.length;
        const cliIdx = vehToCli[vehIdx];
        const mecIdx = otCounter % mecIds.length;
        const tipo = pick(servicios, otCounter);
        const diag = pick(diagnosticos, otCounter + 3);
        const prio = pick(prioridades, otCounter);

        // OTs in 2025 and Jan/Feb 2026 are completed; March 2026 are in-progress
        let estado: string;
        let fEnt: string | null;
        const isPast = year < 2026 || (year === 2026 && month <= 2);

        if (isPast) {
          // 80% entregado, 15% facturado, 5% cancelado
          const r = otCounter % 20;
          if (r < 16) estado = 'entregado';
          else if (r < 19) estado = 'facturado';
          else estado = 'cancelado';
          const dayEnt = Math.min(dayProm + (otCounter % 3), 28);
          fEnt = `${year}-${String(month).padStart(2, '0')}-${String(dayEnt).padStart(2, '0')}`;
        } else {
          // March 2026 — spread across active states
          const states = ['recepcion', 'diagnostico', 'presupuesto', 'esperando_aprobacion',
                          'esperando_repuestos', 'en_reparacion', 'control_calidad', 'listo',
                          'en_reparacion', 'diagnostico'];
          estado = states[i % states.length];
          fEnt = null;
        }

        // Generate realistic amounts
        const baseCost = 30000 + (otCounter * 7919) % 200000; // pseudo-random
        const subtotal = Math.round(baseCost / 100) * 100;
        const iva = Math.round(subtotal * 0.19);
        const total = subtotal + iva;

        allOts.push({
          numero: `OT-${year}-${numStr}`,
          veh: vehIdx, cli: cliIdx, mec: mecIdx,
          estado, tipo, diag, prioridad: prio,
          km: vehData[vehIdx].km + otCounter * 500,
          f_ing: fIng, f_prom: fProm, f_ent: fEnt,
          subtotal: estado === 'cancelado' ? 0 : subtotal,
          iva: estado === 'cancelado' ? 0 : iva,
          total: estado === 'cancelado' ? 0 : total,
        });
      }
    }

    console.log(`  Inserting ${allOts.length} OTs...`);
    const otIds: number[] = [];
    for (const ot of allOts) {
      const res = await qr.query(
        `INSERT INTO orden_trabajo (taller_id, vehiculo_id, cliente_id, mecanico_id, numero_ot, estado, tipo_servicio,
         diagnostico, prioridad, km_ingreso, fecha_ingreso, fecha_prometida, fecha_entrega, subtotal, iva, total, token_portal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,gen_random_uuid())
         ON CONFLICT (numero_ot) DO UPDATE SET estado=EXCLUDED.estado RETURNING id`,
        [
          tallerId, vehIds[ot.veh], cliIds[ot.cli], mecIds[ot.mec],
          ot.numero, ot.estado, ot.tipo, ot.diag, ot.prioridad,
          ot.km, d(ot.f_ing), d(ot.f_prom), ot.f_ent ? d(ot.f_ent) : null,
          ot.subtotal, ot.iva, ot.total,
        ],
      );
      otIds.push(res[0].id);
    }
    console.log(`  ✔ ${otIds.length} OTs creadas`);

    // ── OT Detalles — generate for each OT ──
    let detCount = 0;
    for (let i = 0; i < allOts.length; i++) {
      const ot = allOts[i];
      if (ot.estado === 'cancelado') continue;

      // Mano de obra
      const horasOt = 1 + (i % 5);
      const tarifa = mecData[ot.mec % mecData.length].tarifa;
      await qr.query(
        `INSERT INTO ot_detalle (ot_id, tipo, repuesto_id, descripcion, cantidad, precio_unit, descuento, subtotal)
         VALUES ($1,'mano_obra',NULL,$2,$3,$4,0,$5)`,
        [otIds[i], `Mano de obra: ${ot.tipo}`, horasOt, tarifa, horasOt * tarifa],
      );
      detCount++;

      // 1-3 repuestos per OT
      const numRep = 1 + (i % 3);
      for (let r = 0; r < numRep; r++) {
        const repIdx = (i + r * 3) % repIds.length;
        const cant = 1 + (r % 2);
        const precio = repData[repIdx].pv;
        await qr.query(
          `INSERT INTO ot_detalle (ot_id, tipo, repuesto_id, descripcion, cantidad, precio_unit, descuento, subtotal)
           VALUES ($1,'repuesto',$2,$3,$4,$5,0,$6)`,
          [otIds[i], repIds[repIdx], repData[repIdx].nombre, cant, precio, cant * precio],
        );
        detCount++;
      }
    }
    console.log(`  ✔ ${detCount} detalles de OT`);

    // ── Pagos — for all entregado and facturado OTs ──
    let pagoCount = 0;
    const metodos = ['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia'];
    for (let i = 0; i < allOts.length; i++) {
      const ot = allOts[i];
      if (ot.estado !== 'entregado' && ot.estado !== 'facturado') continue;
      const metodo = pick(metodos, i);
      await qr.query(
        `INSERT INTO pago (ot_id, taller_id, monto, metodo_pago, fecha_pago) VALUES ($1,$2,$3,$4,$5)`,
        [otIds[i], tallerId, ot.total, metodo, d(ot.f_ent!)],
      );
      pagoCount++;
    }
    console.log(`  ✔ ${pagoCount} pagos`);

    // ── Facturas — for all facturado OTs ──
    let factCount = 0;
    for (let i = 0; i < allOts.length; i++) {
      const ot = allOts[i];
      if (ot.estado !== 'facturado') continue;
      factCount++;
      const numBol = `B-${String(factCount).padStart(5, '0')}`;
      const rut = cliData[ot.cli]?.rut || '11.111.111-1';
      await qr.query(
        `INSERT INTO factura (ot_id, taller_id, numero_dte, tipo_dte, rut_receptor, monto_neto, iva, monto_total, estado_sii)
         VALUES ($1,$2,$3,'boleta',$4,$5,$6,$7,'aceptado')`,
        [otIds[i], tallerId, numBol, rut, ot.subtotal, ot.iva, ot.total],
      );
    }
    console.log(`  ✔ ${factCount} facturas`);

    // ── Presupuestos — for some in-progress OTs ──
    let presCount = 0;
    for (let i = 0; i < allOts.length; i++) {
      const ot = allOts[i];
      if (!['presupuesto', 'esperando_aprobacion', 'esperando_repuestos', 'en_reparacion', 'control_calidad', 'listo'].includes(ot.estado)) continue;
      presCount++;
      const estado = ['presupuesto', 'esperando_aprobacion'].includes(ot.estado) ? 'enviado' : 'aprobado';
      await qr.query(
        `INSERT INTO presupuesto (ot_id, taller_id, numero, estado, subtotal, iva, total, enviado_email)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [otIds[i], tallerId, `PRES-${ot.numero.slice(3)}`, estado, ot.subtotal, ot.iva, ot.total, true],
      );
    }
    console.log(`  ✔ ${presCount} presupuestos`);

    // ── Movimientos de stock — compras mensuales + salidas por OT ──
    let movCount = 0;
    // Monthly restocking (every 2 months in 2025)
    for (let m = 1; m <= 12; m += 2) {
      for (let r = 0; r < repIds.length; r++) {
        const cant = 5 + (r % 10);
        await qr.query(
          `INSERT INTO movimiento_stock (repuesto_id, tipo, cantidad, motivo, usuario_id, created_at)
           VALUES ($1,'entrada',$2,$3,$4,$5)`,
          [repIds[r], cant, `Reposición mensual ${m}/2025`, userIds[5], d(`2025-${String(m).padStart(2,'0')}-15`)],
        );
        movCount++;
      }
    }
    // Some exits
    for (let i = 0; i < Math.min(allOts.length, 80); i++) {
      const ot = allOts[i];
      if (ot.estado === 'cancelado' || ot.estado === 'recepcion') continue;
      const repIdx = (i * 3) % repIds.length;
      await qr.query(
        `INSERT INTO movimiento_stock (repuesto_id, tipo, cantidad, motivo, usuario_id, created_at)
         VALUES ($1,'salida',$2,$3,$4,$5)`,
        [repIds[repIdx], 1 + (i % 2), `Usado en ${ot.numero}`, userIds[ot.mec], d(ot.f_ing)],
      );
      movCount++;
    }
    console.log(`  ✔ ${movCount} movimientos de stock`);

    // ── Checklist — for recepcion and diagnostico OTs ──
    const zonas = ['frente', 'trasera', 'lat_izq', 'lat_der', 'techo', 'interior'];
    let checkCount = 0;
    for (let i = allOts.length - 7; i < allOts.length; i++) {
      for (const z of zonas) {
        const estado = Math.random() > 0.8 ? 'danio_prev' : 'ok';
        await qr.query(
          `INSERT INTO checklist_recepcion (ot_id, zona_vehiculo, estado, notas) VALUES ($1,$2,$3,$4)`,
          [otIds[i], z, estado, estado === 'ok' ? 'Sin observaciones' : 'Rayón menor existente'],
        );
        checkCount++;
      }
    }
    console.log(`  ✔ ${checkCount} items de checklist`);

    // ── Recordatorios ──
    const recData = [
      { cli: 0, veh: 0, tipo: 'rev_tecnica', msg: 'Su revisión técnica vence el 15 de abril 2026.', fecha: '2026-03-08' },
      { cli: 1, veh: 2, tipo: 'mantencion', msg: 'Han pasado 6 meses desde su última mantención.', fecha: '2026-03-15' },
      { cli: 3, veh: 5, tipo: 'soap', msg: 'Su SOAP vence el 31 de marzo 2026.', fecha: '2026-03-20' },
      { cli: 6, veh: 9, tipo: 'mantencion', msg: 'Mantención de 10.000 km recomendada.', fecha: '2026-04-01' },
      { cli: 4, veh: 6, tipo: 'seguimiento', msg: '¿Cómo está funcionando su vehículo?', fecha: '2026-03-10' },
      { cli: 9, veh: 14, tipo: 'rev_tecnica', msg: 'Revisión técnica próxima a vencer.', fecha: '2026-04-15' },
      { cli: 10, veh: 15, tipo: 'mantencion', msg: 'Mantención de 30.000 km recomendada.', fecha: '2026-03-25' },
      { cli: 12, veh: 18, tipo: 'soap', msg: 'SOAP vence el 30 de abril 2026.', fecha: '2026-04-10' },
    ];
    for (const r of recData) {
      await qr.query(
        `INSERT INTO recordatorio (taller_id, cliente_id, vehiculo_id, tipo, mensaje, fecha_envio, canal, estado)
         VALUES ($1,$2,$3,$4,$5,$6,'email','pendiente')`,
        [tallerId, cliIds[r.cli], vehIds[r.veh], r.tipo, r.msg, d(r.fecha)],
      );
    }
    console.log(`  ✔ ${recData.length} recordatorios`);

    await qr.commitTransaction();
    console.log('\n✅ Massive demo data seeded! (~120 OTs across 2025-2026)');
  } catch (err) {
    await qr.rollbackTransaction();
    throw err;
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

seedFull().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
