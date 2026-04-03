/**
 * Seed script for Roadix production - populates all sections with demo data.
 * Usage: node seed-production.mjs https://roadix-full-v2.onrender.com
 */

const API = (process.argv[2] || 'https://roadix-full-v2.onrender.com') + '/api';
let TOKEN = '';
const ADMIN_LOGIN = 'admin';
const ADMIN_EMAIL = 'admin@roadix.cl';
const ADMIN_PASSWORD = '1234';
const LEGACY_ADMIN_PASSWORD = 'Admin123!';

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok && res.status !== 409) console.error(`  âœ— POST ${path} â†’ ${res.status}`, typeof data === 'object' ? data.message : data);
  else console.log(`  âœ“ POST ${path} â†’ ${res.status}`);
  return { status: res.status, data };
}

async function get(path) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  return res.json();
}

async function put(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) console.error(`  âœ— PUT ${path} â†’ ${res.status}`, data.message);
  else console.log(`  âœ“ PUT ${path} â†’ ${res.status}`);
  return { status: res.status, data };
}

async function patch(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) console.error(`  âœ— PATCH ${path} â†’ ${res.status}`, data.message);
  else console.log(`  âœ“ PATCH ${path} â†’ ${res.status}`);
  return { status: res.status, data };
}

async function tryAdminLogin(email, password) {
  const result = await post('/auth/login', { email, password });
  return result.data?.accessToken ? result : null;
}

async function loginAdminWithCurrentPassword() {
  return (
    await tryAdminLogin(ADMIN_LOGIN, ADMIN_PASSWORD)
    ?? await tryAdminLogin(ADMIN_EMAIL, ADMIN_PASSWORD)
  );
}

async function loginAdminWithLegacyPassword() {
  return (
    await tryAdminLogin(ADMIN_LOGIN, LEGACY_ADMIN_PASSWORD)
    ?? await tryAdminLogin(ADMIN_EMAIL, LEGACY_ADMIN_PASSWORD)
  );
}

// â”€â”€â”€ 1. Register admin taller â”€â”€â”€
async function seedAdmin() {
  console.log('\nâ•â•â• 1. ADMIN â•â•â•');
  let authResult = await loginAdminWithCurrentPassword();

  if (!authResult) {
    const legacyAuthResult = await loginAdminWithLegacyPassword();
    if (legacyAuthResult) {
      TOKEN = legacyAuthResult.data.accessToken;
      await post('/auth/change-password', {
        currentPassword: LEGACY_ADMIN_PASSWORD,
        newPassword: ADMIN_PASSWORD,
      });
      console.log('  → Password changed to 1234');
      authResult = await loginAdminWithCurrentPassword();
    }
  }

  if (!authResult) {
    const registerResult = await post('/auth/register', {
      taller_nombre: 'Taller Automotriz Roadix Demo',
      taller_rut: '76.543.210-K',
      nombre: 'Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (registerResult.data?.accessToken) {
      authResult = registerResult;
    } else {
      authResult = await loginAdminWithCurrentPassword();
    }
  }

  TOKEN = authResult?.data?.accessToken ?? '';
  if (!TOKEN) { console.error('FATAL: could not authenticate'); process.exit(1); }

  // Update taller info
  await put('/talleres/mi-taller', {
    nombre: 'Taller Automotriz Roadix Demo',
    rut: '76.543.210-K',
    direccion: 'Av. Providencia 1234, Oficina 501, Providencia, Santiago',
    telefono: '+56 2 2345 6789',
    email: 'contacto@roadix.cl',
    horario: 'Lunes a Viernes 08:00 â€“ 18:00 | SÃ¡bado 09:00 â€“ 14:00',
  });
}

// â”€â”€â”€ 2. Users of all roles â”€â”€â”€
async function seedUsuarios() {
  console.log('\nâ•â•â• 2. USUARIOS â•â•â•');
  const users = [
    { nombre: 'Carlos MÃ©ndez', email: 'carlos@roadix.cl', password: '1234', rol: 'recepcionista', telefono: '+56 9 8765 4321' },
    { nombre: 'Pedro GonzÃ¡lez', email: 'pedro@roadix.cl', password: '1234', rol: 'mecanico', telefono: '+56 9 7654 3210' },
    { nombre: 'Luis Herrera', email: 'luis@roadix.cl', password: '1234', rol: 'mecanico', telefono: '+56 9 6543 2109' },
    { nombre: 'MarÃ­a Contreras', email: 'maria@roadix.cl', password: '1234', rol: 'mecanico', telefono: '+56 9 5432 1098' },
    { nombre: 'Ana Rojas', email: 'ana@roadix.cl', password: '1234', rol: 'bodeguero', telefono: '+56 9 4321 0987' },
    { nombre: 'SofÃ­a MuÃ±oz', email: 'sofia@roadix.cl', password: '1234', rol: 'cajero', telefono: '+56 9 3210 9876' },
    { nombre: 'Rodrigo Soto', email: 'rodrigo@roadix.cl', password: '1234', rol: 'viewer', telefono: '+56 9 2109 8765' },
    { nombre: 'Fernando DÃ­az', email: 'fernando@roadix.cl', password: '1234', rol: 'recepcionista', telefono: '+56 9 1098 7654' },
    { nombre: 'Patricia Vergara', email: 'patricia@roadix.cl', password: '1234', rol: 'cajero', telefono: '+56 9 9988 7766' },
    { nombre: 'Diego RamÃ­rez', email: 'diego@roadix.cl', password: '1234', rol: 'mecanico', telefono: '+56 9 8877 6655' },
  ];
  for (const u of users) await post('/usuarios', u);
}

// â”€â”€â”€ 3. MecÃ¡nicos â”€â”€â”€
async function seedMecanicos() {
  console.log('\nâ•â•â• 3. MECÃNICOS â•â•â•');
  // Get users with rol mecanico
  const usuarios = await get('/usuarios');
  const mecUsers = (usuarios || []).filter(u => u.rol === 'mecanico');
  const especialidades = [
    'Motor y transmisiÃ³n', 'Electricidad automotriz', 'Frenos y suspensiÃ³n', 'Pintura y desabolladura'
  ];
  const tarifas = [25000, 22000, 28000, 30000];
  for (let i = 0; i < mecUsers.length; i++) {
    await post('/mecanicos', {
      usuario_id: mecUsers[i].id,
      especialidad: especialidades[i % especialidades.length],
      tarifa_hora: tarifas[i % tarifas.length],
    });
  }
  // Extra mechanics without user accounts
  await post('/mecanicos', { especialidad: 'AlineaciÃ³n y balanceo', tarifa_hora: 20000 });
  await post('/mecanicos', { especialidad: 'DiagnÃ³stico computarizado', tarifa_hora: 35000 });
}

// â”€â”€â”€ 4. Clientes â”€â”€â”€
async function seedClientes() {
  console.log('\nâ•â•â• 4. CLIENTES â•â•â•');
  const clientes = [
    { nombre: 'Juan PÃ©rez Morales', rut: '12.345.678-9', email: 'juan.perez@email.com', telefono: '+56 9 1111 2222', direccion: 'Los Alerces 456, Las Condes', tipo: 'persona' },
    { nombre: 'MarÃ­a LÃ³pez Fuentes', rut: '13.456.789-0', email: 'maria.lopez@email.com', telefono: '+56 9 2222 3333', direccion: 'Av. Apoquindo 3200, Las Condes', tipo: 'persona' },
    { nombre: 'Transportes del Sur SpA', rut: '77.888.999-1', email: 'flota@transportesdelsur.cl', telefono: '+56 2 3333 4444', direccion: 'Ruta 5 Sur Km 45, Rancagua', tipo: 'empresa' },
    { nombre: 'Roberto SÃ¡nchez Aravena', rut: '14.567.890-1', email: 'roberto.sanchez@email.com', telefono: '+56 9 4444 5555', direccion: 'Calle Nueva 789, Ã‘uÃ±oa', tipo: 'persona' },
    { nombre: 'Inmobiliaria Los Andes Ltda', rut: '78.111.222-3', email: 'admin@losandes.cl', telefono: '+56 2 5555 6666', direccion: 'Av. Kennedy 5000, Vitacura', tipo: 'empresa' },
    { nombre: 'Carolina Figueroa Bravo', rut: '15.678.901-2', email: 'carolina.fig@email.com', telefono: '+56 9 6666 7777', direccion: 'Pasaje Los Olmos 12, Macul', tipo: 'persona' },
    { nombre: 'AndrÃ©s Vargas Torres', rut: '16.789.012-3', email: 'andres.vargas@email.com', telefono: '+56 9 7777 8888', direccion: 'Av. IrarrÃ¡zaval 2100, Ã‘uÃ±oa', tipo: 'persona' },
    { nombre: 'Distribuidora Nacional SpA', rut: '79.222.333-4', email: 'compras@distnac.cl', telefono: '+56 2 8888 9999', direccion: 'Bodega Central, MaipÃº', tipo: 'empresa' },
    { nombre: 'Francisca Reyes Godoy', rut: '17.890.123-4', email: 'francisca.reyes@email.com', telefono: '+56 9 9999 0000', direccion: 'Calle Sur 345, La Florida', tipo: 'persona' },
    { nombre: 'Pablo Moreno Castro', rut: '18.901.234-5', email: 'pablo.moreno@email.com', telefono: '+56 9 1234 5678', direccion: 'Av. Grecia 1500, PeÃ±alolÃ©n', tipo: 'persona' },
    { nombre: 'Servicios Industriales Norte Ltda', rut: '80.333.444-5', email: 'servicios@sinorte.cl', telefono: '+56 2 2468 1357', direccion: 'Parque Industrial, Quilicura', tipo: 'empresa' },
    { nombre: 'Valentina MuÃ±oz Pinto', rut: '19.012.345-6', email: 'vale.munoz@email.com', telefono: '+56 9 3456 7890', direccion: 'Paseo HuÃ©rfanos 1234, Santiago Centro', tipo: 'persona' },
    { nombre: 'MatÃ­as Herrera Silva', rut: '20.123.456-7', email: 'matias.herrera@email.com', telefono: '+56 9 4567 8901', direccion: 'Los Militares 5800, Las Condes', tipo: 'persona' },
    { nombre: 'LogÃ­stica Express SpA', rut: '81.444.555-6', email: 'operaciones@logexpress.cl', telefono: '+56 2 5678 9012', direccion: 'Av. AmÃ©rico Vespucio 2000, Pudahuel', tipo: 'empresa' },
    { nombre: 'Isabel Torres Cifuentes', rut: '21.234.567-8', email: 'isabel.torres@email.com', telefono: '+56 9 6789 0123', direccion: 'Calle Larga 567, Providencia', tipo: 'persona' },
  ];
  const result = [];
  for (const c of clientes) {
    const r = await post('/clientes', c);
    if (r.data?.id) result.push(r.data);
  }
  return result;
}

// â”€â”€â”€ 5. VehÃ­culos â”€â”€â”€
async function seedVehiculos(clientes) {
  console.log('\nâ•â•â• 5. VEHÃCULOS â•â•â•');
  if (!clientes.length) { clientes = await get('/clientes'); }
  const vehiculos = [
    { patente: 'BBCL-12', marca: 'Toyota', modelo: 'Corolla', anio: 2022, color: 'Blanco', tipo_vehiculo: 'automovil', combustible: 'bencina', km_actual: 45200, vin: 'JTDKN3DU5A0123456' },
    { patente: 'FFGH-34', marca: 'Chevrolet', modelo: 'Spark', anio: 2020, color: 'Rojo', tipo_vehiculo: 'automovil', combustible: 'bencina', km_actual: 62800 },
    { patente: 'HJKL-56', marca: 'Hyundai', modelo: 'Tucson', anio: 2023, color: 'Gris', tipo_vehiculo: 'suv', combustible: 'diesel', km_actual: 28500, vin: 'KMHJ3814DP0987654' },
    { patente: 'RTYU-78', marca: 'Kia', modelo: 'Sportage', anio: 2021, color: 'Negro', tipo_vehiculo: 'suv', combustible: 'bencina', km_actual: 55300 },
    { patente: 'BNMQ-90', marca: 'Ford', modelo: 'Ranger', anio: 2023, color: 'Azul', tipo_vehiculo: 'camioneta', combustible: 'diesel', km_actual: 15800, vin: 'MNAFXXMAWPBC12345' },
    { patente: 'WXYZ-11', marca: 'Nissan', modelo: 'Frontier', anio: 2019, color: 'Plateado', tipo_vehiculo: 'camioneta', combustible: 'diesel', km_actual: 98700 },
    { patente: 'DCVB-22', marca: 'Suzuki', modelo: 'Swift', anio: 2021, color: 'Blanco', tipo_vehiculo: 'automovil', combustible: 'bencina', km_actual: 38100 },
    { patente: 'LKJH-33', marca: 'Mazda', modelo: 'CX-5', anio: 2022, color: 'Rojo', tipo_vehiculo: 'suv', combustible: 'bencina', km_actual: 31200, vin: 'JM3KFBCM5N0654321' },
    { patente: 'ZXCV-44', marca: 'Mitsubishi', modelo: 'L200', anio: 2020, color: 'Blanco', tipo_vehiculo: 'camioneta', combustible: 'diesel', km_actual: 112000 },
    { patente: 'QWER-55', marca: 'Volkswagen', modelo: 'Amarok', anio: 2023, color: 'Gris Oscuro', tipo_vehiculo: 'camioneta', combustible: 'diesel', km_actual: 8900, vin: '2V4RW3D19PR123456' },
    { patente: 'ASDF-66', marca: 'Peugeot', modelo: '208', anio: 2022, color: 'Naranja', tipo_vehiculo: 'automovil', combustible: 'bencina', km_actual: 22300 },
    { patente: 'TYUI-77', marca: 'Renault', modelo: 'Duster', anio: 2021, color: 'Beige', tipo_vehiculo: 'suv', combustible: 'bencina', km_actual: 67500 },
    { patente: 'GHJK-88', marca: 'Toyota', modelo: 'Hilux', anio: 2023, color: 'Negro', tipo_vehiculo: 'camioneta', combustible: 'diesel', km_actual: 5200, vin: 'AHTFZ29G909876543' },
    { patente: 'POIU-99', marca: 'Honda', modelo: 'CR-V', anio: 2020, color: 'Azul Marino', tipo_vehiculo: 'suv', combustible: 'bencina', km_actual: 74800 },
    { patente: 'MNBV-00', marca: 'Fiat', modelo: 'Cronos', anio: 2021, color: 'Gris Plata', tipo_vehiculo: 'automovil', combustible: 'bencina', km_actual: 41600 },
    { patente: 'CVBN-13', marca: 'Jeep', modelo: 'Compass', anio: 2022, color: 'Verde', tipo_vehiculo: 'suv', combustible: 'bencina', km_actual: 19500 },
    { patente: 'SDFG-24', marca: 'CitroÃ«n', modelo: 'C3', anio: 2020, color: 'Blanco', tipo_vehiculo: 'automovil', combustible: 'bencina', km_actual: 58200 },
    { patente: 'WERT-35', marca: 'Subaru', modelo: 'Forester', anio: 2023, color: 'Verde Oscuro', tipo_vehiculo: 'suv', combustible: 'bencina', km_actual: 12100, vin: 'JF2SJABC2P0112233' },
    { patente: 'YUIO-46', marca: 'Mercedes-Benz', modelo: 'Sprinter', anio: 2019, color: 'Blanco', tipo_vehiculo: 'van', combustible: 'diesel', km_actual: 145000 },
    { patente: 'DFGH-57', marca: 'Yamaha', modelo: 'MT-07', anio: 2022, color: 'Negro/Azul', tipo_vehiculo: 'moto', combustible: 'bencina', km_actual: 8500 },
  ];
  const result = [];
  for (let i = 0; i < vehiculos.length; i++) {
    const cid = clientes[i % clientes.length]?.id;
    if (!cid) continue;
    const fut = new Date(); fut.setMonth(fut.getMonth() + Math.floor(Math.random() * 12));
    const r = await post('/vehiculos', {
      ...vehiculos[i],
      cliente_id: cid,
      rev_tecnica: fut.toISOString().split('T')[0],
      soap_vence: fut.toISOString().split('T')[0],
    });
    if (r.data?.id) result.push(r.data);
  }
  return result;
}

// â”€â”€â”€ 6. Proveedores â”€â”€â”€
async function seedProveedores() {
  console.log('\nâ•â•â• 6. PROVEEDORES â•â•â•');
  const proveedores = [
    { razon_social: 'Repuestos Chile SpA', rut: '76.111.222-3', contacto: 'Javier Arriagada', email: 'ventas@repuestoschile.cl', telefono: '+56 2 3456 7890' },
    { razon_social: 'AutoPartes del PacÃ­fico Ltda', rut: '77.222.333-4', contacto: 'Carolina Tapia', email: 'pedidos@autopartes.cl', telefono: '+56 2 4567 8901' },
    { razon_social: 'Distribuidora Frenos y MÃ¡s SpA', rut: '78.333.444-5', contacto: 'Marcos Fuentes', email: 'info@frenosymas.cl', telefono: '+56 2 5678 9012' },
    { razon_social: 'Lubricantes Premium SA', rut: '79.444.555-6', contacto: 'Patricia Godoy', email: 'ventas@lubpremium.cl', telefono: '+56 2 6789 0123' },
    { razon_social: 'NeumÃ¡ticos Sur SpA', rut: '80.555.666-7', contacto: 'Diego Mora', email: 'compras@neumsur.cl', telefono: '+56 2 7890 1234' },
    { razon_social: 'Electro Auto Ltda', rut: '81.666.777-8', contacto: 'Lorena Vidal', email: 'soporte@electroauto.cl', telefono: '+56 2 8901 2345' },
    { razon_social: 'Importadora Automotriz Tokio', rut: '82.777.888-9', contacto: 'Takeshi Nakamura', email: 'import@tokioauto.cl', telefono: '+56 2 9012 3456' },
    { razon_social: 'Filtros y Correas Express', rut: '83.888.999-0', contacto: 'Manuel Bravo', email: 'pedidos@filtrosexp.cl', telefono: '+56 2 0123 4567' },
  ];
  const result = [];
  for (const p of proveedores) {
    const r = await post('/proveedores', p);
    if (r.data?.id) result.push(r.data);
  }
  return result;
}

// â”€â”€â”€ 7. Repuestos â”€â”€â”€
async function seedRepuestos(proveedores) {
  console.log('\nâ•â•â• 7. REPUESTOS (Inventario) â•â•â•');
  if (!proveedores.length) proveedores = await get('/proveedores');
  const repuestos = [
    { nombre: 'Filtro de aceite Toyota', codigo: 'FIL-ACE-001', categoria: 'Filtros', precio_compra: 4500, precio_venta: 8900, stock_actual: 45, stock_minimo: 10, ubicacion_bodega: 'Estante A-1' },
    { nombre: 'Filtro de aire Hyundai', codigo: 'FIL-AIR-002', categoria: 'Filtros', precio_compra: 6200, precio_venta: 12500, stock_actual: 30, stock_minimo: 8, ubicacion_bodega: 'Estante A-1' },
    { nombre: 'Pastillas de freno delanteras', codigo: 'FRE-PAD-001', categoria: 'Frenos', precio_compra: 18000, precio_venta: 35000, stock_actual: 20, stock_minimo: 5, ubicacion_bodega: 'Estante B-2' },
    { nombre: 'Discos de freno delanteros', codigo: 'FRE-DIS-001', categoria: 'Frenos', precio_compra: 32000, precio_venta: 58000, stock_actual: 12, stock_minimo: 4, ubicacion_bodega: 'Estante B-2' },
    { nombre: 'Aceite motor 5W-30 (5L)', codigo: 'LUB-MOT-001', categoria: 'Lubricantes', precio_compra: 22000, precio_venta: 38000, stock_actual: 60, stock_minimo: 15, ubicacion_bodega: 'Estante C-1' },
    { nombre: 'Aceite motor 10W-40 (4L)', codigo: 'LUB-MOT-002', categoria: 'Lubricantes', precio_compra: 18000, precio_venta: 32000, stock_actual: 40, stock_minimo: 10, ubicacion_bodega: 'Estante C-1' },
    { nombre: 'BaterÃ­a 12V 60Ah', codigo: 'ELE-BAT-001', categoria: 'ElÃ©ctrico', precio_compra: 55000, precio_venta: 89000, stock_actual: 8, stock_minimo: 3, ubicacion_bodega: 'Estante D-1' },
    { nombre: 'BujÃ­as Iridium (juego x4)', codigo: 'ENC-BUJ-001', categoria: 'Encendido', precio_compra: 28000, precio_venta: 48000, stock_actual: 15, stock_minimo: 5, ubicacion_bodega: 'Estante A-3' },
    { nombre: 'Correa de distribuciÃ³n', codigo: 'MOT-COR-001', categoria: 'Motor', precio_compra: 35000, precio_venta: 62000, stock_actual: 6, stock_minimo: 3, ubicacion_bodega: 'Estante E-1' },
    { nombre: 'Amortiguador delantero', codigo: 'SUS-AMO-001', categoria: 'SuspensiÃ³n', precio_compra: 42000, precio_venta: 72000, stock_actual: 10, stock_minimo: 4, ubicacion_bodega: 'Estante B-3' },
    { nombre: 'Kit de embrague completo', codigo: 'TRA-EMB-001', categoria: 'TransmisiÃ³n', precio_compra: 85000, precio_venta: 145000, stock_actual: 4, stock_minimo: 2, ubicacion_bodega: 'Estante E-2' },
    { nombre: 'Refrigerante (5L)', codigo: 'REF-LIQ-001', categoria: 'RefrigeraciÃ³n', precio_compra: 8000, precio_venta: 15000, stock_actual: 35, stock_minimo: 10, ubicacion_bodega: 'Estante C-2' },
    { nombre: 'NeumÃ¡tico 195/65R15', codigo: 'NEU-195-001', categoria: 'NeumÃ¡ticos', precio_compra: 38000, precio_venta: 62000, stock_actual: 16, stock_minimo: 4, ubicacion_bodega: 'Bodega Exterior' },
    { nombre: 'NeumÃ¡tico 235/75R15 AT', codigo: 'NEU-235-001', categoria: 'NeumÃ¡ticos', precio_compra: 65000, precio_venta: 98000, stock_actual: 8, stock_minimo: 4, ubicacion_bodega: 'Bodega Exterior' },
    { nombre: 'Limpiaparabrisas 22"', codigo: 'ACC-LIM-001', categoria: 'Accesorios', precio_compra: 4000, precio_venta: 8500, stock_actual: 25, stock_minimo: 8, ubicacion_bodega: 'Estante A-2' },
    { nombre: 'Filtro de combustible diesel', codigo: 'FIL-COM-001', categoria: 'Filtros', precio_compra: 12000, precio_venta: 22000, stock_actual: 18, stock_minimo: 6, ubicacion_bodega: 'Estante A-1' },
    { nombre: 'Bomba de agua universal', codigo: 'REF-BOM-001', categoria: 'RefrigeraciÃ³n', precio_compra: 28000, precio_venta: 48000, stock_actual: 7, stock_minimo: 3, ubicacion_bodega: 'Estante E-1' },
    { nombre: 'Alternador 12V reacondicionado', codigo: 'ELE-ALT-001', categoria: 'ElÃ©ctrico', precio_compra: 65000, precio_venta: 110000, stock_actual: 3, stock_minimo: 2, ubicacion_bodega: 'Estante D-2' },
    { nombre: 'Junta de culata', codigo: 'MOT-JUN-001', categoria: 'Motor', precio_compra: 45000, precio_venta: 78000, stock_actual: 5, stock_minimo: 2, ubicacion_bodega: 'Estante E-1' },
    { nombre: 'LÃ­quido de frenos DOT 4 (1L)', codigo: 'FRE-LIQ-001', categoria: 'Frenos', precio_compra: 5500, precio_venta: 11000, stock_actual: 20, stock_minimo: 8, ubicacion_bodega: 'Estante C-2' },
  ];
  const result = [];
  for (let i = 0; i < repuestos.length; i++) {
    const r = await post('/repuestos', {
      ...repuestos[i],
      proveedor_id: proveedores[i % proveedores.length]?.id,
    });
    if (r.data?.id) result.push(r.data);
  }
  return result;
}

// â”€â”€â”€ 8. Ã“rdenes de Trabajo â”€â”€â”€
async function seedOrdenes(clientes, vehiculos) {
  console.log('\nâ•â•â• 8. Ã“RDENES DE TRABAJO â•â•â•');
  if (!clientes.length) clientes = await get('/clientes');
  if (!vehiculos.length) vehiculos = await get('/vehiculos');
  const mecanicos = await get('/mecanicos');

  const ordenes = [
    { tipo_servicio: 'MantenciÃ³n 30.000 km', diagnostico: 'MantenciÃ³n preventiva completa. Cambio de aceite, filtros, revisiÃ³n de frenos y estado general.', prioridad: 'media', observaciones: 'Cliente solicita revisiÃ³n adicional de ruido en suspensiÃ³n delantera izquierda.', km_ingreso: 30150 },
    { tipo_servicio: 'ReparaciÃ³n de frenos', diagnostico: 'Pastillas de freno delanteras al 15% de vida Ãºtil. Discos con desgaste irregular. Requiere cambio completo.', prioridad: 'alta', observaciones: 'VehÃ­culo presenta vibraciÃ³n al frenar a alta velocidad.', km_ingreso: 62800 },
    { tipo_servicio: 'DiagnÃ³stico motor', diagnostico: 'Motor presenta pÃ©rdida de potencia y consumo excesivo. Posible falla en inyectores o sensor MAP.', prioridad: 'alta', observaciones: 'Luz check engine encendida desde hace 2 semanas.', km_ingreso: 98700 },
    { tipo_servicio: 'Cambio de correa distribuciÃ³n', diagnostico: 'Correa de distribuciÃ³n con 100.000 km de uso. Requiere cambio preventivo urgente junto con tensor y bomba de agua.', prioridad: 'urgente', observaciones: 'VehÃ­culo con alto kilometraje, priorizar para evitar rotura.', km_ingreso: 112000 },
    { tipo_servicio: 'AlineaciÃ³n y balanceo', diagnostico: 'Desgaste irregular en neumÃ¡ticos delanteros. Requiere alineaciÃ³n 3D y balanceo de las 4 ruedas.', prioridad: 'baja', observaciones: 'Cliente reporta que vehÃ­culo tira hacia la derecha.', km_ingreso: 55300 },
    { tipo_servicio: 'Cambio de baterÃ­a', diagnostico: 'BaterÃ­a no mantiene carga. Prueba de carga indica celda daÃ±ada. Requiere reemplazo.', prioridad: 'media', observaciones: 'Auto no arranca en las maÃ±anas frÃ­as.', km_ingreso: 38100 },
    { tipo_servicio: 'EscÃ¡ner + MantenciÃ³n 60.000 km', diagnostico: 'MantenciÃ³n mayor: cambio de aceite, filtros aire/aceite/combustible, bujÃ­as, revisiÃ³n de sistemas electrÃ³nicos.', prioridad: 'media', observaciones: 'Incluir lavado de inyectores como servicio adicional.', km_ingreso: 60200 },
    { tipo_servicio: 'ReparaciÃ³n de suspensiÃ³n', diagnostico: 'Amortiguador delantero derecho con fuga de aceite. Buje de bandera inferior desgastado.', prioridad: 'alta', observaciones: 'Sonido metÃ¡lico al pasar topes. Agendar para primer horario.', km_ingreso: 74800 },
    { tipo_servicio: 'Cambio de embrague', diagnostico: 'Embrague patina en marchas altas. Disco de embrague al 5% de vida Ãºtil. Cambio completo de kit.', prioridad: 'alta', observaciones: 'VehÃ­culo de flota empresarial, necesitan entrega rÃ¡pida.', km_ingreso: 145000 },
    { tipo_servicio: 'RevisiÃ³n pre-compra', diagnostico: 'InspecciÃ³n completa de 120 puntos para evaluaciÃ³n de compra. Motor, transmisiÃ³n, carrocerÃ­a, electricidad.', prioridad: 'baja', observaciones: 'Potencial comprador solicita informe detallado.', km_ingreso: 67500 },
    { tipo_servicio: 'Cambio de aceite express', diagnostico: 'Cambio de aceite sintÃ©tico 5W-30 + filtro de aceite.', prioridad: 'baja', observaciones: 'Servicio rÃ¡pido, cliente espera.', km_ingreso: 22300 },
    { tipo_servicio: 'ReparaciÃ³n sistema elÃ©ctrico', diagnostico: 'Alternador no carga correctamente. Voltaje de salida 11.2V (deberÃ­a ser 13.8-14.4V). Requiere reemplazo o reparaciÃ³n.', prioridad: 'urgente', observaciones: 'VehÃ­culo se quedÃ³ en panne elÃ©ctrica anoche.', km_ingreso: 58200 },
  ];

  const estados = ['recepcion', 'diagnostico', 'en_reparacion', 'en_reparacion', 'control_calidad', 'listo', 'entregado', 'facturado', 'presupuesto', 'esperando_aprobacion', 'recepcion', 'en_reparacion'];
  const result = [];

  for (let i = 0; i < ordenes.length; i++) {
    const veh = vehiculos[i % vehiculos.length];
    if (!veh) continue;
    const r = await post('/ordenes-trabajo', {
      vehiculo_id: veh.id,
      cliente_id: veh.cliente_id || clientes[i % clientes.length]?.id,
      mecanico_id: mecanicos[i % mecanicos.length]?.id,
      ...ordenes[i],
      fecha_prometida: new Date(Date.now() + (i + 1) * 86400000 * 2).toISOString().split('T')[0],
    });
    if (r.data?.id) {
      result.push(r.data);
      // Add detalles
      const detalles = getDetallesForOt(i);
      for (const d of detalles) {
        await post(`/ordenes-trabajo/${r.data.id}/detalles`, d);
      }
      // Advance estado
      const target = estados[i];
      const stateOrder = ['recepcion', 'diagnostico', 'presupuesto', 'esperando_aprobacion', 'en_reparacion', 'control_calidad', 'listo', 'entregado', 'facturado'];
      const targetIdx = stateOrder.indexOf(target);
      for (let s = 1; s <= targetIdx; s++) {
        await patch(`/ordenes-trabajo/${r.data.id}/estado`, { estado: stateOrder[s] });
      }
    }
  }
  return result;
}

function getDetallesForOt(index) {
  const sets = [
    // MantenciÃ³n 30k
    [
      { tipo: 'repuesto', descripcion: 'Aceite motor 5W-30 sintÃ©tico (5L)', cantidad: 1, precio_unit: 38000 },
      { tipo: 'repuesto', descripcion: 'Filtro de aceite', cantidad: 1, precio_unit: 8900 },
      { tipo: 'repuesto', descripcion: 'Filtro de aire', cantidad: 1, precio_unit: 12500 },
      { tipo: 'mano_obra', descripcion: 'Mano de obra mantenciÃ³n preventiva', cantidad: 2, precio_unit: 25000 },
      { tipo: 'mano_obra', descripcion: 'RevisiÃ³n de frenos', cantidad: 1, precio_unit: 15000 },
    ],
    // Frenos
    [
      { tipo: 'repuesto', descripcion: 'Pastillas de freno delanteras (juego)', cantidad: 1, precio_unit: 35000 },
      { tipo: 'repuesto', descripcion: 'Discos de freno delanteros (par)', cantidad: 1, precio_unit: 58000 },
      { tipo: 'repuesto', descripcion: 'LÃ­quido de frenos DOT 4', cantidad: 1, precio_unit: 11000 },
      { tipo: 'mano_obra', descripcion: 'Desmontaje y montaje sistema frenos', cantidad: 3, precio_unit: 25000 },
    ],
    // DiagnÃ³stico motor
    [
      { tipo: 'mano_obra', descripcion: 'DiagnÃ³stico computarizado (escÃ¡ner)', cantidad: 1, precio_unit: 35000 },
      { tipo: 'mano_obra', descripcion: 'Prueba de compresiÃ³n cilindros', cantidad: 1, precio_unit: 28000 },
      { tipo: 'mano_obra', descripcion: 'Limpieza de inyectores', cantidad: 1, precio_unit: 45000 },
    ],
    // Correa distribuciÃ³n
    [
      { tipo: 'repuesto', descripcion: 'Kit correa de distribuciÃ³n completo', cantidad: 1, precio_unit: 62000 },
      { tipo: 'repuesto', descripcion: 'Bomba de agua', cantidad: 1, precio_unit: 48000 },
      { tipo: 'repuesto', descripcion: 'Refrigerante (5L)', cantidad: 2, precio_unit: 15000 },
      { tipo: 'mano_obra', descripcion: 'Desmontaje y montaje distribuciÃ³n', cantidad: 6, precio_unit: 25000 },
    ],
    // AlineaciÃ³n
    [
      { tipo: 'mano_obra', descripcion: 'AlineaciÃ³n 3D computarizada', cantidad: 1, precio_unit: 25000 },
      { tipo: 'mano_obra', descripcion: 'Balanceo 4 ruedas', cantidad: 1, precio_unit: 20000 },
    ],
    // BaterÃ­a
    [
      { tipo: 'repuesto', descripcion: 'BaterÃ­a 12V 60Ah', cantidad: 1, precio_unit: 89000 },
      { tipo: 'mano_obra', descripcion: 'InstalaciÃ³n y diagnÃ³stico elÃ©ctrico', cantidad: 1, precio_unit: 15000 },
    ],
    // MantenciÃ³n 60k
    [
      { tipo: 'repuesto', descripcion: 'Aceite motor 5W-30 (5L)', cantidad: 1, precio_unit: 38000 },
      { tipo: 'repuesto', descripcion: 'Filtro de aceite', cantidad: 1, precio_unit: 8900 },
      { tipo: 'repuesto', descripcion: 'Filtro de aire', cantidad: 1, precio_unit: 12500 },
      { tipo: 'repuesto', descripcion: 'Filtro de combustible', cantidad: 1, precio_unit: 22000 },
      { tipo: 'repuesto', descripcion: 'BujÃ­as Iridium x4', cantidad: 1, precio_unit: 48000 },
      { tipo: 'mano_obra', descripcion: 'Mano de obra mantenciÃ³n mayor', cantidad: 4, precio_unit: 25000 },
      { tipo: 'mano_obra', descripcion: 'Lavado de inyectores', cantidad: 1, precio_unit: 45000 },
    ],
    // SuspensiÃ³n
    [
      { tipo: 'repuesto', descripcion: 'Amortiguador delantero derecho', cantidad: 1, precio_unit: 72000 },
      { tipo: 'repuesto', descripcion: 'Buje de bandera inferior', cantidad: 2, precio_unit: 18000 },
      { tipo: 'mano_obra', descripcion: 'Desmontaje y montaje suspensiÃ³n', cantidad: 3, precio_unit: 28000 },
    ],
    // Embrague
    [
      { tipo: 'repuesto', descripcion: 'Kit de embrague completo', cantidad: 1, precio_unit: 145000 },
      { tipo: 'mano_obra', descripcion: 'Desmontaje caja de cambios', cantidad: 4, precio_unit: 30000 },
      { tipo: 'mano_obra', descripcion: 'Montaje y ajuste embrague nuevo', cantidad: 3, precio_unit: 30000 },
    ],
    // RevisiÃ³n pre-compra
    [
      { tipo: 'mano_obra', descripcion: 'InspecciÃ³n 120 puntos completa', cantidad: 1, precio_unit: 55000 },
      { tipo: 'mano_obra', descripcion: 'Informe tÃ©cnico detallado', cantidad: 1, precio_unit: 15000 },
    ],
    // Aceite express
    [
      { tipo: 'repuesto', descripcion: 'Aceite motor 5W-30 (5L)', cantidad: 1, precio_unit: 38000 },
      { tipo: 'repuesto', descripcion: 'Filtro de aceite', cantidad: 1, precio_unit: 8900 },
      { tipo: 'mano_obra', descripcion: 'Cambio de aceite express', cantidad: 1, precio_unit: 15000 },
    ],
    // Sistema elÃ©ctrico
    [
      { tipo: 'repuesto', descripcion: 'Alternador 12V reacondicionado', cantidad: 1, precio_unit: 110000 },
      { tipo: 'mano_obra', descripcion: 'Desmontaje alternador', cantidad: 1, precio_unit: 25000 },
      { tipo: 'mano_obra', descripcion: 'DiagnÃ³stico circuito de carga', cantidad: 1, precio_unit: 35000 },
      { tipo: 'mano_obra', descripcion: 'Montaje y pruebas', cantidad: 2, precio_unit: 25000 },
    ],
  ];
  return sets[index % sets.length];
}

// â”€â”€â”€ 9. Pagos (Caja) â”€â”€â”€
async function seedCaja(ordenes) {
  console.log('\nâ•â•â• 9. CAJA (Pagos) â•â•â•');
  if (!ordenes.length) { const ots = await get('/ordenes-trabajo'); ordenes = ots || []; }
  const metodos = ['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia'];
  // Pay for some OTs (the ones in estado entregado/facturado/listo)
  let paid = 0;
  for (const ot of ordenes) {
    if (['entregado', 'facturado', 'listo', 'control_calidad'].includes(ot.estado)) {
      const monto = 50000 + Math.floor(Math.random() * 200000);
      await post('/caja/cobrar', {
        ot_id: ot.id,
        monto,
        metodo_pago: metodos[paid % metodos.length],
        referencia: `PAG-${String(paid + 1).padStart(4, '0')}`,
      });
      paid++;
    }
  }
}

// â”€â”€â”€ 10. Facturas â”€â”€â”€
async function seedFacturas(ordenes) {
  console.log('\nâ•â•â• 10. FACTURACIÃ“N â•â•â•');
  if (!ordenes.length) { const ots = await get('/ordenes-trabajo'); ordenes = ots || []; }
  for (const ot of ordenes) {
    if (ot.estado === 'facturado') {
      await post('/facturacion/emitir', {
        ot_id: ot.id,
        tipo_dte: Math.random() > 0.5 ? 'boleta' : 'factura',
        rut_receptor: '12.345.678-9',
      });
    }
  }
}

// â”€â”€â”€ MAIN â”€â”€â”€
async function main() {
  console.log(`\nðŸ”§ Seeding Roadix at ${API}\n`);

  await seedAdmin();
  await seedUsuarios();
  await seedMecanicos();
  const clientes = await seedClientes();
  const vehiculos = await seedVehiculos(clientes);
  const proveedores = await seedProveedores();
  await seedRepuestos(proveedores);
  const ordenes = await seedOrdenes(clientes, vehiculos);
  await seedCaja(ordenes);
  await seedFacturas(ordenes);

  console.log('\nâœ… Seed complete!');
  console.log('   Admin login: admin / 1234');
  console.log('   All other users password: 1234\n');
}

main().catch(console.error);
