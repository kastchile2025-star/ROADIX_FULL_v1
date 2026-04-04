import { useEffect, useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { usuariosService } from '../../services/usuarios.service';
import { billingService } from '../../services/billing.service';
import { useI18n } from '../../context/I18nContext';
import toast from 'react-hot-toast';
import type { User, Suscripcion } from '../../types';
import api from '../../services/api';

const roleColors: Record<string, 'info' | 'success' | 'warning' | 'default' | 'danger'> = {
  admin_taller: 'info',
  recepcionista: 'success',
  mecanico: 'warning',
  bodeguero: 'default',
  cajero: 'default',
  viewer: 'default',
};

export default function GestionUsuariosPage() {
  const { t } = useI18n();

  const roleLabels: Record<string, string> = {
    admin_taller: t('usuarios.rolAdmin'),
    recepcionista: t('usuarios.rolRecepcionista'),
    mecanico: t('usuarios.rolMecanico'),
    bodeguero: t('usuarios.rolBodeguero'),
    cajero: t('usuarios.rolCajero'),
    viewer: t('usuarios.rolViewer'),
  };

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSub, setEditingSub] = useState(false);
  const [editPeriodo, setEditPeriodo] = useState('');
  const [editFechaFin, setEditFechaFin] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [users, sub] = await Promise.all([
        usuariosService.list(),
        billingService.getMiSuscripcion(),
      ]);
      setUsuarios(users);
      setSuscripcion(sub);
    } catch {
      toast.error(t('gestionUsuarios.errorCargar'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEditSub = () => {
    if (!suscripcion) return;
    setEditPeriodo(suscripcion.periodo ?? 'mensual');
    setEditFechaFin(suscripcion.fecha_fin ? new Date(suscripcion.fecha_fin).toISOString().split('T')[0] : '');
    setEditingSub(true);
  };

  const cancelEditSub = () => {
    setEditingSub(false);
  };

  const saveEditSub = async () => {
    setSaving(true);
    try {
      await api.put('/suscripciones/editar', {
        periodo: editPeriodo,
        fecha_fin: editFechaFin || undefined,
      });
      toast.success(t('gestionUsuarios.subGuardada'));
      setEditingSub(false);
      await load();
    } catch {
      toast.error(t('gestionUsuarios.errorGuardar'));
    } finally {
      setSaving(false);
    }
  };

  // Group users by role
  const roles = Object.keys(roleLabels);
  const grouped = roles
    .map((rol) => ({
      rol,
      label: roleLabels[rol],
      users: usuarios.filter((u) => u.rol === rol),
    }))
    .filter((g) => g.users.length > 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  const planName = suscripcion?.plan?.nombre?.toUpperCase() ?? '—';
  const periodo = suscripcion?.periodo ?? '—';
  const estado = suscripcion?.estado ?? '—';
  const fechaFin = suscripcion?.fecha_fin
    ? new Date(suscripcion.fecha_fin).toLocaleDateString()
    : '—';
  const proximoCobro = suscripcion?.proximo_cobro
    ? new Date(suscripcion.proximo_cobro).toLocaleDateString()
    : '—';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
        {t('gestionUsuarios.title')}
      </h1>

      {/* Subscription info card */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('gestionUsuarios.suscripcion')}
          </h2>
          {!editingSub ? (
            <Button variant="secondary" onClick={startEditSub}>
              <Pencil size={14} className="mr-1" /> {t('gestionUsuarios.editar')}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={cancelEditSub}>
                <X size={14} className="mr-1" /> {t('gestionUsuarios.cancelar')}
              </Button>
              <Button onClick={saveEditSub} loading={saving}>
                <Save size={14} className="mr-1" /> {t('gestionUsuarios.guardar')}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('gestionUsuarios.plan')}</p>
            <p className="font-semibold text-gray-900 dark:text-white">{planName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('gestionUsuarios.periodo')}</p>
            {editingSub ? (
              <select
                value={editPeriodo}
                onChange={(e) => setEditPeriodo(e.target.value)}
                className="mt-0.5 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="mensual">{t('gestionUsuarios.mensual')}</option>
                <option value="anual">{t('gestionUsuarios.anual')}</option>
              </select>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white capitalize">{periodo}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('gestionUsuarios.estado')}</p>
            <Badge
              label={estado}
              variant={estado === 'activa' || estado === 'trial' ? 'success' : estado === 'cancelada' ? 'danger' : 'warning'}
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('gestionUsuarios.vencimiento')}</p>
            {editingSub ? (
              <input
                type="date"
                value={editFechaFin}
                onChange={(e) => setEditFechaFin(e.target.value)}
                className="mt-0.5 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">{fechaFin}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('gestionUsuarios.proximoCobro')}</p>
            <p className="font-semibold text-gray-900 dark:text-white">{proximoCobro}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('gestionUsuarios.totalUsuarios')}</p>
            <p className="font-semibold text-gray-900 dark:text-white">{usuarios.length}</p>
          </div>
        </div>
      </Card>

      {/* Users grouped by role */}
      {grouped.map(({ rol, label, users }) => (
        <Card key={rol}>
          <div className="flex items-center gap-2 mb-4">
            <Badge label={label} variant={roleColors[rol] ?? 'default'} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({users.length})
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <th className="pb-3 font-medium">{t('gestionUsuarios.thNombre')}</th>
                  <th className="pb-3 font-medium">{t('gestionUsuarios.thEmail')}</th>
                  <th className="pb-3 font-medium">{t('gestionUsuarios.thTelefono')}</th>
                  <th className="pb-3 font-medium">{t('gestionUsuarios.thEstado')}</th>
                  <th className="pb-3 font-medium">{t('gestionUsuarios.thCreado')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{u.nombre}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{u.telefono ?? '—'}</td>
                    <td className="py-3">
                      <Badge
                        label={u.activo ? t('gestionUsuarios.activo') : t('gestionUsuarios.inactivo')}
                        variant={u.activo ? 'success' : 'danger'}
                      />
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {usuarios.length === 0 && (
        <Card>
          <p className="py-8 text-center text-gray-400">{t('gestionUsuarios.empty')}</p>
        </Card>
      )}
    </div>
  );
}
