import { useEffect, useState } from 'react';
import { Search, Pencil, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { useI18n } from '../../context/I18nContext';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface TallerUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  telefono?: string;
  activo: boolean;
  created_at?: string;
}

interface TallerSub {
  id: number;
  plan_nombre: string;
  periodo: string;
  estado: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  trial_hasta?: string;
  proximo_cobro?: string;
  auto_renovar?: boolean;
  cancelado_at?: string;
}

interface TallerData {
  id: number;
  nombre: string;
  rut?: string;
  telefono?: string;
  created_at: string;
  usuarios: TallerUser[];
  suscripcion: TallerSub | null;
}

const roleColors: Record<string, 'info' | 'success' | 'warning' | 'default' | 'danger'> = {
  admin_taller: 'info',
  recepcionista: 'success',
  mecanico: 'warning',
  bodeguero: 'default',
  cajero: 'default',
  viewer: 'default',
};

const planOrder = ['enterprise', 'pro', 'starter', 'free'];
const planColors: Record<string, string> = {
  enterprise: 'bg-purple-600',
  pro: 'bg-blue-600',
  starter: 'bg-green-600',
  free: 'bg-gray-500',
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

  const [talleres, setTalleres] = useState<TallerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedTaller, setExpandedTaller] = useState<number | null>(null);
  const [editingTallerId, setEditingTallerId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ periodo: '', fecha_fin: '', estado: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<TallerData[]>('/suscripciones/admin/talleres');
      setTalleres(res.data);
    } catch {
      toast.error(t('gestionUsuarios.errorCargar'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredTalleres = talleres.filter((taller) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (taller.nombre.toLowerCase().includes(q)) return true;
    if (taller.rut?.toLowerCase().includes(q)) return true;
    if (taller.suscripcion?.plan_nombre.toLowerCase().includes(q)) return true;
    return taller.usuarios.some(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.telefono?.toLowerCase().includes(q),
    );
  });

  // Group by plan
  const grouped = planOrder.map((plan) => ({
    plan,
    talleres: filteredTalleres.filter(
      (t) => (t.suscripcion?.plan_nombre ?? 'free').toLowerCase() === plan,
    ),
  })).filter((g) => g.talleres.length > 0);

  const toggleTaller = (id: number) => {
    setExpandedTaller((prev) => (prev === id ? null : id));
    setEditingTallerId(null);
  };

  const startEdit = (taller: TallerData) => {
    const sub = taller.suscripcion;
    setEditingTallerId(taller.id);
    setEditForm({
      periodo: sub?.periodo ?? 'mensual',
      fecha_fin: sub?.fecha_fin ? new Date(sub.fecha_fin).toISOString().split('T')[0] : '',
      estado: sub?.estado ?? 'activa',
    });
  };

  const cancelEdit = () => setEditingTallerId(null);

  const saveEdit = async (tallerId: number) => {
    setSaving(true);
    try {
      await api.put(`/suscripciones/admin/suscripcion/${tallerId}`, {
        periodo: editForm.periodo,
        fecha_fin: editForm.fecha_fin || undefined,
        estado: editForm.estado,
      });
      toast.success(t('gestionUsuarios.subGuardada'));
      setEditingTallerId(null);
      await load();
    } catch {
      toast.error(t('gestionUsuarios.errorGuardar'));
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString() : '—';

  const estadoBadge = (estado: string) => {
    const v =
      estado === 'activa' || estado === 'trial'
        ? 'success'
        : estado === 'cancelada' || estado === 'suspendida'
          ? 'danger'
          : 'warning';
    return <Badge label={estado} variant={v} />;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  const totalUsers = talleres.reduce((s, t) => s + t.usuarios.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
          {t('gestionUsuarios.title')}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>{talleres.length} {t('gestionUsuarios.talleres')}</span>
          <span>{totalUsers} {t('gestionUsuarios.totalUsuarios').toLowerCase()}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
          placeholder={t('gestionUsuarios.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Groups by plan */}
      {grouped.map(({ plan, talleres: planTalleres }) => (
        <div key={plan}>
          {/* Plan header */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-bold text-white uppercase ${planColors[plan] ?? 'bg-gray-500'}`}
            >
              {plan}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {planTalleres.length} {planTalleres.length === 1 ? 'taller' : 'talleres'}
            </span>
          </div>

          <div className="space-y-2">
            {planTalleres.map((taller) => {
              const isExpanded = expandedTaller === taller.id;
              const isEditing = editingTallerId === taller.id;
              const sub = taller.suscripcion;

              return (
                <Card key={taller.id}>
                  {/* Taller header row */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleTaller(taller.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={18} className="text-gray-400" />
                      )}
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {taller.nombre}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">ID: {taller.id}</span>
                        {taller.rut && (
                          <span className="ml-2 text-xs text-gray-400">RUT: {taller.rut}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        {taller.usuarios.length} usr
                      </span>
                      {sub && estadoBadge(sub.estado)}
                      <span className="text-gray-500 dark:text-gray-400 capitalize">
                        {sub?.periodo ?? '—'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                      {/* Subscription detail */}
                      {sub && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {t('gestionUsuarios.suscripcion')}
                            </h3>
                            {!isEditing ? (
                              <Button
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(taller);
                                }}
                              >
                                <Pencil size={13} className="mr-1" />
                                {t('gestionUsuarios.editar')}
                              </Button>
                            ) : (
                              <div className="flex gap-2">
                                <Button variant="secondary" onClick={cancelEdit}>
                                  <X size={13} className="mr-1" />
                                  {t('gestionUsuarios.cancelar')}
                                </Button>
                                <Button onClick={() => saveEdit(taller.id)} loading={saving}>
                                  <Save size={13} className="mr-1" />
                                  {t('gestionUsuarios.guardar')}
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('gestionUsuarios.plan')}
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-white uppercase">
                                {sub.plan_nombre}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('gestionUsuarios.periodo')}
                              </p>
                              {isEditing ? (
                                <select
                                  value={editForm.periodo}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, periodo: e.target.value })
                                  }
                                  className="mt-0.5 w-full rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs dark:bg-gray-700 dark:text-white"
                                >
                                  <option value="mensual">{t('gestionUsuarios.mensual')}</option>
                                  <option value="anual">{t('gestionUsuarios.anual')}</option>
                                </select>
                              ) : (
                                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                                  {sub.periodo}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('gestionUsuarios.estado')}
                              </p>
                              {isEditing ? (
                                <select
                                  value={editForm.estado}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, estado: e.target.value })
                                  }
                                  className="mt-0.5 w-full rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs dark:bg-gray-700 dark:text-white"
                                >
                                  <option value="activa">Activa</option>
                                  <option value="trial">Trial</option>
                                  <option value="vencida">Vencida</option>
                                  <option value="cancelada">Cancelada</option>
                                  <option value="suspendida">Suspendida</option>
                                </select>
                              ) : (
                                estadoBadge(sub.estado)
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('gestionUsuarios.vencimiento')}
                              </p>
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={editForm.fecha_fin}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, fecha_fin: e.target.value })
                                  }
                                  className="mt-0.5 w-full rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs dark:bg-gray-700 dark:text-white"
                                />
                              ) : (
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {fmtDate(sub.fecha_fin)}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('gestionUsuarios.proximoCobro')}
                              </p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {fmtDate(sub.proximo_cobro)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Users table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                              <th className="pb-2 font-medium">{t('gestionUsuarios.thNombre')}</th>
                              <th className="pb-2 font-medium">{t('gestionUsuarios.thEmail')}</th>
                              <th className="pb-2 font-medium">{t('gestionUsuarios.thRol')}</th>
                              <th className="pb-2 font-medium">{t('gestionUsuarios.thTelefono')}</th>
                              <th className="pb-2 font-medium">{t('gestionUsuarios.thEstado')}</th>
                              <th className="pb-2 font-medium">{t('gestionUsuarios.thCreado')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {taller.usuarios.map((u) => (
                              <tr
                                key={u.id}
                                className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <td className="py-2 font-medium text-gray-900 dark:text-white">
                                  {u.nombre}
                                </td>
                                <td className="py-2 text-gray-600 dark:text-gray-400">{u.email}</td>
                                <td className="py-2">
                                  <Badge
                                    label={roleLabels[u.rol] ?? u.rol}
                                    variant={roleColors[u.rol] ?? 'default'}
                                  />
                                </td>
                                <td className="py-2 text-gray-600 dark:text-gray-400">
                                  {u.telefono ?? '—'}
                                </td>
                                <td className="py-2">
                                  <Badge
                                    label={
                                      u.activo
                                        ? t('gestionUsuarios.activo')
                                        : t('gestionUsuarios.inactivo')
                                    }
                                    variant={u.activo ? 'success' : 'danger'}
                                  />
                                </td>
                                <td className="py-2 text-gray-600 dark:text-gray-400">
                                  {fmtDate(u.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {filteredTalleres.length === 0 && (
        <Card>
          <p className="py-8 text-center text-gray-400">{t('gestionUsuarios.empty')}</p>
        </Card>
      )}
    </div>
  );
}
