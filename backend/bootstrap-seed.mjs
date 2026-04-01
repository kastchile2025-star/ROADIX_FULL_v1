import pg from 'pg';
import bcrypt from 'bcrypt';

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  user: 'roadix_user',
  password: 'roadix_dev_pass',
  database: 'roadix',
});

await client.connect();
const hash = await bcrypt.hash('admin123', 12);

// Get pro plan id
const planRes = await client.query("SELECT id FROM plan WHERE nombre='pro'");
const planId = planRes.rows[0]?.id || 1;

// Create taller
await client.query(
  `INSERT INTO taller (id, nombre, rut, direccion, telefono)
   VALUES (1, 'Taller Demo Roadix', '76.123.456-7', 'Av. Libertador 1234, Santiago', '+56222334455')
   ON CONFLICT (id) DO NOTHING`
);
console.log('  ✔ Taller created');

// Create suscripcion
await client.query(
  `INSERT INTO suscripcion (taller_id, plan_id, estado, periodo, fecha_inicio, proximo_cobro)
   VALUES (1, $1, 'activa', 'mensual', NOW(), NOW() + INTERVAL '30 days')
   ON CONFLICT DO NOTHING`,
  [planId]
);
console.log('  ✔ Suscripcion created');

// Create admin user
await client.query(
  `INSERT INTO usuario (id, taller_id, nombre, email, password, rol, activo)
   VALUES (1, 1, 'Administrador', 'admin', $1, 'admin_taller', true)
   ON CONFLICT (id) DO UPDATE SET email='admin', password=$1`,
  [hash]
);
console.log('  ✔ Admin user created');
console.log('\n  Login: admin / admin123');

await client.end();
