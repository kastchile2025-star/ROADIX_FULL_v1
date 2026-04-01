import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { Pago } from '../../database/entities/pago.entity.js';
import { OtDetalle } from '../../database/entities/ot-detalle.entity.js';
import { Mecanico } from '../../database/entities/mecanico.entity.js';
import { Repuesto } from '../../database/entities/repuesto.entity.js';
import { Cliente } from '../../database/entities/cliente.entity.js';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(OrdenTrabajo) private otRepo: Repository<OrdenTrabajo>,
    @InjectRepository(Pago) private pagoRepo: Repository<Pago>,
    @InjectRepository(OtDetalle) private detalleRepo: Repository<OtDetalle>,
    @InjectRepository(Mecanico) private mecanicoRepo: Repository<Mecanico>,
    @InjectRepository(Repuesto) private repuestoRepo: Repository<Repuesto>,
    @InjectRepository(Cliente) private clienteRepo: Repository<Cliente>,
  ) {}

  async ingresos(tallerId: number, desde: string, hasta: string, agrupacion: 'dia' | 'semana' | 'mes' = 'dia') {
    const formatMap = { dia: 'YYYY-MM-DD', semana: 'IYYY-IW', mes: 'YYYY-MM' };
    const format = formatMap[agrupacion];

    const result = await this.pagoRepo
      .createQueryBuilder('p')
      .select(`TO_CHAR(p.fecha_pago, '${format}')`, 'periodo')
      .addSelect('SUM(p.monto)', 'total')
      .addSelect('COUNT(*)', 'cantidad')
      .where('p.taller_id = :tallerId', { tallerId })
      .andWhere('p.fecha_pago BETWEEN :desde AND :hasta', { desde, hasta })
      .groupBy('periodo')
      .orderBy('periodo', 'ASC')
      .getRawMany();

    return result;
  }

  async otsPorEstado(tallerId: number) {
    const result = await this.otRepo
      .createQueryBuilder('ot')
      .select('ot.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .where('ot.taller_id = :tallerId', { tallerId })
      .groupBy('ot.estado')
      .getRawMany();

    return result;
  }

  async eficienciaMecanicos(tallerId: number, desde: string, hasta: string) {
    const result = await this.otRepo
      .createQueryBuilder('ot')
      .select('m.id', 'mecanico_id')
      .addSelect('u.nombre', 'mecanico_nombre')
      .addSelect('COUNT(ot.id)', 'ots_completadas')
      .addSelect('SUM(ot.total)', 'ingresos_generados')
      .innerJoin('ot.mecanico', 'm')
      .innerJoin('m.usuario', 'u')
      .where('ot.taller_id = :tallerId', { tallerId })
      .andWhere('ot.estado IN (:...estados)', { estados: ['listo', 'entregado', 'facturado'] })
      .andWhere('ot.fecha_ingreso BETWEEN :desde AND :hasta', { desde, hasta })
      .groupBy('m.id')
      .addGroupBy('u.nombre')
      .orderBy('ots_completadas', 'DESC')
      .getRawMany();

    return result;
  }

  async topServicios(tallerId: number, limite = 5) {
    const result = await this.detalleRepo
      .createQueryBuilder('d')
      .select('d.descripcion', 'servicio')
      .addSelect('COUNT(*)', 'cantidad')
      .addSelect('SUM(d.subtotal)', 'ingresos')
      .innerJoin('d.orden_trabajo', 'ot')
      .where('ot.taller_id = :tallerId', { tallerId })
      .andWhere("d.tipo = 'mano_obra'")
      .groupBy('d.descripcion')
      .orderBy('cantidad', 'DESC')
      .limit(limite)
      .getRawMany();

    return result;
  }

  async rotacionInventario(tallerId: number) {
    const repuestos = await this.repuestoRepo.find({
      where: { taller_id: tallerId },
      order: { stock_actual: 'ASC' },
      take: 20,
    });

    return repuestos.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      codigo: r.codigo,
      stock_actual: r.stock_actual,
      stock_minimo: r.stock_minimo,
      precio_venta: r.precio_venta,
      bajo_stock: r.stock_actual <= r.stock_minimo,
    }));
  }

  async clientesTop(tallerId: number, limite = 10) {
    const result = await this.otRepo
      .createQueryBuilder('ot')
      .select('c.id', 'cliente_id')
      .addSelect('c.nombre', 'cliente_nombre')
      .addSelect('COUNT(ot.id)', 'total_ots')
      .addSelect('SUM(ot.total)', 'total_gastado')
      .innerJoin('ot.vehiculo', 'v')
      .innerJoin('v.cliente', 'c')
      .where('ot.taller_id = :tallerId', { tallerId })
      .groupBy('c.id')
      .addGroupBy('c.nombre')
      .orderBy('total_gastado', 'DESC')
      .limit(limite)
      .getRawMany();

    return result;
  }

  async resumenDiario(tallerId: number) {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 1);

    const [otsHoy, ingresosHoy, otsAbiertas, stockBajo] = await Promise.all([
      this.otRepo.count({
        where: { taller_id: tallerId, fecha_ingreso: Between(inicio, fin) },
      }),
      this.pagoRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.monto), 0)', 'total')
        .where('p.taller_id = :tallerId', { tallerId })
        .andWhere('p.fecha_pago BETWEEN :inicio AND :fin', { inicio, fin })
        .getRawOne(),
      this.otRepo.count({
        where: { taller_id: tallerId, estado: 'en_reparacion' as any },
      }),
      this.repuestoRepo
        .createQueryBuilder('r')
        .where('r.taller_id = :tallerId', { tallerId })
        .andWhere('r.stock_actual <= r.stock_minimo')
        .getCount(),
    ]);

    return {
      ots_hoy: otsHoy,
      ingresos_hoy: Number(ingresosHoy?.total ?? 0),
      ots_en_reparacion: otsAbiertas,
      stock_bajo: stockBajo,
    };
  }
}
