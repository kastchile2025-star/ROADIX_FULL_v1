import api from './api';

export interface IngresoPeriodo {
  periodo: string;
  total: number;
  cantidad: number;
}

export interface OtsPorEstado {
  estado: string;
  cantidad: number;
}

export interface EficienciaMecanico {
  mecanico_id: number;
  mecanico_nombre: string;
  ots_completadas: number;
  ingresos_generados: number;
}

export interface TopServicio {
  servicio: string;
  cantidad: number;
  ingresos: number;
}

export interface RotacionItem {
  id: number;
  nombre: string;
  codigo?: string;
  stock_actual: number;
  stock_minimo: number;
  precio_venta: number;
  bajo_stock: boolean;
}

export interface ClienteTop {
  cliente_id: number;
  cliente_nombre: string;
  total_ots: number;
  total_gastado: number;
}

export interface ResumenDiario {
  ots_hoy: number;
  ingresos_hoy: number;
  ots_en_reparacion: number;
  stock_bajo: number;
}

export const reportesService = {
  ingresos: (desde: string, hasta: string, agrupacion?: string) =>
    api.get<IngresoPeriodo[]>('/reportes/ingresos', { params: { desde, hasta, agrupacion } }).then((r) => r.data),
  otsPorEstado: () =>
    api.get<OtsPorEstado[]>('/reportes/ots-por-estado').then((r) => r.data),
  eficienciaMecanicos: (desde: string, hasta: string) =>
    api.get<EficienciaMecanico[]>('/reportes/eficiencia-mecanicos', { params: { desde, hasta } }).then((r) => r.data),
  topServicios: (limite?: number) =>
    api.get<TopServicio[]>('/reportes/top-servicios', { params: limite ? { limite } : {} }).then((r) => r.data),
  rotacionInventario: () =>
    api.get<RotacionItem[]>('/reportes/rotacion-inventario').then((r) => r.data),
  clientesTop: (limite?: number) =>
    api.get<ClienteTop[]>('/reportes/clientes-top', { params: limite ? { limite } : {} }).then((r) => r.data),
  resumenDiario: () =>
    api.get<ResumenDiario>('/reportes/resumen-diario').then((r) => r.data),
};
