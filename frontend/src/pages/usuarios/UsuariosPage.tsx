import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Mail } from 'lucide-react';
import { Button, Input, Modal, Card, Badge } from '../../components/ui';
import { usuariosService } from '../../services/usuarios.service';
import { authService } from '../../services/auth.service';
import { useI18n } from '../../context/I18nContext';
import toast from 'react-hot-toast';
import type { User } from '../../types';

const schema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  rol: z.string().min(1, 'Rol requerido'),
  telefono: z.string().optional(),
});

const editSchema = schema.omit({ password: true });

type Form = z.infer<typeof schema>;

export default function UsuariosPage() {
  const { t } = useI18n();

  const roleLabels: Record<string, string> = {
    admin_taller: t('usuarios.rolAdmin'),
    recepcionista: t('usuarios.rolRecepcionista'),
    mecanico: t('usuarios.rolMecanico'),
    bodeguero: t('usuarios.rolBodeguero'),
    cajero: t('usuarios.rolCajero'),
    viewer: t('usuarios.rolViewer'),
  };
  const roleColors: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
    admin_taller: 'info',
    recepcionista: 'success',
    mecanico: 'warning',
    bodeguero: 'default',
    cajero: 'default',
    viewer: 'default',
  };

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteData, setInviteData] = useState({ nombre: '', email: '', rol: 'recepcionista', telefono: '' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(editing ? editSchema : schema) as any });

  const load = async () => {
    const data = await usuariosService.list();
    setUsuarios(data);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    reset({ nombre: '', email: '', password: '', rol: 'recepcionista', telefono: '' });
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    reset({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, telefono: u.telefono ?? '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      if (editing) {
        const { password, ...rest } = data;
        await usuariosService.update(editing.id, rest as Partial<User>);
      } else {
        await usuariosService.create(data);
      }
      setModalOpen(false);
      await load();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('usuarios.confirmDesactivar'))) return;
    await usuariosService.remove(id);
    await load();
  };

  const handleInvite = async () => {
    if (!inviteData.email || !inviteData.nombre) {
      toast.error(t('usuarios.toastNombreEmailReq'));
      return;
    }
    setInviting(true);
    try {
      await authService.inviteUser(inviteData);
      toast.success(t('usuarios.toastInvitacionEnviada'));
      setInviteOpen(false);
      setInviteData({ nombre: '', email: '', rol: 'recepcionista', telefono: '' });
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? t('usuarios.toastErrorInvitar'));
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('usuarios.title')}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setInviteOpen(true)}>
            <Mail size={16} className="mr-1" /> {t('usuarios.invitar')}
          </Button>
          <Button onClick={openNew}>
            <Plus size={16} className="mr-1" /> {t('usuarios.nuevo')}
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                <th className="pb-3 font-medium">{t('usuarios.thNombre')}</th>
                <th className="pb-3 font-medium">{t('usuarios.thEmail')}</th>
                <th className="pb-3 font-medium">{t('usuarios.thRol')}</th>
                <th className="pb-3 font-medium">{t('usuarios.thEstado')}</th>
                <th className="pb-3 font-medium sr-only">{t('usuarios.thAcciones')}</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{u.nombre}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                  <td className="py-3">
                    <Badge
                      label={roleLabels[u.rol] ?? u.rol}
                      variant={roleColors[u.rol] ?? 'default'}
                    />
                  </td>
                  <td className="py-3">
                    <Badge
                      label={u.activo ? t('usuarios.activo') : t('usuarios.inactivo')}
                      variant={u.activo ? 'success' : 'danger'}
                    />
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    {t('usuarios.empty')}
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
        title={editing ? t('usuarios.modalEditar') : t('usuarios.modalNuevo')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('usuarios.labelNombre')} {...register('nombre')} error={errors.nombre?.message} />
          <Input label={t('usuarios.labelEmail')} type="email" {...register('email')} error={errors.email?.message} />
          {!editing && (
            <Input label={t('usuarios.labelPassword')} type="password" {...register('password')} error={errors.password?.message} />
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('usuarios.labelRol')}</label>
              <select
                {...register('rol')}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {Object.entries(roleLabels).map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                ))}
              </select>
            </div>
            <Input label={t('usuarios.labelTelefono')} {...register('telefono')} error={errors.telefono?.message} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              {t('usuarios.cancelar')}
            </Button>
            <Button type="submit" loading={loading}>
              {editing ? t('usuarios.guardar') : t('usuarios.crear')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title={t('usuarios.modalInvitar')}
      >
        <div className="space-y-4">
          <Input
            label={t('usuarios.labelNombre')}
            value={inviteData.nombre}
            onChange={(e) => setInviteData({ ...inviteData, nombre: e.target.value })}
          />
          <Input
            label={t('usuarios.labelEmail')}
            type="email"
            value={inviteData.email}
            onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('usuarios.labelRol')}</label>
              <select
                value={inviteData.rol}
                onChange={(e) => setInviteData({ ...inviteData, rol: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {Object.entries(roleLabels).map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                ))}
              </select>
            </div>
            <Input
              label={t('usuarios.labelTelefono')}
              value={inviteData.telefono}
              onChange={(e) => setInviteData({ ...inviteData, telefono: e.target.value })}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('usuarios.inviteInfo')}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setInviteOpen(false)}>
              {t('usuarios.cancelar')}
            </Button>
            <Button onClick={handleInvite} loading={inviting}>
              {t('usuarios.enviarInvitacion')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
