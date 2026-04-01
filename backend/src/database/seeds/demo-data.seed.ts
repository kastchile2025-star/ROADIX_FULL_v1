import dataSource from '../../config/data-source.js';
import * as bcrypt from 'bcrypt';

async function seedDemo() {
  await dataSource.initialize();
  console.log('Connected. Seeding demo data...');

  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    const tallerId = 1;

    // ── Usuarios (mecánicos + recepcionista + bodeguero) ──
    const hash = await bcrypt.hash('1234', 12);

    const usersData = [
      { nombre: 'Carlos Muñoz', email: 'carlos', rol: 'mecanico', telefono: '+56912345001' },
      { nombre: 'Pedro Soto', email: 'pedro', rol: 'mecanico', telefono: '+56912345002' },
      { nombre: 'Luis Contreras', email: 'luis', rol: 'mecanico', telefono: '+56912345003' },
      { nombre: 'María López', email: 'maria', rol: 'recepcionista', telefono: '+56912345004' },
      { nombre: 'Ana Torres', email: 'ana', rol: 'bodeguero', telefono: '+56912345005' },
    ];

    const userIds: number[] = [];
    for (const u of usersData) {
      const res = await qr.query(
        `INSERT INTO usuario (taller_id, nombre, email, password, rol, telefono, activo)
         VALUES ($1,$2,$3,$4,$5,$6,true)
         ON CONFLICT (email) DO UPDATE SET nombre=EXCLUDED.nombre
         RETURNING id`,
        [tallerId, u.nombre, u.email, hash, u.rol, u.telefono],
      );
      userIds.push(res[0].id);
    }
    console.log(`  ✔ ${userIds.length} usuarios creados`);

    // ── Mecánicos ──
    const mecanicoIds: number[] = [];
    const mecData = [
      { userId: userIds[0], especialidad: 'Motor y transmisión', tarifa: 18000 },
      { userId: userIds[1], especialidad: 'Frenos y suspensión', tarifa: 15000 },
      { userId: userIds[2], especialidad: 'Eléctrica automotriz', tarifa: 20000 },
    ];
    for (const m of mecData) {
      const res = await qr.query(
        `INSERT INTO mecanico (usuario_id, taller_id, especialidad, tarifa_hora, activo)
         VALUES ($1,$2,$3,$4,true)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [m.userId, tallerId, m.especialidad, m.tarifa],
      );
      mecanicoIds.push(res[0]?.id || 0);
    }
    console.log(`  ✔ ${mecanicoIds.length} mecánicos creados`);

    // ── Proveedores ──
    const provData = [
      { razon: 'Repuestos Chile SpA', rut: '76.123.456-7', contacto: 'Jorge Vega', email: 'ventas@repuestoschile.cl', tel: '+56222334455' },
      { razon: 'AutoParts Ltda', rut: '76.654.321-0', contacto: 'Sandra Muñoz', email: 'pedidos@autoparts.cl', tel: '+56222556677' },
      { razon: 'Lubricantes del Sur SA', rut: '76.999.888-K', contacto: 'Matías Rojas', email: 'info@lubrisur.cl', tel: '+56222778899' },
    ];
    const provIds: number[] = [];
    for (const p of provData) {
      const res = await qr.query(
        `INSERT INTO proveedor (taller_id, razon_social, rut, contacto, email, telefono)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT DO NOTHING RETURNING id`,
        [tallerId, p.razon, p.rut, p.contacto, p.email, p.tel],
      );
      provIds.push(res[0]?.id || 0);
    }
    console.log(`  ✔ ${provIds.length} proveedores creados`);

    // ── Repuestos ──
    const repData = [
      { codigo: 'FIL-ACE-001', nombre: 'Filtro de aceite universal Mann', cat: 'Filtros', precio_v: 8990, precio_c: 4500, stock: 25, min: 5, prov: provIds[0] },
      { codigo: 'FIL-AIR-001', nombre: 'Filtro de aire Toyota Yaris Sakura', cat: 'Filtros', precio_v: 12990, precio_c: 6500, stock: 15, min: 3, prov: provIds[0] },
      { codigo: 'PAS-FRE-001', nombre: 'Pastillas de freno delanteras Bosch', cat: 'Frenos', precio_v: 24990, precio_c: 14000, stock: 12, min: 4, prov: provIds[1] },
      { codigo: 'ACE-5W30-4L', nombre: 'Aceite 5W-30 4 litros Castrol', cat: 'Lubricantes', precio_v: 32990, precio_c: 18000, stock: 20, min: 5, prov: provIds[2] },
      { codigo: 'BUJ-NGK-001', nombre: 'Bujía NGK estándar', cat: 'Encendido', precio_v: 3990, precio_c: 1800, stock: 40, min: 10, prov: provIds[0] },
      { codigo: 'COR-DIS-001', nombre: 'Correa distribución Hyundai Gates', cat: 'Motor', precio_v: 45990, precio_c: 25000, stock: 6, min: 2, prov: provIds[1] },
      { codigo: 'AMO-DEL-001', nombre: 'Amortiguador delantero Monroe', cat: 'Suspensión', precio_v: 39990, precio_c: 22000, stock: 8, min: 2, prov: provIds[1] },
      { codigo: 'BAT-60A-001', nombre: 'Batería 60Ah Bosch', cat: 'Eléctrico', precio_v: 89990, precio_c: 55000, stock: 5, min: 2, prov: provIds[0] },
      { codigo: 'LIQ-FRE-001', nombre: 'Líquido de frenos DOT4 Prestone', cat: 'Lubricantes', precio_v: 7990, precio_c: 3500, stock: 18, min: 5, prov: provIds[2] },
      { codigo: 'REF-VER-001', nombre: 'Refrigerante verde 1L Prestone', cat: 'Lubricantes', precio_v: 5990, precio_c: 2800, stock: 22, min: 5, prov: provIds[2] },
    ];
    const repIds: number[] = [];
    for (const r of repData) {
      const res = await qr.query(
        `INSERT INTO repuesto (taller_id, codigo, nombre, categoria, precio_venta, precio_compra, stock_actual, stock_minimo, proveedor_id, ubicacion_bodega)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Estante A')
         ON CONFLICT DO NOTHING RETURNING id`,
        [tallerId, r.codigo, r.nombre, r.cat, r.precio_v, r.precio_c, r.stock, r.min, r.prov],
      );
      repIds.push(res[0]?.id || 0);
    }
    console.log(`  ✔ ${repIds.length} repuestos creados`);

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
    ];
    const cliIds: number[] = [];
    for (const c of cliData) {
      const res = await qr.query(
        `INSERT INTO cliente (taller_id, nombre, rut, email, telefono, tipo)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT DO NOTHING RETURNING id`,
        [tallerId, c.nombre, c.rut, c.email, c.tel, c.tipo],
      );
      cliIds.push(res[0]?.id || 0);
    }
    console.log(`  ✔ ${cliIds.length} clientes creados`);

    // ── Vehículos ──
    const vehData = [
      { cli: 0, patente: 'BBCC12', marca: 'Toyota', modelo: 'Yaris', anio: 2020, color: 'Blanco', tipo: 'automovil', km: 45000, comb: 'bencina' },
      { cli: 0, patente: 'DDEE34', marca: 'Toyota', modelo: 'Hilux', anio: 2019, color: 'Gris', tipo: 'camioneta', km: 88000, comb: 'diesel' },
      { cli: 1, patente: 'FFGG56', marca: 'Hyundai', modelo: 'Tucson', anio: 2021, color: 'Azul', tipo: 'suv', km: 32000, comb: 'bencina' },
      { cli: 2, patente: 'HHJJ78', marca: 'Mercedes-Benz', modelo: 'Sprinter', anio: 2018, color: 'Blanco', tipo: 'van', km: 150000, comb: 'diesel' },
      { cli: 2, patente: 'KKLL90', marca: 'Hyundai', modelo: 'HD78', anio: 2017, color: 'Blanco', tipo: 'camion', km: 210000, comb: 'diesel' },
      { cli: 3, patente: 'MMNN12', marca: 'Kia', modelo: 'Morning', anio: 2022, color: 'Rojo', tipo: 'automovil', km: 18000, comb: 'bencina' },
      { cli: 4, patente: 'PPQQ34', marca: 'Chevrolet', modelo: 'Sail', anio: 2020, color: 'Negro', tipo: 'automovil', km: 62000, comb: 'bencina' },
      { cli: 5, patente: 'RRSS56', marca: 'Ford', modelo: 'Ranger', anio: 2021, color: 'Plata', tipo: 'camioneta', km: 95000, comb: 'diesel' },
      { cli: 5, patente: 'TTUV78', marca: 'Volvo', modelo: 'FH16', anio: 2019, color: 'Rojo', tipo: 'camion', km: 320000, comb: 'diesel' },
      { cli: 6, patente: 'WWXX90', marca: 'Suzuki', modelo: 'Swift', anio: 2023, color: 'Celeste', tipo: 'automovil', km: 8000, comb: 'bencina' },
      { cli: 7, patente: 'YYZZ12', marca: 'Nissan', modelo: 'Kicks', anio: 2022, color: 'Blanco', tipo: 'suv', km: 25000, comb: 'bencina' },
      { cli: 7, patente: 'AABB34', marca: 'BYD', modelo: 'Dolphin', anio: 2024, color: 'Verde', tipo: 'automovil', km: 5000, comb: 'electrico' },
    ];
    const vehIds: number[] = [];
    for (const v of vehData) {
      const res = await qr.query(
        `INSERT INTO vehiculo (cliente_id, taller_id, patente, marca, modelo, anio, color, tipo_vehiculo, km_actual, combustible)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT DO NOTHING RETURNING id`,
        [cliIds[v.cli], tallerId, v.patente, v.marca, v.modelo, v.anio, v.color, v.tipo, v.km, v.comb],
      );
      vehIds.push(res[0]?.id || 0);
    }
    console.log(`  ✔ ${vehIds.length} vehículos creados`);

    // ── Órdenes de Trabajo (variadas en estados) ──
    const now = new Date();
    const daysAgo = (d: number) => {
      const dt = new Date(now);
      dt.setDate(dt.getDate() - d);
      return dt;
    };

    const otData = [
      {
        veh: 0, cli: 0, mec: 0, numero: 'OT-2026-0001', estado: 'entregado', tipo: 'Mantención 50.000 km',
        diagnostico: 'Cambio de aceite, filtros y revisión de frenos.', prioridad: 'media',
        km: 45000, fecha_ing: daysAgo(25), fecha_prom: daysAgo(23), fecha_ent: daysAgo(23),
        subtotal: 65970, iva: 12534, total: 78504,
      },
      {
        veh: 1, cli: 0, mec: 1, numero: 'OT-2026-0002', estado: 'entregado', tipo: 'Reparación frenos',
        diagnostico: 'Pastillas delanteras desgastadas, disco dentro de tolerancia.', prioridad: 'alta',
        km: 88000, fecha_ing: daysAgo(20), fecha_prom: daysAgo(18), fecha_ent: daysAgo(17),
        subtotal: 69980, iva: 13296, total: 83276,
      },
      {
        veh: 2, cli: 1, mec: 0, numero: 'OT-2026-0003', estado: 'facturado', tipo: 'Mantención 30.000 km',
        diagnostico: 'Mantención programada. Todo en orden.', prioridad: 'baja',
        km: 32000, fecha_ing: daysAgo(15), fecha_prom: daysAgo(13), fecha_ent: daysAgo(13),
        subtotal: 41980, iva: 7976, total: 49956,
      },
      {
        veh: 3, cli: 2, mec: 2, numero: 'OT-2026-0004', estado: 'listo', tipo: 'Reparación eléctrica',
        diagnostico: 'Alternador no carga. Reemplazo de alternador y chequeo sistema eléctrico.', prioridad: 'urgente',
        km: 150000, fecha_ing: daysAgo(5), fecha_prom: daysAgo(2), fecha_ent: null,
        subtotal: 185000, iva: 35150, total: 220150,
      },
      {
        veh: 4, cli: 2, mec: 1, numero: 'OT-2026-0005', estado: 'en_reparacion', tipo: 'Cambio de correa distribución',
        diagnostico: 'Correa con desgaste avanzado. Se recomienda cambio preventivo junto con tensor y bomba de agua.', prioridad: 'alta',
        km: 210000, fecha_ing: daysAgo(3), fecha_prom: daysAgo(-1), fecha_ent: null,
        subtotal: 145980, iva: 27736, total: 173716,
      },
      {
        veh: 5, cli: 3, mec: 0, numero: 'OT-2026-0006', estado: 'esperando_repuestos', tipo: 'Reparación motor',
        diagnostico: 'Sonido irregular en motor. Se requieren válvulas y empaquetaduras.', prioridad: 'media',
        km: 18000, fecha_ing: daysAgo(4), fecha_prom: daysAgo(-3), fecha_ent: null,
        subtotal: 0, iva: 0, total: 0,
      },
      {
        veh: 6, cli: 4, mec: 2, numero: 'OT-2026-0007', estado: 'diagnostico', tipo: 'Revisión general',
        diagnostico: 'Cliente reporta ruido al frenar y vibración en volante.', prioridad: 'media',
        km: 62000, fecha_ing: daysAgo(1), fecha_prom: daysAgo(-2), fecha_ent: null,
        subtotal: 0, iva: 0, total: 0,
      },
      {
        veh: 7, cli: 5, mec: 1, numero: 'OT-2026-0008', estado: 'en_reparacion', tipo: 'Mantención 100.000 km',
        diagnostico: 'Mantención mayor. Cambio aceite, filtros, bujías, líquido frenos, refrigerante.', prioridad: 'media',
        km: 95000, fecha_ing: daysAgo(2), fecha_prom: daysAgo(-1), fecha_ent: null,
        subtotal: 189940, iva: 36089, total: 226029,
      },
      {
        veh: 9, cli: 6, mec: null, numero: 'OT-2026-0009', estado: 'recepcion', tipo: 'Primera revisión',
        diagnostico: '', prioridad: 'baja',
        km: 8000, fecha_ing: daysAgo(0), fecha_prom: daysAgo(-3), fecha_ent: null,
        subtotal: 0, iva: 0, total: 0,
      },
      {
        veh: 10, cli: 7, mec: 0, numero: 'OT-2026-0010', estado: 'presupuesto', tipo: 'Reparación suspensión',
        diagnostico: 'Amortiguadores delanteros vencidos. Se presupuesta reemplazo.', prioridad: 'alta',
        km: 25000, fecha_ing: daysAgo(2), fecha_prom: daysAgo(-2), fecha_ent: null,
        subtotal: 119970, iva: 22794, total: 142764,
      },
    ];

    const otIds: number[] = [];
    for (const ot of otData) {
      const res = await qr.query(
        `INSERT INTO orden_trabajo (taller_id, vehiculo_id, cliente_id, mecanico_id, numero_ot, estado, tipo_servicio,
         diagnostico, prioridad, km_ingreso, fecha_ingreso, fecha_prometida, fecha_entrega, subtotal, iva, total, token_portal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,gen_random_uuid())
         ON CONFLICT (numero_ot) DO UPDATE SET estado=EXCLUDED.estado
         RETURNING id`,
        [
          tallerId, vehIds[ot.veh], cliIds[ot.cli], ot.mec !== null ? mecanicoIds[ot.mec] : null,
          ot.numero, ot.estado, ot.tipo, ot.diagnostico, ot.prioridad,
          ot.km, ot.fecha_ing, ot.fecha_prom, ot.fecha_ent,
          ot.subtotal, ot.iva, ot.total,
        ],
      );
      otIds.push(res[0].id);
    }
    console.log(`  ✔ ${otIds.length} órdenes de trabajo creadas`);

    // ── OT Detalles (para OTs con montos) ──
    const detalles = [
      // OT-0001: Mantención 50k
      { ot: 0, tipo: 'mano_obra', desc: 'Mano de obra mantención completa', cant: 2, precio: 18000, rep: null },
      { ot: 0, tipo: 'repuesto', desc: 'Filtro de aceite universal', cant: 1, precio: 8990, rep: 0 },
      { ot: 0, tipo: 'repuesto', desc: 'Filtro de aire Toyota Yaris', cant: 1, precio: 12990, rep: 1 },
      { ot: 0, tipo: 'repuesto', desc: 'Aceite 5W-30 4 litros', cant: 1, precio: 32990, rep: 3 },
      // OT-0002: Frenos
      { ot: 1, tipo: 'mano_obra', desc: 'Cambio pastillas de freno', cant: 1, precio: 20000, rep: null },
      { ot: 1, tipo: 'repuesto', desc: 'Pastillas de freno delanteras', cant: 2, precio: 24990, rep: 2 },
      // OT-0003: Mantención 30k
      { ot: 2, tipo: 'mano_obra', desc: 'Mano de obra mantención', cant: 1, precio: 15000, rep: null },
      { ot: 2, tipo: 'repuesto', desc: 'Filtro de aceite universal', cant: 1, precio: 8990, rep: 0 },
      { ot: 2, tipo: 'repuesto', desc: 'Aceite 5W-30 4 litros', cant: 1, precio: 32990, rep: 3 },
      // OT-0005: Correa distribución
      { ot: 4, tipo: 'mano_obra', desc: 'Mano de obra cambio correa distribución', cant: 4, precio: 20000, rep: null },
      { ot: 4, tipo: 'repuesto', desc: 'Correa distribución Hyundai', cant: 1, precio: 45990, rep: 5 },
      { ot: 4, tipo: 'repuesto', desc: 'Aceite 5W-30 4 litros', cant: 1, precio: 32990, rep: 3 },
      // OT-0008: Mantención 100k
      { ot: 7, tipo: 'mano_obra', desc: 'Mano de obra mantención mayor', cant: 5, precio: 18000, rep: null },
      { ot: 7, tipo: 'repuesto', desc: 'Filtro de aceite universal', cant: 1, precio: 8990, rep: 0 },
      { ot: 7, tipo: 'repuesto', desc: 'Filtro de aire Toyota Yaris', cant: 1, precio: 12990, rep: 1 },
      { ot: 7, tipo: 'repuesto', desc: 'Aceite 5W-30 4 litros', cant: 2, precio: 32990, rep: 3 },
      { ot: 7, tipo: 'repuesto', desc: 'Bujía NGK estándar', cant: 4, precio: 3990, rep: 4 },
      { ot: 7, tipo: 'repuesto', desc: 'Líquido de frenos DOT4', cant: 1, precio: 7990, rep: 8 },
      { ot: 7, tipo: 'repuesto', desc: 'Refrigerante verde 1L', cant: 2, precio: 5990, rep: 9 },
      // OT-0010: Suspensión
      { ot: 9, tipo: 'mano_obra', desc: 'Mano de obra cambio amortiguadores', cant: 2, precio: 20000, rep: null },
      { ot: 9, tipo: 'repuesto', desc: 'Amortiguador delantero', cant: 2, precio: 39990, rep: 6 },
    ];

    for (const d of detalles) {
      const sub = d.cant * d.precio;
      await qr.query(
        `INSERT INTO ot_detalle (ot_id, tipo, repuesto_id, descripcion, cantidad, precio_unit, descuento, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,0,$7)`,
        [otIds[d.ot], d.tipo, d.rep !== null ? repIds[d.rep] : null, d.desc, d.cant, d.precio, sub],
      );
    }
    console.log(`  ✔ ${detalles.length} detalles de OT creados`);

    // ── Pagos (para OTs entregadas/facturadas) ──
    const pagos = [
      { ot: 0, monto: 78504, metodo: 'transferencia', fecha: daysAgo(23) },
      { ot: 1, monto: 83276, metodo: 'tarjeta_debito', fecha: daysAgo(17) },
      { ot: 2, monto: 49956, metodo: 'efectivo', fecha: daysAgo(13) },
    ];
    for (const p of pagos) {
      await qr.query(
        `INSERT INTO pago (ot_id, taller_id, monto, metodo_pago, fecha_pago)
         VALUES ($1,$2,$3,$4,$5)`,
        [otIds[p.ot], tallerId, p.monto, p.metodo, p.fecha],
      );
    }
    console.log(`  ✔ ${pagos.length} pagos registrados`);

    // ── Facturas (OT facturada) ──
    await qr.query(
      `INSERT INTO factura (ot_id, taller_id, numero_dte, tipo_dte, rut_receptor, monto_neto, iva, monto_total, estado_sii)
       VALUES ($1,$2,'B-00001','boleta',$3,$4,$5,$6,'aceptado')`,
      [otIds[2], tallerId, '13.456.789-0', 41980, 7976, 49956],
    );
    console.log('  ✔ 1 factura creada');

    // ── Presupuestos ──
    const presuData = [
      { ot: 3, numero: 'PRES-2026-0001', estado: 'aprobado', sub: 185000, iva: 35150, total: 220150 },
      { ot: 9, numero: 'PRES-2026-0002', estado: 'enviado', sub: 119970, iva: 22794, total: 142764 },
    ];
    for (const pr of presuData) {
      await qr.query(
        `INSERT INTO presupuesto (ot_id, taller_id, numero, estado, subtotal, iva, total, enviado_email)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [otIds[pr.ot], tallerId, pr.numero, pr.estado, pr.sub, pr.iva, pr.total, pr.estado === 'enviado'],
      );
    }
    console.log(`  ✔ ${presuData.length} presupuestos creados`);

    // ── Movimientos de stock ──
    const movData = [
      { rep: 0, tipo: 'entrada', cant: 30, motivo: 'Compra inicial', user: userIds[4] },
      { rep: 1, tipo: 'entrada', cant: 20, motivo: 'Compra inicial', user: userIds[4] },
      { rep: 2, tipo: 'entrada', cant: 15, motivo: 'Compra inicial', user: userIds[4] },
      { rep: 3, tipo: 'entrada', cant: 25, motivo: 'Compra inicial', user: userIds[4] },
      { rep: 0, tipo: 'salida', cant: 2, motivo: 'Usado en OT-2026-0001 y OT-2026-0003', user: userIds[0] },
      { rep: 3, tipo: 'salida', cant: 3, motivo: 'Usado en OTs varias', user: userIds[0] },
      { rep: 2, tipo: 'salida', cant: 2, motivo: 'Usado en OT-2026-0002', user: userIds[1] },
    ];
    for (const mv of movData) {
      await qr.query(
        `INSERT INTO movimiento_stock (repuesto_id, tipo, cantidad, motivo, usuario_id)
         VALUES ($1,$2,$3,$4,$5)`,
        [repIds[mv.rep], mv.tipo, mv.cant, mv.motivo, mv.user],
      );
    }
    console.log(`  ✔ ${movData.length} movimientos de stock creados`);

    // ── Checklist de recepción (OT-0009 recién ingresada) ──
    const zonas = ['frente', 'trasera', 'lat_izq', 'lat_der', 'techo', 'interior'];
    for (const z of zonas) {
      await qr.query(
        `INSERT INTO checklist_recepcion (ot_id, zona_vehiculo, estado, notas)
         VALUES ($1,$2,'ok','Sin observaciones')`,
        [otIds[8], z],
      );
    }
    console.log('  ✔ Checklist de recepción creado');

    // ── Recordatorios ──
    const recData = [
      { cli: 0, veh: 0, tipo: 'rev_tecnica', msg: 'Su revisión técnica vence el 15 de abril 2026.', fecha: daysAgo(-38) },
      { cli: 1, veh: 2, tipo: 'mantencion', msg: 'Han pasado 6 meses desde su última mantención. Agende su próxima visita.', fecha: daysAgo(-15) },
      { cli: 3, veh: 5, tipo: 'soap', msg: 'Su SOAP vence el 31 de marzo 2026.', fecha: daysAgo(-23) },
      { cli: 6, veh: 9, tipo: 'mantencion', msg: 'Mantención de 10.000 km recomendada.', fecha: daysAgo(-30) },
      { cli: 4, veh: 6, tipo: 'seguimiento', msg: '¿Cómo está funcionando su vehículo después de la reparación?', fecha: daysAgo(-7) },
    ];
    for (const r of recData) {
      await qr.query(
        `INSERT INTO recordatorio (taller_id, cliente_id, vehiculo_id, tipo, mensaje, fecha_envio, canal, estado)
         VALUES ($1,$2,$3,$4,$5,$6,'email','pendiente')`,
        [tallerId, cliIds[r.cli], vehIds[r.veh], r.tipo, r.msg, r.fecha],
      );
    }
    console.log(`  ✔ ${recData.length} recordatorios creados`);

    await qr.commitTransaction();
    console.log('\n✅ Demo data seeded successfully!');
  } catch (err) {
    await qr.rollbackTransaction();
    throw err;
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

seedDemo().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
