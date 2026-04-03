import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ChevronRight, ChevronLeft, Search, UserPlus, CarFront, Plus,
  Wrench, Check,
} from 'lucide-react';
import { Button, Input } from './ui';
import { clientesService } from '../services/clientes.service';
import { vehiculosService } from '../services/vehiculos.service';
import { mecanicosService } from '../services/mecanicos.service';
import { ordenesTrabajoService } from '../services/ordenes-trabajo.service';
import { useI18n } from '../context/I18nContext';
import type { Cliente, Vehiculo, Mecanico } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

/* ───────── step indicator ───────── */
function StepIndicator({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all
                  ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-900' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}
              >
                {done ? <Check size={16} /> : i + 1}
              </div>
              <span className={`mt-1 text-xs font-medium ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`h-0.5 w-10 rounded ${i < current ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'} mb-5`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ───────── main wizard ───────── */
export function NuevaOtWizard({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [step, setStep] = useState(0);

  /* ── data ── */
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [vehiculoSearch, setVehiculoSearch] = useState('');

  /* ── selections ── */
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);

  /* ── new client form ── */
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [newCliente, setNewCliente] = useState({ nombre: '', rut: '', telefono: '', email: '' });

  /* ── new vehicle form ── */
  const [showNewVehiculo, setShowNewVehiculo] = useState(false);
  const [newVehiculo, setNewVehiculo] = useState({ patente: '', marca: '', modelo: '', anio: '', color: '' });

  /* ── client vehicles ── */
  const [clienteVehiculos, setClienteVehiculos] = useState<Vehiculo[]>([]);

  /* ── OT fields ── */
  const [otData, setOtData] = useState({
    tipo_servicio: '',
    km_ingreso: '',
    combustible_ing: '',
    diagnostico: '',
    prioridad: 'media',
    mecanico_id: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ── load data ── */
  useEffect(() => {
    if (!open) return;
    clientesService.list().then(setClientes);
    mecanicosService.getActive().then(setMecanicos);
  }, [open]);

  /* ── load vehicles when client selected ── */
  useEffect(() => {
    if (!selectedCliente) { setClienteVehiculos([]); return; }
    vehiculosService.list().then((all) =>
      setClienteVehiculos(all.filter((v: Vehiculo) => v.cliente_id === selectedCliente.id)),
    );
  }, [selectedCliente]);

  /* ── reset on close ── */
  const reset = useCallback(() => {
    setStep(0);
    setSelectedCliente(null);
    setSelectedVehiculo(null);
    setShowNewCliente(false);
    setShowNewVehiculo(false);
    setNewCliente({ nombre: '', rut: '', telefono: '', email: '' });
    setNewVehiculo({ patente: '', marca: '', modelo: '', anio: '', color: '' });
    setClienteSearch('');
    setVehiculoSearch('');
    setOtData({ tipo_servicio: '', km_ingreso: '', combustible_ing: '', diagnostico: '', prioridad: 'media', mecanico_id: '' });
    setError('');
    setLoading(false);
  }, []);

  const handleClose = () => { reset(); onClose(); };

  /* ── filtered lists ── */
  const filteredClientes = useMemo(() => {
    if (!clienteSearch.trim()) return clientes;
    const q = clienteSearch.toLowerCase();
    return clientes.filter(
      (c) => c.nombre.toLowerCase().includes(q) || (c.rut ?? '').toLowerCase().includes(q) || (c.telefono ?? '').includes(q),
    );
  }, [clientes, clienteSearch]);

  const filteredVehiculos = useMemo(() => {
    if (!vehiculoSearch.trim()) return clienteVehiculos;
    const q = vehiculoSearch.toLowerCase();
    return clienteVehiculos.filter(
      (v) => v.patente.toLowerCase().includes(q) || (v.marca ?? '').toLowerCase().includes(q) || (v.modelo ?? '').toLowerCase().includes(q),
    );
  }, [clienteVehiculos, vehiculoSearch]);

  /* ── create new client ── */
  const handleCreateCliente = async () => {
    if (!newCliente.nombre.trim()) { setError(t('wizard.valClienteNombre')); return; }
    setLoading(true);
    setError('');
    try {
      const created = await clientesService.create(newCliente);
      setClientes((prev) => [...prev, created]);
      setSelectedCliente(created);
      setShowNewCliente(false);
      setNewCliente({ nombre: '', rut: '', telefono: '', email: '' });
      setStep(1);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('wizard.errorCrearCliente'));
    } finally { setLoading(false); }
  };

  /* ── create new vehicle ── */
  const handleCreateVehiculo = async () => {
    if (!newVehiculo.patente.trim()) { setError(t('wizard.valVehiculoPatente')); return; }
    if (!selectedCliente) return;
    setLoading(true);
    setError('');
    try {
      const created = await vehiculosService.create({
        ...newVehiculo,
        anio: newVehiculo.anio ? Number(newVehiculo.anio) : undefined,
        cliente_id: selectedCliente.id,
      } as unknown as Partial<Vehiculo>);
      setClienteVehiculos((prev) => [...prev, created]);
      setSelectedVehiculo(created);
      setShowNewVehiculo(false);
      setNewVehiculo({ patente: '', marca: '', modelo: '', anio: '', color: '' });
      setStep(2);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('wizard.errorCrearVehiculo'));
    } finally { setLoading(false); }
  };

  /* ── create OT ── */
  const handleCreateOT = async () => {
    if (!selectedCliente || !selectedVehiculo) return;
    setLoading(true);
    setError('');
    try {
      const ot = await ordenesTrabajoService.create({
        cliente_id: selectedCliente.id,
        vehiculo_id: selectedVehiculo.id,
        mecanico_id: otData.mecanico_id ? Number(otData.mecanico_id) : undefined,
        tipo_servicio: otData.tipo_servicio || undefined,
        km_ingreso: otData.km_ingreso ? Number(otData.km_ingreso) : undefined,
        combustible_ing: otData.combustible_ing || undefined,
        diagnostico: otData.diagnostico || undefined,
        prioridad: otData.prioridad || undefined,
      });
      handleClose();
      navigate(`/ordenes-trabajo/${ot.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('wizard.errorCrearOt'));
    } finally { setLoading(false); }
  };

  /* ── select helpers ── */
  const selectCliente = (c: Cliente) => { setSelectedCliente(c); setStep(1); setError(''); };
  const selectVehiculo = (v: Vehiculo) => { setSelectedVehiculo(v); setStep(2); setError(''); };

  const stepLabels = [t('wizard.stepCliente'), t('wizard.stepVehiculo'), t('wizard.stepOt')];

  if (!open) return null;

  const selectCls = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-800 overflow-hidden my-auto">
        {/* ── header ── */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wrench size={20} className="text-blue-600" />
            {t('wizard.title')}
          </h2>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        {/* ── body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <StepIndicator current={step} labels={stepLabels} />

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* ═══ STEP 0 — CLIENTE ═══ */}
          {step === 0 && (
            <div className="space-y-4">
              {selectedCliente ? (
                <div className="rounded-lg border-2 border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedCliente.nombre}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedCliente.rut && `${selectedCliente.rut} · `}{selectedCliente.telefono ?? ''} {selectedCliente.email ? `· ${selectedCliente.email}` : ''}
                    </p>
                  </div>
                  <button onClick={() => { setSelectedCliente(null); setSelectedVehiculo(null); }} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                    {t('wizard.cambiar')}
                  </button>
                </div>
              ) : (
                <>
                  {/* search bar */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white pl-9 pr-3 py-2.5 text-sm placeholder:text-gray-400"
                      placeholder={t('wizard.buscarCliente')}
                      value={clienteSearch}
                      onChange={(e) => setClienteSearch(e.target.value)}
                    />
                  </div>

                  {/* list */}
                  <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredClientes.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-gray-400">{t('wizard.sinResultados')}</p>
                    ) : (
                      filteredClientes.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => selectCliente(c)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-bold text-sm">
                            {c.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{c.nombre}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {c.rut ?? ''} {c.telefono ? `· ${c.telefono}` : ''}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* new client toggle */}
                  {!showNewCliente ? (
                    <button
                      onClick={() => setShowNewCliente(true)}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <UserPlus size={16} /> {t('wizard.nuevoCliente')}
                    </button>
                  ) : (
                    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 p-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('wizard.datosNuevoCliente')}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Input label={t('clientes.labelNombre') + ' *'} value={newCliente.nombre} onChange={(e) => setNewCliente((p) => ({ ...p, nombre: e.target.value }))} />
                        <Input label={t('clientes.labelRut')} value={newCliente.rut} onChange={(e) => setNewCliente((p) => ({ ...p, rut: e.target.value }))} />
                        <Input label={t('clientes.labelTelefono')} value={newCliente.telefono} onChange={(e) => setNewCliente((p) => ({ ...p, telefono: e.target.value }))} />
                        <Input label={t('clientes.labelEmail')} value={newCliente.email} onChange={(e) => setNewCliente((p) => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setShowNewCliente(false)}>{t('common.cancelar')}</Button>
                        <Button size="sm" loading={loading} onClick={handleCreateCliente}>
                          <Plus size={14} className="mr-1" /> {t('wizard.crearCliente')}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ STEP 1 — VEHICULO ═══ */}
          {step === 1 && (
            <div className="space-y-4">
              {/* selected client summary */}
              {selectedCliente && (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                  {t('wizard.clienteSeleccionado')}: <span className="font-semibold text-gray-900 dark:text-white">{selectedCliente.nombre}</span>
                </div>
              )}

              {selectedVehiculo ? (
                <div className="rounded-lg border-2 border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedVehiculo.patente}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedVehiculo.marca} {selectedVehiculo.modelo} {selectedVehiculo.anio ?? ''}
                      {selectedVehiculo.color ? ` · ${selectedVehiculo.color}` : ''}
                    </p>
                  </div>
                  <button onClick={() => setSelectedVehiculo(null)} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                    {t('wizard.cambiar')}
                  </button>
                </div>
              ) : (
                <>
                  {/* search */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white pl-9 pr-3 py-2.5 text-sm placeholder:text-gray-400"
                      placeholder={t('wizard.buscarVehiculo')}
                      value={vehiculoSearch}
                      onChange={(e) => setVehiculoSearch(e.target.value)}
                    />
                  </div>

                  {/* vehicle list */}
                  <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredVehiculos.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-gray-400">{t('wizard.sinVehiculos')}</p>
                    ) : (
                      filteredVehiculos.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => selectVehiculo(v)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300">
                            <CarFront size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white">{v.patente}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {v.marca} {v.modelo} {v.anio ?? ''} {v.color ? `· ${v.color}` : ''}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* new vehicle toggle */}
                  {!showNewVehiculo ? (
                    <button
                      onClick={() => setShowNewVehiculo(true)}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <CarFront size={16} /> {t('wizard.nuevoVehiculo')}
                    </button>
                  ) : (
                    <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/20 p-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('wizard.datosNuevoVehiculo')}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Input label={t('vehiculos.labelPatente') + ' *'} value={newVehiculo.patente} onChange={(e) => setNewVehiculo((p) => ({ ...p, patente: e.target.value }))} />
                        <Input label={t('vehiculos.labelMarca')} value={newVehiculo.marca} onChange={(e) => setNewVehiculo((p) => ({ ...p, marca: e.target.value }))} />
                        <Input label={t('vehiculos.labelModelo')} value={newVehiculo.modelo} onChange={(e) => setNewVehiculo((p) => ({ ...p, modelo: e.target.value }))} />
                        <Input label={t('vehiculos.labelAnio')} type="number" value={newVehiculo.anio} onChange={(e) => setNewVehiculo((p) => ({ ...p, anio: e.target.value }))} />
                        <Input label={t('vehiculos.labelColor')} value={newVehiculo.color} onChange={(e) => setNewVehiculo((p) => ({ ...p, color: e.target.value }))} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setShowNewVehiculo(false)}>{t('common.cancelar')}</Button>
                        <Button size="sm" loading={loading} onClick={handleCreateVehiculo}>
                          <Plus size={14} className="mr-1" /> {t('wizard.crearVehiculo')}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ STEP 2 — OT DATA ═══ */}
          {step === 2 && (
            <div className="space-y-4">
              {/* summary */}
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 px-4 py-3 text-sm space-y-1">
                <p className="text-gray-600 dark:text-gray-300">
                  {t('wizard.clienteSeleccionado')}: <span className="font-semibold text-gray-900 dark:text-white">{selectedCliente?.nombre}</span>
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('wizard.vehiculoSeleccionado')}: <span className="font-semibold text-gray-900 dark:text-white">{selectedVehiculo?.patente} — {selectedVehiculo?.marca} {selectedVehiculo?.modelo}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('nuevaOt.labelTipoServicio')}
                  value={otData.tipo_servicio}
                  onChange={(e) => setOtData((p) => ({ ...p, tipo_servicio: e.target.value }))}
                  placeholder={t('wizard.phTipoServicio')}
                />
                <Input
                  label={t('nuevaOt.labelKmIngreso')}
                  type="number"
                  value={otData.km_ingreso}
                  onChange={(e) => setOtData((p) => ({ ...p, km_ingreso: e.target.value }))}
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('nuevaOt.labelPrioridad')}</label>
                  <select className={selectCls} value={otData.prioridad} onChange={(e) => setOtData((p) => ({ ...p, prioridad: e.target.value }))}>
                    <option value="baja">{t('nuevaOt.prioridadBaja')}</option>
                    <option value="media">{t('nuevaOt.prioridadMedia')}</option>
                    <option value="alta">{t('nuevaOt.prioridadAlta')}</option>
                    <option value="urgente">{t('nuevaOt.prioridadUrgente')}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('nuevaOt.labelCombustible')}</label>
                  <select className={selectCls} value={otData.combustible_ing} onChange={(e) => setOtData((p) => ({ ...p, combustible_ing: e.target.value }))}>
                    <option value="">--</option>
                    <option value="bencina">{t('nuevaOt.combustibleBencina')}</option>
                    <option value="diesel">{t('nuevaOt.combustibleDiesel')}</option>
                    <option value="electrico">{t('nuevaOt.combustibleElectrico')}</option>
                    <option value="hibrido">{t('nuevaOt.combustibleHibrido')}</option>
                    <option value="gas">{t('nuevaOt.combustibleGas')}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('nuevaOt.labelMecanico')}</label>
                  <select className={selectCls} value={otData.mecanico_id} onChange={(e) => setOtData((p) => ({ ...p, mecanico_id: e.target.value }))}>
                    <option value="">{t('nuevaOt.sinAsignar')}</option>
                    {mecanicos.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}{m.especialidad ? ` (${m.especialidad})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('nuevaOt.labelDiagnostico')}</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
                  rows={3}
                  value={otData.diagnostico}
                  onChange={(e) => setOtData((p) => ({ ...p, diagnostico: e.target.value }))}
                  placeholder={t('wizard.phDiagnostico')}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── footer ── */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft size={16} className="mr-1" /> {t('wizard.atras')}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose}>{t('common.cancelar')}</Button>
            {step === 0 && selectedCliente && (
              <Button onClick={() => setStep(1)}>
                {t('wizard.siguiente')} <ChevronRight size={16} className="ml-1" />
              </Button>
            )}
            {step === 1 && selectedVehiculo && (
              <Button onClick={() => setStep(2)}>
                {t('wizard.siguiente')} <ChevronRight size={16} className="ml-1" />
              </Button>
            )}
            {step === 2 && (
              <Button loading={loading} onClick={handleCreateOT}>
                <Wrench size={16} className="mr-1.5" /> {t('wizard.crearOt')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
