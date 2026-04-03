import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Modal, Card, Badge } from '../../components/ui';
import { useConfirm } from '../../components/ui';
import { mecanicosService } from '../../services/mecanicos.service';
import { useI18n } from '../../context/I18nContext';
import type { Mecanico } from '../../types';

const schema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  especialidad: z.string().optional(),
  tarifa_hora: z.number().optional(),
});

type Form = z.infer<typeof schema>;

export default function MecanicosPage() {
  const { t } = useI18n();
  const confirm = useConfirm();
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Mecanico | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const load = async () => {
    const data = await mecanicosService.getAll();
    setMecanicos(data);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    reset({ nombre: '', especialidad: '', tarifa_hora: undefined });
    setModalOpen(true);
  };

  const openEdit = (m: Mecanico) => {
    setEditing(m);
    reset({ nombre: m.nombre, especialidad: m.especialidad ?? '', tarifa_hora: m.tarifa_hora ?? undefined });
    setModalOpen(true);
  };

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      if (editing) {
        await mecanicosService.update(editing.id, data);
      } else {
        await mecanicosService.create(data);
      }
      setModalOpen(false);
      load();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirm({ message: t('mecanicos.confirmDesactivar'), variant: 'danger' }))) return;
    await mecanicosService.remove(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('mecanicos.title')}</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> {t('mecanicos.nuevo')}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mecanicos.map((m) => (
          <Card key={m.id} className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{m.nombre}</h3>
                {m.especialidad && <p className="text-sm text-gray-500 dark:text-gray-400">{m.especialidad}</p>}
                {m.tarifa_hora != null && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">${m.tarifa_hora.toLocaleString()}{t('mecanicos.hora')}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={m.activo ? 'success' : 'danger'} label={m.activo ? t('mecanicos.activo') : t('mecanicos.inactivo')} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="secondary" onClick={() => openEdit(m)}>
                <Pencil className="h-3 w-3 mr-1" /> {t('mecanicos.editar')}
              </Button>
              {m.activo && (
                <Button size="sm" variant="danger" onClick={() => handleDelete(m.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> {t('mecanicos.desactivar')}
                </Button>
              )}
            </div>
          </Card>
        ))}
        {mecanicos.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
            {t('mecanicos.empty')}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('mecanicos.modalEditar') : t('mecanicos.modalNuevo')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('mecanicos.labelNombre')} {...register('nombre')} error={errors.nombre?.message} />
          <Input label={t('mecanicos.labelEspecialidad')} {...register('especialidad')} />
          <Input label={t('mecanicos.labelTarifa')} type="number" {...register('tarifa_hora', { valueAsNumber: true })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>{t('mecanicos.cancelar')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('mecanicos.guardando') : t('mecanicos.guardar')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
