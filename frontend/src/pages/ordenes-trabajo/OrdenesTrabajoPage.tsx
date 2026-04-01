import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { ordenesTrabajoService } from '../../services/ordenes-trabajo.service';
import { useI18n } from '../../context/I18nContext';
import type { OrdenTrabajo } from '../../types';

const estadoColors: Record<string, string> = {
  recepcion: 'bg-blue-100 text-blue-800',
  diagnostico: 'bg-purple-100 text-purple-800',
  presupuesto: 'bg-yellow-100 text-yellow-800',
  esperando_aprobacion: 'bg-orange-100 text-orange-800',
  esperando_repuestos: 'bg-amber-100 text-amber-800',
  en_reparacion: 'bg-indigo-100 text-indigo-800',
  control_calidad: 'bg-teal-100 text-teal-800',
  listo: 'bg-green-100 text-green-800',
  entregado: 'bg-gray-100 text-gray-800',
  facturado: 'bg-emerald-100 text-emerald-800',
  cancelado: 'bg-red-100 text-red-800',
};

const prioridadColors: Record<string, string> = {
  baja: 'bg-gray-100 text-gray-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
};

const estadoI18nKey: Record<string, string> = {
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

export default function OrdenesTrabajoPage() {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const navigate = useNavigate();
  const { t } = useI18n();

  const load = async () => {
    const data = await ordenesTrabajoService.getAll({
      search: search || undefined,
      estado: filtroEstado || undefined,
    });
    setOrdenes(data);
  };

  useEffect(() => {
    load();
  }, [search, filtroEstado]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('ot.title')}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/kanban')}>
            {t('ot.kanbanBtn')}
          </Button>
          <Button onClick={() => navigate('/ordenes-trabajo/nueva')}>
            <Plus className="h-4 w-4 mr-1" /> {t('ot.nuevaOt')}
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder={t('ot.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">{t('ot.todosEstados')}</option>
            <option value="recepcion">{t('estado.recepcion')}</option>
            <option value="diagnostico">{t('estado.diagnostico')}</option>
            <option value="presupuesto">{t('estado.presupuesto')}</option>
            <option value="esperando_aprobacion">{t('estado.esperando_aprobacion')}</option>
            <option value="esperando_repuestos">{t('estado.esperando_repuestos')}</option>
            <option value="en_reparacion">{t('estado.en_reparacion')}</option>
            <option value="control_calidad">{t('estado.control_calidad')}</option>
            <option value="listo">{t('estado.listo')}</option>
            <option value="entregado">{t('estado.entregado')}</option>
            <option value="facturado">{t('estado.facturado')}</option>
            <option value="cancelado">{t('estado.cancelado')}</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('ot.thNumero')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('ot.thCliente')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('ot.thVehiculo')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('ot.thEstado')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('ot.thPrioridad')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('ot.thMecanico')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('ot.thTotal')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('ot.thFecha')}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {ordenes.map((ot) => (
                <tr
                  key={ot.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => navigate(`/ordenes-trabajo/${ot.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-blue-600">{ot.numero_ot}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{ot.cliente?.nombre ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {ot.vehiculo ? `${ot.vehiculo.patente} - ${ot.vehiculo.marca ?? ''} ${ot.vehiculo.modelo ?? ''}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${estadoColors[ot.estado] ?? 'bg-gray-100'}`}>
                      {t(estadoI18nKey[ot.estado] ?? ot.estado)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${prioridadColors[ot.prioridad] ?? ''}`}>
                      {t(`enum.prioridad.${ot.prioridad}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{ot.mecanico?.nombre ?? t('ot.sinAsignar')}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">${Number(ot.total).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(ot.fecha_ingreso).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </td>
                </tr>
              ))}
              {ordenes.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {t('ot.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
