import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Download, FileSpreadsheet, Package, TrendingUp, Users, Wrench } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { reportesService } from '../../services/reportes.service';
import { downloadCsv, downloadExcel } from '../../utils/reportes-export';
import { useI18n } from '../../context/I18nContext';
import type {
  IngresoPeriodo,
  OtsPorEstado,
  TopServicio,
  ClienteTop,
  EficienciaMecanico,
  RotacionItem,
} from '../../services/reportes.service';

type Tab = 'ingresos' | 'ots' | 'mecanicos' | 'servicios' | 'clientes' | 'inventario';

const estadoColors: Record<string, string> = {
  recepcion: '#3b82f6',
  diagnostico: '#f59e0b',
  presupuesto: '#8b5cf6',
  esperando_aprobacion: '#ef4444',
  esperando_repuestos: '#f97316',
  en_reparacion: '#06b6d4',
  control_calidad: '#6366f1',
  listo: '#22c55e',
  entregado: '#0d9488',
  facturado: '#7c3aed',
  cancelado: '#6b7280',
};

function formatCurrency(value: number) {
  return `$${Number(value ?? 0).toLocaleString('es-CL')}`;
}

function getDefaultReportStartDate() {
  const date = new Date();
  date.setMonth(date.getMonth() - 18);
  date.setDate(1);
  return date.toISOString().split('T')[0];
}

export default function ReportesPage() {
  const { t } = useI18n();

  const estadoLabels: Record<string, string> = {
    recepcion: t('estado.recepcion'), diagnostico: t('estado.diagnostico'), presupuesto: t('estado.presupuesto'),
    esperando_aprobacion: t('estado.espAprobacion'), esperando_repuestos: t('estado.espRepuestos'),
    en_reparacion: t('estado.enReparacion'), control_calidad: t('estado.controlCalidad'),
    listo: t('estado.listo'), entregado: t('estado.entregado'), facturado: t('estado.facturado'), cancelado: t('estado.cancelado'),
  };

  const tabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
    { key: 'ingresos', label: t('reportes.tabIngresos'), icon: TrendingUp },
    { key: 'ots', label: t('reportes.tabOtsPorEstado'), icon: BarChart3 },
    { key: 'mecanicos', label: t('reportes.tabMecanicos'), icon: Wrench },
    { key: 'servicios', label: t('reportes.tabTopServicios'), icon: BarChart3 },
    { key: 'clientes', label: t('reportes.tabTopClientes'), icon: Users },
    { key: 'inventario', label: t('reportes.tabRotacionStock'), icon: Package },
  ];
  const [activeTab, setActiveTab] = useState<Tab>('ingresos');
  const [desde, setDesde] = useState(getDefaultReportStartDate);
  const [hasta, setHasta] = useState(() => new Date().toISOString().split('T')[0]);
  const [agrupacion, setAgrupacion] = useState<'dia' | 'semana' | 'mes'>('mes');

  const [ingresos, setIngresos] = useState<IngresoPeriodo[]>([]);
  const [otsPorEstado, setOtsPorEstado] = useState<OtsPorEstado[]>([]);
  const [eficiencia, setEficiencia] = useState<EficienciaMecanico[]>([]);
  const [topServicios, setTopServicios] = useState<TopServicio[]>([]);
  const [clientesTop, setClientesTop] = useState<ClienteTop[]>([]);
  const [rotacion, setRotacion] = useState<RotacionItem[]>([]);

  const cargarDatos = () => {
    if (activeTab === 'ingresos') {
      reportesService.ingresos(desde, hasta, agrupacion).then(setIngresos).catch(() => {});
    } else if (activeTab === 'ots') {
      reportesService.otsPorEstado().then(setOtsPorEstado).catch(() => {});
    } else if (activeTab === 'mecanicos') {
      reportesService.eficienciaMecanicos(desde, hasta).then(setEficiencia).catch(() => {});
    } else if (activeTab === 'servicios') {
      reportesService.topServicios(10).then(setTopServicios).catch(() => {});
    } else if (activeTab === 'clientes') {
      reportesService.clientesTop(10).then(setClientesTop).catch(() => {});
    } else if (activeTab === 'inventario') {
      reportesService.rotacionInventario().then(setRotacion).catch(() => {});
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [activeTab, desde, hasta, agrupacion]);

  const showDateFilters = activeTab === 'ingresos' || activeTab === 'mecanicos';

  const ingresosChartData = ingresos.map((item) => ({
    periodo: item.periodo,
    total: Number(item.total),
    cantidad: Number(item.cantidad),
  }));

  const otsChartData = otsPorEstado.map((item) => ({
    estado: item.estado,
    nombre: estadoLabels[item.estado] ?? item.estado,
    cantidad: Number(item.cantidad),
  }));

  const eficienciaChartData = eficiencia.map((item) => ({
    mecanico: item.mecanico_nombre,
    ots: Number(item.ots_completadas),
    ingresos: Number(item.ingresos_generados),
  }));

  const serviciosChartData = topServicios.map((item) => ({
    servicio: item.servicio,
    cantidad: Number(item.cantidad),
    ingresos: Number(item.ingresos),
  }));

  const clientesChartData = clientesTop.map((item) => ({
    cliente: item.cliente_nombre,
    ots: Number(item.total_ots),
    total: Number(item.total_gastado),
  }));

  const inventarioChartData = rotacion.map((item) => ({
    nombre: item.nombre,
    stockActual: Number(item.stock_actual),
    stockMinimo: Number(item.stock_minimo),
    precioVenta: Number(item.precio_venta),
  }));

  const exportar = () => {
    if (activeTab === 'ingresos') {
      downloadCsv(
        `reporte-ingresos-${desde}-${hasta}.csv`,
        ['Periodo', 'Total', 'Transacciones'],
        ingresosChartData.map((item) => [item.periodo, item.total, item.cantidad]),
      );
      return;
    }
    if (activeTab === 'ots') {
      downloadCsv(
        'reporte-ots-por-estado.csv',
        ['Estado', 'Cantidad'],
        otsChartData.map((item) => [item.nombre, item.cantidad]),
      );
      return;
    }
    if (activeTab === 'mecanicos') {
      downloadCsv(
        `reporte-mecanicos-${desde}-${hasta}.csv`,
        ['Mecanico', 'OTs completadas', 'Ingresos generados'],
        eficienciaChartData.map((item) => [item.mecanico, item.ots, item.ingresos]),
      );
      return;
    }
    if (activeTab === 'servicios') {
      downloadCsv(
        'reporte-top-servicios.csv',
        ['Servicio', 'Cantidad', 'Ingresos'],
        serviciosChartData.map((item) => [item.servicio, item.cantidad, item.ingresos]),
      );
      return;
    }
    if (activeTab === 'clientes') {
      downloadCsv(
        'reporte-clientes-top.csv',
        ['Cliente', 'OTs', 'Total gastado'],
        clientesChartData.map((item) => [item.cliente, item.ots, item.total]),
      );
      return;
    }
    downloadCsv(
      'reporte-rotacion-inventario.csv',
      ['Repuesto', 'Stock actual', 'Stock minimo', 'Precio venta'],
      inventarioChartData.map((item) => [item.nombre, item.stockActual, item.stockMinimo, item.precioVenta]),
    );
  };

  const getExportData = (): { filename: string; headers: string[]; rows: (string | number)[][] } => {
    if (activeTab === 'ingresos') return {
      filename: `reporte-ingresos-${desde}-${hasta}`,
      headers: ['Periodo', 'Total', 'Transacciones'],
      rows: ingresosChartData.map((i) => [i.periodo, i.total, i.cantidad]),
    };
    if (activeTab === 'ots') return {
      filename: 'reporte-ots-por-estado',
      headers: ['Estado', 'Cantidad'],
      rows: otsChartData.map((i) => [i.nombre, i.cantidad]),
    };
    if (activeTab === 'mecanicos') return {
      filename: `reporte-mecanicos-${desde}-${hasta}`,
      headers: ['Mecanico', 'OTs completadas', 'Ingresos generados'],
      rows: eficienciaChartData.map((i) => [i.mecanico, i.ots, i.ingresos]),
    };
    if (activeTab === 'servicios') return {
      filename: 'reporte-top-servicios',
      headers: ['Servicio', 'Cantidad', 'Ingresos'],
      rows: serviciosChartData.map((i) => [i.servicio, i.cantidad, i.ingresos]),
    };
    if (activeTab === 'clientes') return {
      filename: 'reporte-clientes-top',
      headers: ['Cliente', 'OTs', 'Total gastado'],
      rows: clientesChartData.map((i) => [i.cliente, i.ots, i.total]),
    };
    return {
      filename: 'reporte-rotacion-inventario',
      headers: ['Repuesto', 'Stock actual', 'Stock minimo', 'Precio venta'],
      rows: inventarioChartData.map((i) => [i.nombre, i.stockActual, i.stockMinimo, i.precioVenta]),
    };
  };

  const exportarExcel = () => {
    const { filename, headers, rows } = getExportData();
    downloadExcel(`${filename}.xlsx`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reportes.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('reportes.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportar}>
            <Download size={16} className="mr-1" /> {t('reportes.exportCsv')}
          </Button>
          <Button variant="secondary" onClick={exportarExcel}>
            <FileSpreadsheet size={16} className="mr-1" /> {t('reportes.exportExcel')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === key
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Date filters */}
      {showDateFilters && (
        <Card>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('reportes.labelDesde')}</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('reportes.labelHasta')}</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
            </div>
            {activeTab === 'ingresos' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('reportes.labelAgrupacion')}</label>
                <select value={agrupacion} onChange={(e) => setAgrupacion(e.target.value as 'dia' | 'semana' | 'mes')}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white">
                  <option value="dia">{t('reportes.agrupDia')}</option>
                  <option value="semana">{t('reportes.agrupSemana')}</option>
                  <option value="mes">{t('reportes.agrupMes')}</option>
                </select>
              </div>
            )}
            <Button variant="secondary" onClick={cargarDatos}>{t('reportes.actualizar')}</Button>
          </div>
        </Card>
      )}

      {/* Content */}
      {activeTab === 'ingresos' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reportes.ingresosPorPeriodo')}</h3>
          {ingresosChartData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t('reportes.sinDatosRango')}</p>
          ) : (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ingresosChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="ingresosGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="periodo" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `$${Number(value).toLocaleString('es-CL')}`} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value, name) => [String(name ?? '') === 'total' ? formatCurrency(Number(value ?? 0)) : Number(value ?? 0), String(name ?? '') === 'total' ? t('reportes.tooltipTotal') : t('reportes.tooltipTransacciones')] as const} />
                  <Area type="monotone" dataKey="total" stroke="#1d4ed8" fillOpacity={1} fill="url(#ingresosGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'ots' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reportes.distribucionOts')}</h3>
          {otsChartData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t('reportes.sinDatos')}</p>
          ) : (
            (() => {
              const totalOts = otsChartData.reduce((s, i) => s + i.cantidad, 0);
              return (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={otsChartData} dataKey="cantidad" nameKey="nombre" innerRadius={60} outerRadius={100} paddingAngle={2}
                          label={({ payload, percent }) => {
                            const nombre = (payload as { nombre?: string } | undefined)?.nombre ?? '';
                            return `${nombre} ${((percent ?? 0) * 100).toFixed(1)}%`;
                          }}
                        >
                          {otsChartData.map((item) => (
                            <Cell key={item.estado} fill={estadoColors[item.estado] ?? '#9ca3af'} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${Number(value ?? 0)} ${t('reportes.tooltipOTs')} (${totalOts ? ((Number(value ?? 0) / totalOts) * 100).toFixed(1) : 0}%)`, name] as const} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {otsChartData.map((item) => {
                      const pct = totalOts ? ((item.cantidad / totalOts) * 100).toFixed(1) : '0';
                      return (
                        <div key={item.estado} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: estadoColors[item.estado] ?? '#9ca3af' }} />
                            <span className="text-gray-600 dark:text-gray-300">{item.nombre}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500">{pct}%</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{item.cantidad}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          )}
        </Card>
      )}

      {activeTab === 'mecanicos' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reportes.eficienciaMecanicos')}</h3>
          {eficienciaChartData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t('reportes.sinDatosRango')}</p>
          ) : (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eficienciaChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mecanico" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip cursor={false} formatter={(value) => [Number(value ?? 0), t('reportes.tooltipOTs')] as const} />
                  <Bar dataKey="ots" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'servicios' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reportes.top10Servicios')}</h3>
          {serviciosChartData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t('reportes.sinDatos')}</p>
          ) : (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviciosChartData} layout="vertical" margin={{ top: 8, right: 8, left: 24, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="servicio" type="category" width={180} tickLine={false} axisLine={false} />
                  <Tooltip cursor={false} formatter={(value) => [formatCurrency(Number(value ?? 0)), t('reportes.tooltipIngresos')] as const} />
                  <Bar dataKey="ingresos" fill="#7c3aed" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'clientes' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reportes.top10Clientes')}</h3>
          {clientesChartData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t('reportes.sinDatos')}</p>
          ) : (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientesChartData} layout="vertical" margin={{ top: 8, right: 8, left: 24, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="cliente" type="category" width={180} tickLine={false} axisLine={false} />
                  <Tooltip cursor={false} formatter={(value) => [formatCurrency(Number(value ?? 0)), t('reportes.tooltipTotalGastado')] as const} />
                  <Bar dataKey="total" fill="#d97706" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'inventario' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reportes.rotacionInventario')}</h3>
          {inventarioChartData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t('reportes.sinDatos')}</p>
          ) : (
            <div className="h-[28rem]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventarioChartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nombre" tickLine={false} axisLine={false} angle={-18} textAnchor="end" height={70} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip cursor={false} formatter={(value, name) => [String(name ?? '') === 'precioVenta' ? formatCurrency(Number(value ?? 0)) : Number(value ?? 0), String(name ?? '') === 'stockActual' ? t('reportes.tooltipStockActual') : String(name ?? '') === 'stockMinimo' ? t('reportes.tooltipStockMinimo') : t('reportes.tooltipPrecioVenta')] as const} />
                  <Bar dataKey="stockMinimo" fill="#fecaca" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="stockActual" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
