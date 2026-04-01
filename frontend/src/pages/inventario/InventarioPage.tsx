import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, AlertTriangle, Search, Package, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { Button, Input, Modal, Card, Badge } from '../../components/ui';
import { repuestosService } from '../../services/repuestos.service';
import { inventarioService } from '../../services/inventario.service';
import type { Repuesto, MovimientoStock } from '../../types';

const repuestoSchema = z.object({
  codigo: z.string().optional(),
  nombre: z.string().min(2, 'Nombre requerido'),
  descripcion: z.string().optional(),
  categoria: z.string().optional(),
  precio_compra: z.number().min(0),
  precio_venta: z.number().min(0),
  stock_actual: z.number().min(0),
  stock_minimo: z.number().min(0),
  ubicacion_bodega: z.string().optional(),
});

type RepuestoForm = z.infer<typeof repuestoSchema>;

const movimientoSchema = z.object({
  tipo: z.enum(['entrada', 'salida', 'ajuste']),
  cantidad: z.number().min(1, 'Mínimo 1'),
  motivo: z.string().optional(),
});

type MovimientoForm = z.infer<typeof movimientoSchema>;

export default function InventarioPage() {
  const { t } = useI18n();
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [stockBajo, setStockBajo] = useState<Repuesto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Repuesto | null>(null);
  const [movModalOpen, setMovModalOpen] = useState(false);
  const [movRepuesto, setMovRepuesto] = useState<Repuesto | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [loading, setLoading] = useState(false);

  const repForm = useForm<RepuestoForm>({ resolver: zodResolver(repuestoSchema) });
  const movForm = useForm<MovimientoForm>({ resolver: zodResolver(movimientoSchema) });

  const load = async () => {
    const [data, bajo, cats] = await Promise.all([
      repuestosService.getAll({ search: search || undefined, categoria: catFilter || undefined }),
      repuestosService.getStockBajo(),
      repuestosService.getCategorias(),
    ]);
    setRepuestos(data);
    setStockBajo(bajo);
    setCategorias(cats);
  };

  useEffect(() => { load(); }, [search, catFilter]);

  const openNew = () => {
    setEditing(null);
    repForm.reset({ codigo: '', nombre: '', descripcion: '', categoria: '', precio_compra: 0, precio_venta: 0, stock_actual: 0, stock_minimo: 5, ubicacion_bodega: '' });
    setModalOpen(true);
  };

  const openEdit = (r: Repuesto) => {
    setEditing(r);
    repForm.reset({
      codigo: r.codigo ?? '', nombre: r.nombre, descripcion: r.descripcion ?? '',
      categoria: r.categoria ?? '', precio_compra: r.precio_compra, precio_venta: r.precio_venta,
      stock_actual: r.stock_actual, stock_minimo: r.stock_minimo, ubicacion_bodega: r.ubicacion_bodega ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: RepuestoForm) => {
    setLoading(true);
    try {
      if (editing) {
        await repuestosService.update(editing.id, data);
      } else {
        await repuestosService.create(data);
      }
      setModalOpen(false);
      load();
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('inventario.confirmDelete'))) return;
    await repuestosService.remove(id);
    load();
  };

  const openMovimiento = async (r: Repuesto) => {
    setMovRepuesto(r);
    movForm.reset({ tipo: 'entrada', cantidad: 1, motivo: '' });
    const movs = await inventarioService.getMovimientos(r.id);
    setMovimientos(movs);
    setMovModalOpen(true);
  };

  const onMovSubmit = async (data: MovimientoForm) => {
    if (!movRepuesto) return;
    setLoading(true);
    try {
      await inventarioService.registrarMovimiento({ repuesto_id: movRepuesto.id, ...data });
      const movs = await inventarioService.getMovimientos(movRepuesto.id);
      setMovimientos(movs);
      movForm.reset({ tipo: 'entrada', cantidad: 1, motivo: '' });
      load();
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('inventario.title')}</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> {t('inventario.nuevoRepuesto')}</Button>
      </div>

      {/* Stock bajo alert */}
      {stockBajo.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold mb-2">
            <AlertTriangle className="h-5 w-5" /> {t('inventario.stockBajoAlerta')} ({stockBajo.length} {t('inventario.stockBajoItems')})
          </div>
          <div className="flex flex-wrap gap-2">
            {stockBajo.map((r) => (
              <span key={r.id} className="text-sm bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-1 rounded">
                {r.nombre}: {r.stock_actual}/{r.stock_minimo}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text" placeholder={t('inventario.searchPlaceholder')} value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">{t('inventario.todasCategorias')}</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                <th className="pb-3 font-medium">{t('inventario.thCodigo')}</th>
                <th className="pb-3 font-medium">{t('inventario.thNombre')}</th>
                <th className="pb-3 font-medium">{t('inventario.thCategoria')}</th>
                <th className="pb-3 font-medium text-right">{t('inventario.thPCompra')}</th>
                <th className="pb-3 font-medium text-right">{t('inventario.thPVenta')}</th>
                <th className="pb-3 font-medium text-right">{t('inventario.thStock')}</th>
                <th className="pb-3 font-medium">{t('inventario.thUbicacion')}</th>
                <th className="pb-3 font-medium text-right">{t('inventario.thAcciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {repuestos.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 text-gray-600 dark:text-gray-400">{r.codigo || '—'}</td>
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{r.nombre}</td>
                  <td className="py-3">{r.categoria ? <Badge label={r.categoria} /> : '—'}</td>
                  <td className="py-3 text-right dark:text-gray-200">${r.precio_compra.toLocaleString()}</td>
                  <td className="py-3 text-right dark:text-gray-200">${r.precio_venta.toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <span className={r.stock_actual <= r.stock_minimo ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                      {r.stock_actual}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">(min: {r.stock_minimo})</span>
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{r.ubicacion_bodega || '—'}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openMovimiento(r)} className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" title="Movimientos">
                        <Package className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEdit(r)} className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {repuestos.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">{t('inventario.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Repuesto Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('inventario.modalEditarRepuesto') : t('inventario.modalNuevoRepuesto')}>
        <form onSubmit={repForm.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('inventario.labelCodigo')} {...repForm.register('codigo')} />
            <Input label={t('inventario.labelNombre')} {...repForm.register('nombre')} error={repForm.formState.errors.nombre?.message} />
          </div>
          <Input label={t('inventario.labelDescripcion')} {...repForm.register('descripcion')} />
          <Input label={t('inventario.labelCategoria')} {...repForm.register('categoria')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('inventario.labelPrecioCompra')} type="number" {...repForm.register('precio_compra', { valueAsNumber: true })} />
            <Input label={t('inventario.labelPrecioVenta')} type="number" {...repForm.register('precio_venta', { valueAsNumber: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('inventario.labelStockActual')} type="number" {...repForm.register('stock_actual', { valueAsNumber: true })} />
            <Input label={t('inventario.labelStockMinimo')} type="number" {...repForm.register('stock_minimo', { valueAsNumber: true })} />
          </div>
          <Input label={t('inventario.labelUbicacionBodega')} {...repForm.register('ubicacion_bodega')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>{t('inventario.cancelar')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('inventario.guardando') : t('inventario.guardar')}</Button>
          </div>
        </form>
      </Modal>

      {/* Movimiento Modal */}
      <Modal open={movModalOpen} onClose={() => setMovModalOpen(false)} title={`${t('inventario.movimientosTitle')} ${movRepuesto?.nombre ?? ''}`}>
        <div className="space-y-4">
          <form onSubmit={movForm.handleSubmit(onMovSubmit)} className="flex gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('inventario.movTipoLabel')}</label>
              <select {...movForm.register('tipo')} className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white">
                <option value="entrada">{t('inventario.movEntrada')}</option>
                <option value="salida">{t('inventario.movSalida')}</option>
                <option value="ajuste">{t('inventario.movAjuste')}</option>
              </select>
            </div>
            <Input label={t('inventario.movCantidad')} type="number" {...movForm.register('cantidad', { valueAsNumber: true })} error={movForm.formState.errors.cantidad?.message} />
            <Input label={t('inventario.movMotivo')} {...movForm.register('motivo')} />
            <Button type="submit" disabled={loading} size="sm">{loading ? '...' : t('inventario.movRegistrar')}</Button>
          </form>

          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="pb-2 font-medium">{t('inventario.movThFecha')}</th>
                  <th className="pb-2 font-medium">{t('inventario.movThTipo')}</th>
                  <th className="pb-2 font-medium text-right">{t('inventario.movThCantidad')}</th>
                  <th className="pb-2 font-medium">{t('inventario.movThMotivo')}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {movimientos.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{new Date(m.created_at!).toLocaleDateString()}</td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1">
                        {m.tipo === 'entrada' && <ArrowDownToLine className="h-3 w-3 text-green-600" />}
                        {m.tipo === 'salida' && <ArrowUpFromLine className="h-3 w-3 text-red-600" />}
                        <Badge label={m.tipo} variant={m.tipo === 'entrada' ? 'success' : m.tipo === 'salida' ? 'danger' : 'warning'} />
                      </span>
                    </td>
                    <td className="py-2 text-right dark:text-gray-200">{m.cantidad}</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{m.motivo || '—'}</td>
                  </tr>
                ))}
                {movimientos.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500 dark:text-gray-400">{t('inventario.sinMovimientos')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
