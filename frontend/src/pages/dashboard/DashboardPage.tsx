import { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import {
  AlertTriangle,
  BarChart3,
  DollarSign,
  Package,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { Card } from '../../components/ui';
import { useI18n } from '../../context/I18nContext';
import { reportesService } from '../../services/reportes.service';
import { useAuthStore } from '../../store/auth.store';
import type {
  ClienteTop,
  EficienciaMecanico,
  OtsPorEstado,
  ResumenDiario,
  TopServicio,
} from '../../services/reportes.service';

const estadoKeyMap: Record<string, string> = {
  recepcion: 'estado.recepcion',
  diagnostico: 'estado.diagnostico',
  presupuesto: 'estado.presupuesto',
  esperando_aprobacion: 'estado.espAprobacion',
  esperando_repuestos: 'estado.espRepuestos',
  en_reparacion: 'estado.enReparacion',
  control_calidad: 'estado.controlCalidad',
  listo: 'estado.listo',
  entregado: 'estado.entregado',
  facturado: 'estado.facturado',
  cancelado: 'estado.cancelado',
};

const defaultEstadoColors: Record<string, string> = {
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

function loadEstadoColors(): Record<string, string> {
  try {
    const saved = localStorage.getItem('roadix-estado-colors');
    if (saved) return { ...defaultEstadoColors, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...defaultEstadoColors };
}

function formatCurrency(value: number) {
  return `$${Number(value ?? 0).toLocaleString('es-CL')}`;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const [resumen, setResumen] = useState<ResumenDiario | null>(null);
  const [otsPorEstado, setOtsPorEstado] = useState<OtsPorEstado[]>([]);
  const [topServicios, setTopServicios] = useState<TopServicio[]>([]);
  const [clientesTop, setClientesTop] = useState<ClienteTop[]>([]);
  const [mecanicos, setMecanicos] = useState<EficienciaMecanico[]>([]);
  const [estadoColors, setEstadoColors] = useState<Record<string, string>>(loadEstadoColors);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const editingEstadoRef = useRef<string | null>(null);

  const handleColorDblClick = useCallback((estado: string) => {
    editingEstadoRef.current = estado;
    if (colorInputRef.current) {
      colorInputRef.current.value = estadoColors[estado] ?? '#9ca3af';
      colorInputRef.current.click();
    }
  }, [estadoColors]);

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const estado = editingEstadoRef.current;
    if (!estado) return;
    const newColor = e.target.value;
    setEstadoColors((prev) => {
      const updated = { ...prev, [estado]: newColor };
      localStorage.setItem('roadix-estado-colors', JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    const hoy = new Date();
    const hace18Meses = new Date();
    hace18Meses.setMonth(hace18Meses.getMonth() - 18);
    hace18Meses.setDate(1);
    const desde = hace18Meses.toISOString().split('T')[0];
    const hasta = hoy.toISOString().split('T')[0];

    reportesService.resumenDiario().then(setResumen).catch(() => {});
    reportesService.otsPorEstado().then(setOtsPorEstado).catch(() => {});
    reportesService.topServicios(5).then(setTopServicios).catch(() => {});
    reportesService.clientesTop(5).then(setClientesTop).catch(() => {});
    reportesService.eficienciaMecanicos(desde, hasta).then(setMecanicos).catch(() => {});
  }, []);

  const otsChartData = otsPorEstado.map((item) => ({
    ...item,
    nombre: t(estadoKeyMap[item.estado] ?? item.estado),
    cantidad: Number(item.cantidad),
  }));

  const serviciosChartData = topServicios.map((item) => ({
    servicio: item.servicio,
    cantidad: Number(item.cantidad),
    ingresos: Number(item.ingresos),
  }));

  const mecanicosChartData = mecanicos.map((item) => ({
    mecanico: item.mecanico_nombre,
    ots: Number(item.ots_completadas),
    ingresos: Number(item.ingresos_generados),
  }));

  const clientesChartData = clientesTop.map((item) => ({
    cliente: item.cliente_nombre,
    ots: Number(item.total_ots),
    total: Number(item.total_gastado),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.subtitle')} {user?.nombre ?? 'usuario'}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 p-3 text-white shadow-sm"><Wrench size={22} /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.otsHoy')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumen?.ots_hoy ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 p-3 text-white shadow-sm"><DollarSign size={22} /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.ingresosHoy')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(resumen?.ingresos_hoy ?? 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-3 text-white shadow-sm"><Users size={22} /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.enReparacion')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumen?.ots_en_reparacion ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-red-400 to-rose-500 p-3 text-white shadow-sm"><AlertTriangle size={22} /></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.stockBajo')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumen?.stock_bajo ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.otsPorEstado')}</h3>
          </div>
          {otsChartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">{t('dashboard.sinDatos')}</p>
          ) : (
            <>
              {/* Hidden color input for picking colors */}
              <input
                ref={colorInputRef}
                type="color"
                className="sr-only"
                onChange={handleColorChange}
              />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={otsChartData} dataKey="cantidad" nameKey="nombre" innerRadius={55} outerRadius={88} paddingAngle={2}>
                      {otsChartData.map((entry) => (
                        <Cell key={entry.estado} fill={estadoColors[entry.estado] ?? '#9ca3af'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [Number(value ?? 0), t('dashboard.tooltipOTs')] as const} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {otsChartData.map((item) => (
                  <div key={item.estado} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full cursor-pointer ring-offset-1 hover:ring-2 hover:ring-blue-400 transition-all"
                        style={{ backgroundColor: estadoColors[item.estado] ?? '#9ca3af' }}
                        onDoubleClick={() => handleColorDblClick(item.estado)}
                        title={t('dashboard.dblClickColor')}
                      />
                      <span className="text-gray-600 dark:text-gray-400">{item.nombre}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{item.cantidad}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.topServicios')}</h3>
          </div>
          {serviciosChartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">{t('dashboard.sinDatos')}</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviciosChartData} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="servicio" type="category" width={140} tickLine={false} axisLine={false} />
                  <Tooltip cursor={false} formatter={(value) => [formatCurrency(Number(value ?? 0)), t('dashboard.tooltipIngresos')] as const} />
                  <Bar dataKey="ingresos" radius={[0, 6, 6, 0]} fill="#1d4ed8"
                    activeBar={{ fill: '#60a5fa', filter: 'drop-shadow(0 4px 8px rgba(29,78,216,0.4))' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
          <div className="mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.eficienciaMecanicos')}</h3>
          </div>
          {mecanicosChartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">{t('dashboard.sinDatos30Dias')}</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mecanicosChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mecanico" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip cursor={false} formatter={(value) => [Number(value ?? 0), t('dashboard.tooltipOTs')] as const} />
                  <Bar dataKey="ots" radius={[6, 6, 0, 0]} fill="#0f766e"
                    activeBar={{ fill: '#5eead4', filter: 'drop-shadow(0 4px 8px rgba(15,118,110,0.4))' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.mejoresClientes')}</h3>
          </div>
          {clientesChartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">{t('dashboard.sinDatos')}</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientesChartData} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="cliente" type="category" width={150} tickLine={false} axisLine={false} />
                  <Tooltip cursor={false} formatter={(value) => [formatCurrency(Number(value ?? 0)), t('dashboard.tooltipTotalGastado')] as const} />
                  <Bar dataKey="total" radius={[0, 6, 6, 0]} fill="#d97706"
                    activeBar={{ fill: '#fbbf24', filter: 'drop-shadow(0 4px 8px rgba(217,119,6,0.4))' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
