import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Modal, Card, Badge, PlanLimitModal } from '../../components/ui';
import { useConfirm } from '../../components/ui';
import { vehiculosService } from '../../services/vehiculos.service';
import { billingService } from '../../services/billing.service';
import { useI18n } from '../../context/I18nContext';
import type { Vehiculo } from '../../types';

const schema = z.object({
  cliente_id: z.number().min(1, 'Cliente requerido'),
  patente: z.string().min(2, 'Patente requerida').max(10),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  anio: z.number().optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  km_actual: z.number().min(0),
});

type Form = z.infer<typeof schema>;

export default function VehiculosPage() {
  const { t } = useI18n();
  const confirm = useConfirm();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehiculo | null>(null);
  const [loading, setLoading] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [limitUsado, setLimitUsado] = useState(0);
  const [limitMax, setLimitMax] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const load = async () => {
    const data = await vehiculosService.list(search || undefined);
    setVehiculos(data);
  };

  useEffect(() => {
    load();
  }, [search]);

  const openNew = async () => {
    try {
      const usage = await billingService.getUsage();
      if (usage.vehiculos.usado >= usage.vehiculos.limite) {
        setLimitUsado(usage.vehiculos.usado);
        setLimitMax(usage.vehiculos.limite);
        setLimitOpen(true);
        return;
      }
    } catch { /* let backend guard catch it */ }
    setEditing(null);
    reset({ cliente_id: 0, patente: '', marca: '', modelo: '', anio: undefined, color: '', vin: '', km_actual: 0 });
    setModalOpen(true);
  };

  const openEdit = (v: Vehiculo) => {
    setEditing(v);
    reset({
      cliente_id: v.cliente_id,
      patente: v.patente,
      marca: v.marca ?? '',
      modelo: v.modelo ?? '',
      anio: v.anio ?? undefined,
      color: v.color ?? '',
      vin: v.vin ?? '',
      km_actual: v.km_actual,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      if (editing) {
        await vehiculosService.update(editing.id, data);
      } else {
        await vehiculosService.create(data);
      }
      setModalOpen(false);
      await load();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirm({ message: t('vehiculos.confirmDelete'), variant: 'danger' }))) return;
    await vehiculosService.remove(id);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('vehiculos.title')}</h1>
        <Button onClick={openNew}>
          <Plus size={16} className="mr-1" /> {t('vehiculos.nuevo')}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
          placeholder={t('vehiculos.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                <th className="pb-3 font-medium">{t('vehiculos.thPatente')}</th>
                <th className="pb-3 font-medium">{t('vehiculos.thMarca')}</th>
                <th className="pb-3 font-medium">{t('vehiculos.thModelo')}</th>
                <th className="pb-3 font-medium">{t('vehiculos.thAnio')}</th>
                <th className="pb-3 font-medium">{t('vehiculos.thKm')}</th>
                <th className="pb-3 font-medium">{t('vehiculos.thCliente')}</th>
                <th className="pb-3 font-medium sr-only">{t('vehiculos.thAcciones')}</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((v) => (
                <tr key={v.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                  <td className="py-3 font-mono font-semibold text-gray-900 dark:text-white">{v.patente}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{v.marca ?? '—'}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{v.modelo ?? '—'}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{v.anio ?? '—'}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{v.km_actual.toLocaleString()}</td>
                  <td className="py-3">
                    <Badge label={v.cliente?.nombre ?? `#${v.cliente_id}`} variant="info" />
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(v)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(v.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {vehiculos.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 dark:text-gray-500">
                    {t('vehiculos.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('vehiculos.modalEditar') : t('vehiculos.modalNuevo')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('vehiculos.labelIdCliente')} type="number" {...register('cliente_id')} error={errors.cliente_id?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('vehiculos.labelPatente')} {...register('patente')} error={errors.patente?.message} />
            <Input label={t('vehiculos.labelVin')} {...register('vin')} error={errors.vin?.message} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('vehiculos.labelMarca')} {...register('marca')} />
            <Input label={t('vehiculos.labelModelo')} {...register('modelo')} />
            <Input label={t('vehiculos.labelAnio')} type="number" {...register('anio')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('vehiculos.labelColor')} {...register('color')} />
            <Input label={t('vehiculos.labelKilometraje')} type="number" {...register('km_actual')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              {t('vehiculos.cancelar')}
            </Button>
            <Button type="submit" loading={loading}>
              {editing ? t('vehiculos.guardar') : t('vehiculos.crear')}
            </Button>
          </div>
        </form>
      </Modal>

      <PlanLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        resource="vehiculos"
        usado={limitUsado}
        limite={limitMax}
      />
    </div>
  );
}
