import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button, Input, Modal, Card } from '../../components/ui';
import { useConfirm } from '../../components/ui';
import { proveedoresService } from '../../services/proveedores.service';
import { useI18n } from '../../context/I18nContext';
import type { Proveedor } from '../../types';

const schema = z.object({
  razon_social: z.string().min(2, 'Razón social requerida'),
  rut: z.string().optional(),
  contacto: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export default function ProveedoresPage() {
  const { t } = useI18n();
  const confirm = useConfirm();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const load = async () => {
    const data = await proveedoresService.getAll(search || undefined);
    setProveedores(data);
  };

  useEffect(() => { load(); }, [search]);

  const openNew = () => {
    setEditing(null);
    reset({ razon_social: '', rut: '', contacto: '', email: '', telefono: '' });
    setModalOpen(true);
  };

  const openEdit = (p: Proveedor) => {
    setEditing(p);
    reset({
      razon_social: p.razon_social, rut: p.rut ?? '', contacto: p.contacto ?? '',
      email: p.email ?? '', telefono: p.telefono ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      if (editing) {
        await proveedoresService.update(editing.id, data);
      } else {
        await proveedoresService.create(data);
      }
      setModalOpen(false);
      load();
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirm({ message: t('proveedores.confirmDelete'), variant: 'danger' }))) return;
    await proveedoresService.remove(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('proveedores.title')}</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> {t('proveedores.nuevo')}</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text" placeholder={t('proveedores.searchPlaceholder')} value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                <th className="pb-3 font-medium">{t('proveedores.thRazonSocial')}</th>
                <th className="pb-3 font-medium">{t('proveedores.thRut')}</th>
                <th className="pb-3 font-medium">{t('proveedores.thContacto')}</th>
                <th className="pb-3 font-medium">{t('proveedores.thEmail')}</th>
                <th className="pb-3 font-medium">{t('proveedores.thTelefono')}</th>
                <th className="pb-3 font-medium text-right">{t('proveedores.thAcciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {proveedores.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{p.razon_social}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{p.rut || '—'}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{p.contacto || '—'}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{p.email || '—'}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{p.telefono || '—'}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title={t('proveedores.modalEditar')}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title={t('proveedores.confirmDelete')}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {proveedores.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">{t('proveedores.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('proveedores.modalEditar') : t('proveedores.modalNuevo')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('proveedores.labelRazonSocial')} {...register('razon_social')} error={errors.razon_social?.message} />
          <Input label={t('proveedores.labelRut')} {...register('rut')} />
          <Input label={t('proveedores.labelContacto')} {...register('contacto')} />
          <Input label={t('proveedores.labelEmail')} type="email" {...register('email')} error={errors.email?.message} />
          <Input label={t('proveedores.labelTelefono')} {...register('telefono')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>{t('common.cancelar')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('common.guardando') : t('common.guardar')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
