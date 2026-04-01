import { DataSource } from 'typeorm';
import { Plan } from '../entities/plan.entity.js';

export async function seedPlanes(dataSource: DataSource) {
  const repo = dataSource.getRepository(Plan);
  const planes = [
    {
      nombre: 'admin',
      precio_mensual: 0,
      precio_anual: 0,
      max_usuarios: 999999,
      max_ots_mes: 999999,
      max_vehiculos: 999999,
      max_storage_mb: 999999,
      tiene_facturacion: true,
      tiene_whatsapp: true,
      tiene_portal: true,
      tiene_reportes: true,
      tiene_api: true,
    },
    {
      nombre: 'free',
      precio_mensual: 0,
      precio_anual: 0,
      max_usuarios: 2,
      max_ots_mes: 5,
      max_vehiculos: 50,
      max_storage_mb: 500,
      tiene_facturacion: false,
      tiene_whatsapp: false,
      tiene_portal: false,
      tiene_reportes: false,
      tiene_api: false,
    },
    {
      nombre: 'starter',
      precio_mensual: 29990,
      precio_anual: 305898,
      max_usuarios: 5,
      max_ots_mes: 200,
      max_vehiculos: 500,
      max_storage_mb: 5000,
      tiene_facturacion: true,
      tiene_whatsapp: false,
      tiene_portal: true,
      tiene_reportes: false,
      tiene_api: false,
    },
    {
      nombre: 'pro',
      precio_mensual: 59990,
      precio_anual: 611898,
      max_usuarios: 15,
      max_ots_mes: 999999,
      max_vehiculos: 999999,
      max_storage_mb: 50000,
      tiene_facturacion: true,
      tiene_whatsapp: true,
      tiene_portal: true,
      tiene_reportes: true,
      tiene_api: false,
    },
    {
      nombre: 'enterprise',
      precio_mensual: 0,
      precio_anual: 0,
      max_usuarios: 999999,
      max_ots_mes: 999999,
      max_vehiculos: 999999,
      max_storage_mb: 999999,
      tiene_facturacion: true,
      tiene_whatsapp: true,
      tiene_portal: true,
      tiene_reportes: true,
      tiene_api: true,
    },
  ];

  for (const plan of planes) {
    const existe = await repo.findOneBy({ nombre: plan.nombre });
    if (!existe) {
      await repo.save(repo.create(plan));
    }
  }
  console.log('Planes seeded successfully');
}
