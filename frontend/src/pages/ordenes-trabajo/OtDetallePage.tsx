import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Plus, Trash2, Send, CheckCircle, XCircle } from 'lucide-react';
import { Button, Card, Input, Modal } from '../../components/ui';
import { useConfirm } from '../../components/ui';
import toast from 'react-hot-toast';
import { archivosService } from '../../services/archivos.service';
import { ordenesTrabajoService } from '../../services/ordenes-trabajo.service';
import { presupuestosService } from '../../services/presupuestos.service';
import { mecanicosService } from '../../services/mecanicos.service';
import { useI18n } from '../../context/I18nContext';
import type { OrdenTrabajo, Mecanico, OtFoto, Presupuesto } from '../../types';

const estadoColors: Record<string, string> = {
  recepcion: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  diagnostico: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  presupuesto: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  esperando_aprobacion: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  esperando_repuestos: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  en_reparacion: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  control_calidad: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
  listo: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  entregado: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  facturado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const estadoFlow = [
  'recepcion', 'diagnostico', 'presupuesto', 'esperando_aprobacion',
  'esperando_repuestos', 'en_reparacion', 'control_calidad', 'listo', 'entregado',
];

const estadoI18nMap: Record<string, string> = {
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

const tabKeys = [
  'otDetalle.tabInfo',
  'otDetalle.tabDetalles',
  'otDetalle.tabFotos',
  'otDetalle.tabChecklist',
  'otDetalle.tabPresupuesto',
] as const;

export default function OtDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const confirm = useConfirm();
  const [ot, setOt] = useState<OrdenTrabajo | null>(null);
  const [activeTab, setActiveTab] = useState<string>(tabKeys[0]);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [detalleModal, setDetalleModal] = useState(false);
  const [fotoModal, setFotoModal] = useState(false);

  const load = async () => {
    if (!id) return;
    const data = await ordenesTrabajoService.getOne(Number(id));
    setOt(data);
    const pres = await presupuestosService.getByOt(Number(id));
    setPresupuestos(pres);
  };

  useEffect(() => {
    load();
    mecanicosService.getActive().then(setMecanicos);
  }, [id]);

  if (!ot) return <div className="flex justify-center py-12 text-gray-500 dark:text-gray-400">{t('otDetalle.cargando')}</div>;

  const currentIdx = estadoFlow.indexOf(ot.estado);
  const nextEstado = currentIdx >= 0 && currentIdx < estadoFlow.length - 1 ? estadoFlow[currentIdx + 1] : null;

  const handleCambiarEstado = async (estado: string) => {
    await ordenesTrabajoService.cambiarEstado(ot.id, estado);
    load();
  };

  const handleAsignarMecanico = async (mecanicoId: number) => {
    await ordenesTrabajoService.asignarMecanico(ot.id, mecanicoId);
    load();
  };

  const handleAddDetalle = async (data: { tipo: string; descripcion: string; cantidad: number; precio_unit: number }) => {
    await ordenesTrabajoService.addDetalle(ot.id, data);
    setDetalleModal(false);
    load();
  };

  const handleRemoveDetalle = async (detalleId: number) => {
    await ordenesTrabajoService.removeDetalle(ot.id, detalleId);
    load();
  };

  const handleCrearPresupuesto = async () => {
    const items = (ot.detalles ?? []).map((d) => ({
      tipo: d.tipo,
      descripcion: d.descripcion,
      cantidad: d.cantidad,
      precio_unit: d.precio_unit,
      descuento: d.descuento,
    }));
    await presupuestosService.create({ ot_id: ot.id, items_json: items });
    load();
  };

  const handleEnviarPresupuesto = async (presId: number) => {
    await presupuestosService.enviar(presId);
    load();
  };

  const handleAprobarPresupuesto = async (presId: number) => {
    await presupuestosService.update(presId, { estado: 'aprobado' });
    load();
  };

  const handleAddFoto = async (data: { file: File; tipo: string; descripcion?: string }) => {
    const uploaded = await archivosService.upload(data.file);
    await ordenesTrabajoService.addFoto(ot.id, {
      url: uploaded.url,
      tipo: data.tipo,
      descripcion: data.descripcion,
    });
    toast.success(t('otDetalle.fotoAgregada'));
    setFotoModal(false);
    load();
  };

  const handleRemoveFoto = async (foto: OtFoto) => {
    if (!(await confirm({ message: t('otDetalle.fotoConfirmDelete'), variant: 'danger' }))) return;
    await ordenesTrabajoService.removeFoto(ot.id, foto.id);
    toast.success(t('otDetalle.fotoEliminada'));
    load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => navigate('/ordenes-trabajo')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{ot.numero_ot}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {ot.cliente?.nombre} — {ot.vehiculo?.patente} {ot.vehiculo?.marca} {ot.vehiculo?.modelo}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoColors[ot.estado] ?? 'bg-gray-100'}`}>
          {t(estadoI18nMap[ot.estado] ?? ot.estado)}
        </span>
      </div>

      {/* Actions bar */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          {nextEstado && (
            <Button onClick={() => handleCambiarEstado(nextEstado)}>
              {t('otDetalle.avanzarA')} {t(estadoI18nMap[nextEstado] ?? nextEstado)}
            </Button>
          )}
          {ot.estado !== 'cancelado' && ot.estado !== 'entregado' && ot.estado !== 'facturado' && (
            <Button variant="danger" onClick={() => handleCambiarEstado('cancelado')}>
              <XCircle className="h-4 w-4 mr-1" /> {t('otDetalle.cancelarOt')}
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">{t('otDetalle.labelMecanico')}</label>
            <select
              value={ot.mecanico_id ?? ''}
              onChange={(e) => e.target.value && handleAsignarMecanico(Number(e.target.value))}
              className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 text-sm"
            >
              <option value="">{t('otDetalle.sinAsignar')}</option>
              {mecanicos.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabKeys.map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`py-2 px-1 border-b-2 text-sm font-medium ${
                activeTab === tabKey
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t(tabKey)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'otDetalle.tabInfo' && <InfoTab ot={ot} />}
      {activeTab === 'otDetalle.tabDetalles' && (
        <DetallesTab
          ot={ot}
          onAdd={() => setDetalleModal(true)}
          onRemove={handleRemoveDetalle}
        />
      )}
      {activeTab === 'otDetalle.tabFotos' && (
        <FotosTab ot={ot} onAdd={() => setFotoModal(true)} onRemove={handleRemoveFoto} />
      )}
      {activeTab === 'otDetalle.tabChecklist' && <ChecklistTab ot={ot} />}
      {activeTab === 'otDetalle.tabPresupuesto' && (
        <PresupuestoTab
          presupuestos={presupuestos}
          onCreate={handleCrearPresupuesto}
          onEnviar={handleEnviarPresupuesto}
          onAprobar={handleAprobarPresupuesto}
        />
      )}

      {/* Add detalle modal */}
      <DetalleModal
        open={detalleModal}
        onClose={() => setDetalleModal(false)}
        onSave={handleAddDetalle}
      />

      <FotoModal
        open={fotoModal}
        onClose={() => setFotoModal(false)}
        onSave={handleAddFoto}
      />
    </div>
  );
}

function InfoTab({ ot }: { ot: OrdenTrabajo }) {
  const { t } = useI18n();
  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('otDetalle.infoTipoServicio')}</p>
          <p className="font-medium text-gray-900 dark:text-white">{ot.tipo_servicio ?? '-'}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('otDetalle.infoPrioridad')}</p>
          <p className="font-medium capitalize text-gray-900 dark:text-white">{ot.prioridad}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('otDetalle.infoKmIngreso')}</p>
          <p className="font-medium text-gray-900 dark:text-white">{ot.km_ingreso?.toLocaleString() ?? '-'}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('otDetalle.infoCombustible')}</p>
          <p className="font-medium capitalize text-gray-900 dark:text-white">{ot.combustible_ing ?? '-'}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('otDetalle.infoFechaIngreso')}</p>
          <p className="font-medium text-gray-900 dark:text-white">{new Date(ot.fecha_ingreso).toLocaleDateString('es-CL')}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('otDetalle.infoFechaPrometida')}</p>
          <p className="font-medium text-gray-900 dark:text-white">{ot.fecha_prometida ? new Date(ot.fecha_prometida).toLocaleDateString('es-CL') : '-'}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-gray-500 dark:text-gray-400">{t('otDetalle.infoDiagnostico')}</p>
          <p className="font-medium whitespace-pre-wrap text-gray-900 dark:text-white">{ot.diagnostico ?? '-'}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-gray-500 dark:text-gray-400">{t('otDetalle.infoObservaciones')}</p>
          <p className="font-medium whitespace-pre-wrap text-gray-900 dark:text-white">{ot.observaciones ?? '-'}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('otDetalle.infoSubtotal')}</p>
          <p className="font-medium text-gray-900 dark:text-white">${Number(ot.subtotal).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('otDetalle.infoIva')}</p>
          <p className="font-medium text-gray-900 dark:text-white">${Number(ot.iva).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('otDetalle.infoTotal')}</p>
          <p className="font-bold text-lg text-gray-900 dark:text-white">${Number(ot.total).toLocaleString()}</p>
        </div>
        {ot.firma_cliente_url && (
          <div className="md:col-span-2 mt-2">
            <p className="text-gray-500 dark:text-gray-400 mb-1">{t('otDetalle.infoFirmaCliente')}</p>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 p-2 inline-block">
              <img src={ot.firma_cliente_url} alt={t('otDetalle.infoFirmaCliente')} className="max-h-32" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function DetallesTab({ ot, onAdd, onRemove }: { ot: OrdenTrabajo; onAdd: () => void; onRemove: (id: number) => void }) {
  const { t } = useI18n();
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t('otDetalle.detallesTitle')}</h3>
        <Button size="sm" onClick={onAdd}><Plus className="h-3 w-3 mr-1" /> {t('otDetalle.detallesAgregar')}</Button>
      </div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">{t('otDetalle.detalleTipo')}</th>
            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">{t('otDetalle.detalleDescripcion')}</th>
            <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{t('otDetalle.detalleCant')}</th>
            <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{t('otDetalle.detallePUnit')}</th>
            <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{t('otDetalle.detalleDesc')}</th>
            <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{t('otDetalle.detalleSubtotal')}</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {(ot.detalles ?? []).map((d) => (
            <tr key={d.id}>
              <td className="px-3 py-2 capitalize text-gray-900 dark:text-white">{d.tipo.replace('_', ' ')}</td>
              <td className="px-3 py-2 text-gray-900 dark:text-white">{d.descripcion}</td>
              <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{d.cantidad}</td>
              <td className="px-3 py-2 text-right text-gray-900 dark:text-white">${Number(d.precio_unit).toLocaleString()}</td>
              <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{Number(d.descuento)}%</td>
              <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">${Number(d.subtotal).toLocaleString()}</td>
              <td className="px-3 py-2">
                <button onClick={() => onRemove(d.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
          {!(ot.detalles?.length) && (
            <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">{t('otDetalle.sinDetalles')}</td></tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

function FotosTab({
  ot,
  onAdd,
  onRemove,
}: {
  ot: OrdenTrabajo;
  onAdd: () => void;
  onRemove: (foto: OtFoto) => void;
}) {
  const { t } = useI18n();
  const tipoColors: Record<string, string> = {
    ingreso: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    proceso: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    entrega: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    dano: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t('otDetalle.fotosTitle')}</h3>
        <Button size="sm" onClick={onAdd}><ImagePlus className="mr-1 h-4 w-4" /> {t('otDetalle.agregarFoto')}</Button>
      </div>
      {(ot.fotos?.length) ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ot.fotos.map((f) => (
            <div key={f.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                {f.url ? (
                  <img src={f.url} alt={f.descripcion ?? ''} className="w-full h-full object-cover" />
                ) : (
                  t('otDetalle.sinImagen')
                )}
              </div>
              <div className="p-2">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${tipoColors[f.tipo] ?? 'bg-gray-100'}`}>
                    {f.tipo}
                  </span>
                  <button onClick={() => onRemove(f)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {f.descripcion && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{f.descripcion}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">{t('otDetalle.sinFotos')}</p>
      )}
    </Card>
  );
}

function FotoModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { file: File; tipo: string; descripcion?: string }) => Promise<void>;
}) {
  const { t } = useI18n();
  const [tipo, setTipo] = useState('proceso');
  const [descripcion, setDescripcion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!file) {
      toast.error(t('otDetalle.fotoSelecciona'));
      return;
    }

    setSaving(true);
    try {
      await onSave({ file, tipo, descripcion: descripcion.trim() || undefined });
      setFile(null);
      setDescripcion('');
      setTipo('proceso');
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? t('otDetalle.fotoErrorCargar'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('otDetalle.fotoModalTitulo')}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('otDetalle.fotoTipoLabel')}</label>
          <select value={tipo} onChange={(event) => setTipo(event.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm">
            <option value="ingreso">{t('otDetalle.fotoTipoIngreso')}</option>
            <option value="proceso">{t('otDetalle.fotoTipoProceso')}</option>
            <option value="entrega">{t('otDetalle.fotoTipoEntrega')}</option>
            <option value="dano">{t('otDetalle.fotoTipoDano')}</option>
          </select>
        </div>
        <Input label={t('otDetalle.fotoDescripcionLabel')} value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('otDetalle.fotoArchivoLabel')}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('otDetalle.fotoArchivoHint')}</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>{t('otDetalle.fotoCancelar')}</Button>
          <Button onClick={handleSave} loading={saving}>{t('otDetalle.fotoSubir')}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ChecklistTab({ ot }: { ot: OrdenTrabajo }) {
  const { t } = useI18n();
  const estadoIcon: Record<string, string> = { ok: '✅', danio_prev: '⚠️', danio_nuevo: '🔴' };
  const zonaLabels: Record<string, string> = {
    frente: 'Frente', trasera: 'Trasera', lat_izq: 'Lateral Izquierdo',
    lat_der: 'Lateral Derecho', techo: 'Techo', interior: 'Interior',
  };

  return (
    <Card>
      <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{t('otDetalle.checklistTitle')}</h3>
      {(ot.checklist?.length) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ot.checklist.map((c) => (
            <div key={c.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span>{estadoIcon[c.estado] ?? '❓'}</span>
                <span className="font-medium text-sm text-gray-900 dark:text-white">{zonaLabels[c.zona_vehiculo] ?? c.zona_vehiculo}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{c.estado.replace('_', ' ')}</p>
              {c.notas && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{c.notas}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">{t('otDetalle.sinChecklist')}</p>
      )}
    </Card>
  );
}

function PresupuestoTab({
  presupuestos,
  onCreate,
  onEnviar,
  onAprobar,
}: {
  presupuestos: Presupuesto[];
  onCreate: () => void;
  onEnviar: (id: number) => void;
  onAprobar: (id: number) => void;
}) {
  const { t } = useI18n();
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t('otDetalle.presupuestosTitle')}</h3>
        <Button size="sm" onClick={onCreate}><Plus className="h-3 w-3 mr-1" /> {t('otDetalle.crearPresupuesto')}</Button>
      </div>
      {presupuestos.length ? (
        <div className="space-y-3">
          {presupuestos.map((p) => (
            <div key={p.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{p.numero}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    p.estado === 'aprobado' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                    p.estado === 'enviado' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' :
                    p.estado === 'rechazado' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {p.estado}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">${Number(p.total).toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {(p.items_json ?? []).length} {t('otDetalle.presItems')} — {t('otDetalle.presSubtotal')}: ${Number(p.subtotal).toLocaleString()} + {t('otDetalle.presIva')}: ${Number(p.iva).toLocaleString()}
              </div>
              <div className="flex gap-2">
                {p.estado === 'borrador' && (
                  <Button size="sm" onClick={() => onEnviar(p.id)}>
                    <Send className="h-3 w-3 mr-1" /> {t('otDetalle.presEnviar')}
                  </Button>
                )}
                {p.estado === 'enviado' && (
                  <Button size="sm" onClick={() => onAprobar(p.id)}>
                    <CheckCircle className="h-3 w-3 mr-1" /> {t('otDetalle.presAprobar')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">{t('otDetalle.sinPresupuestos')}</p>
      )}
    </Card>
  );
}

function DetalleModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { tipo: string; descripcion: string; cantidad: number; precio_unit: number }) => void;
}) {
  const { t } = useI18n();
  const [tipo, setTipo] = useState('mano_obra');
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [precioUnit, setPrecioUnit] = useState(0);

  const handleSave = () => {
    if (!descripcion.trim()) return;
    onSave({ tipo, descripcion, cantidad, precio_unit: precioUnit });
    setDescripcion('');
    setCantidad(1);
    setPrecioUnit(0);
  };

  return (
    <Modal open={open} onClose={onClose} title={t('otDetalle.modalDetalleTitulo')}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('otDetalle.detalleModalTipo')}</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm">
            <option value="mano_obra">{t('otDetalle.tipoManoObra')}</option>
            <option value="repuesto">{t('otDetalle.tipoRepuesto')}</option>
          </select>
        </div>
        <Input label={t('otDetalle.detalleModalDescripcion')} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('otDetalle.detalleModalCantidad')} type="number" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
          <Input label={t('otDetalle.detalleModalPrecio')} type="number" value={precioUnit} onChange={(e) => setPrecioUnit(Number(e.target.value))} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>{t('otDetalle.detalleModalCancelar')}</Button>
          <Button onClick={handleSave}>{t('otDetalle.detalleModalAgregar')}</Button>
        </div>
      </div>
    </Modal>
  );
}
