import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Modal, Card, Badge } from '../../components/ui';
import { clientesService } from '../../services/clientes.service';
import { useI18n } from '../../context/I18nContext';
import type { Cliente } from '../../types';

const schema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  rut: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  tipo: z.enum(['persona', 'empresa']),
});

type Form = z.infer<typeof schema>;

export default function ClientesPage() {
  const { t } = useI18n();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const load = async () => {
    const data = await clientesService.list(search || undefined);
    setClientes(data);
  };

  useEffect(() => {
    load();
  }, [search]);

  const openNew = () => {
    setEditing(null);
    reset({ nombre: '', rut: '', email: '', telefono: '', direccion: '', tipo: 'persona' as const });
    setModalOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditing(c);
    reset({
      nombre: c.nombre,
      rut: c.rut ?? '',
      email: c.email ?? '',
      telefono: c.telefono ?? '',
      direccion: c.direccion ?? '',
      tipo: c.tipo,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      if (editing) {
        await clientesService.update(editing.id, data);
      } else {
        await clientesService.create(data);
      }
      setModalOpen(false);
      await load();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('clientes.confirmDelete'))) return;
    await clientesService.remove(id);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('clientes.title')}</h1>
        <Button onClick={openNew}>
          <Plus size={16} className="mr-1" /> {t('clientes.nuevo')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
          placeholder={t('clientes.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                <th className="pb-3 font-medium">{t('clientes.thNombre')}</th>
                <th className="pb-3 font-medium">{t('clientes.thRut')}</th>
                <th className="pb-3 font-medium">{t('clientes.thEmail')}</th>
                <th className="pb-3 font-medium">{t('clientes.thTelefono')}</th>
                <th className="pb-3 font-medium">{t('clientes.thTipo')}</th>
                <th className="pb-3 font-medium sr-only">{t('clientes.thAcciones')}</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{c.nombre}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{c.rut ?? '—'}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{c.email ?? '—'}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{c.telefono ?? '—'}</td>
                  <td className="py-3">
                    <Badge label={t(`enum.tipoCliente.${c.tipo}`)} variant={c.tipo === 'empresa' ? 'info' : 'default'} />
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 dark:text-gray-500">
                    {t('clientes.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('clientes.modalEditar') : t('clientes.modalNuevo')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('clientes.labelNombre')} {...register('nombre')} error={errors.nombre?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('clientes.labelRut')} {...register('rut')} error={errors.rut?.message} />
            <Input label={t('clientes.labelEmail')} type="email" {...register('email')} error={errors.email?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('clientes.labelTelefono')} {...register('telefono')} error={errors.telefono?.message} />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clientes.labelTipo')}</label>
              <select
                {...register('tipo')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="persona">{t('clientes.tipoPersona')}</option>
                <option value="empresa">{t('clientes.tipoEmpresa')}</option>
              </select>
            </div>
          </div>
          <Input label={t('clientes.labelDireccion')} {...register('direccion')} error={errors.direccion?.message} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              {t('clientes.cancelar')}
            </Button>
            <Button type="submit" loading={loading}>
              {editing ? t('clientes.guardar') : t('clientes.crear')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
