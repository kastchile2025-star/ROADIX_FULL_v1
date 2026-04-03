import { useEffect, useState } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';
import { useConfirm } from '../../components/ui';
import { billingService } from '../../services/billing.service';
import toast from 'react-hot-toast';
import type { Plan, Suscripcion, PagoSuscripcion, BillingUsage, BillingPlanChangeResult } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { useAuthStore } from '../../store/auth.store';
import {
  CheckCircle,
  XCircle,
  Users,
  Car,
  ClipboardList,
  HardDrive,
  Zap,
  Crown,
  Rocket,
  Building,
} from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('es-CL') : '—';

const planIcons: Record<string, React.ReactNode> = {
  free: <Zap className="h-6 w-6 text-gray-500" />,
  starter: <Rocket className="h-6 w-6 text-blue-500" />,
  pro: <Crown className="h-6 w-6 text-purple-500" />,
  enterprise: <Building className="h-6 w-6 text-amber-500" />,
};

const estadoBadge: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  activa: 'success',
  trial: 'warning',
  vencida: 'danger',
  cancelada: 'danger',
  suspendida: 'danger',
};

const pagoBadge: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  exitoso: 'success',
  pendiente: 'warning',
  fallido: 'danger',
  reembolsado: 'default',
};

const paymentMethodLabel = (t: (key: string) => string, metodoPago?: string) => {
  if (!metodoPago) return '—';

  const key = `enum.metodoPago.${metodoPago}`;
  const translated = t(key);
  return translated === key ? metodoPago : translated;
};

function UsageBar({ label, icon: Icon, usado, limite }: { label: string; icon: React.ElementType; usado: number; limite: number }) {
  const pct = limite === 0 ? 0 : Math.min(100, Math.round((usado / limite) * 100));
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500';
  const limitLabel = limite >= 999999 ? '∞' : limite.toLocaleString('es-CL');
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <Icon size={14} /> {label}
        </span>
        <span className="font-medium text-gray-900 dark:text-white">
          {usado.toLocaleString('es-CL')} / {limitLabel}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function BillingPage() {
  const { t } = useI18n();
  const confirm = useConfirm();
  const user = useAuthStore((state) => state.user);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [pagos, setPagos] = useState<PagoSuscripcion[]>([]);
  const [periodo, setPeriodo] = useState<'mensual' | 'anual'>('mensual');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [billingEmail, setBillingEmail] = useState(user?.email ?? '');

  const isValidBillingEmail = (email?: string) => !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const usesDemoDomain = /@roadix\.cl$/i.test(user?.email ?? '');

  useEffect(() => {
    if (user?.email) {
      setBillingEmail((current) => current || user.email);
    }
  }, [user?.email]);

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as {
        response?: {
          data?: {
            message?: string;
            response?: { message?: string };
          };
        };
      }).response;

      return response?.data?.message ?? response?.data?.response?.message ?? fallback;
    }

    return fallback;
  };

  const isNotFoundError = (error: unknown) =>
    typeof error === 'object'
    && error !== null
    && 'response' in error
    && (error as { response?: { status?: number } }).response?.status === 404;

  const load = async () => {
    try {
      const [planesResult, suscripcionResult, usageResult, pagosResult] = await Promise.allSettled([
        billingService.getPlanes(),
        billingService.getMiSuscripcion(),
        billingService.getUsage(),
        billingService.getHistorialPagos(),
      ]);

      let shouldShowError = false;

      if (planesResult.status === 'fulfilled') {
        setPlanes(planesResult.value);
      } else {
        shouldShowError = true;
      }

      if (
        suscripcionResult.status === 'fulfilled'
        && suscripcionResult.value
        && typeof suscripcionResult.value === 'object'
      ) {
        const nextSuscripcion = suscripcionResult.value as Suscripcion;
        setSuscripcion(nextSuscripcion);
        if (nextSuscripcion.periodo) {
          setPeriodo(nextSuscripcion.periodo);
        }
      } else {
        setSuscripcion(null);
        if (suscripcionResult.status === 'rejected' && !isNotFoundError(suscripcionResult.reason)) {
          shouldShowError = true;
        }
      }

      if (usageResult.status === 'fulfilled') {
        setUsage(usageResult.value);
      } else {
        setUsage(null);
        if (!isNotFoundError(usageResult.reason)) {
          shouldShowError = true;
        }
      }

      if (pagosResult.status === 'fulfilled') {
        setPagos(pagosResult.value);
      } else {
        setPagos([]);
        if (!isNotFoundError(pagosResult.reason)) {
          shouldShowError = true;
        }
      }

      if (shouldShowError) {
        toast.error(t('billing.toastErrorCargar'));
      }
    } catch {
      toast.error(t('billing.toastErrorCargar'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCambiarPlan = async (planId: number) => {
    if (!suscripcion) return;
    if (suscripcion.plan_id === planId && suscripcion.periodo === periodo) return;

    const plan = planes.find((p) => p.id === planId);
    if (!plan) return;

    const monto = periodo === 'anual' ? plan.precio_anual : plan.precio_mensual;
    const trimmedBillingEmail = billingEmail.trim();

    if (monto > 0 && !isValidBillingEmail(trimmedBillingEmail)) {
      toast.error(t('billing.paymentEmailInvalid'));
      return;
    }

    if (monto > 0 && !(await confirm({
      title: t('billing.confirmCambioTitle') ?? 'Cambio de plan',
      message: `¿Confirmas el cambio al plan ${plan.nombre.toUpperCase()} (${periodo})?\nMonto: ${fmt(monto)}`,
    }))) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await billingService.cambiarPlan(
        planId,
        periodo,
        monto > 0 ? trimmedBillingEmail : undefined,
      );

      if ((result as BillingPlanChangeResult).requiresPayment) {
        const checkoutUrl = (result as BillingPlanChangeResult).checkoutUrl;
        if (!checkoutUrl) {
          throw new Error('Flow no devolvio URL de pago');
        }

        window.location.assign(checkoutUrl);
        return;
      }

      toast.success(`${t('billing.toastPlanCambiado')} ${plan.nombre.toUpperCase()}`);
      await load();
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, t('billing.toastErrorCambiar')));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!(await confirm({ title: t('billing.cancelarTitle') ?? 'Cancelar suscripción', message: t('billing.confirmCancelar'), variant: 'danger' }))) return;
    setActionLoading(true);
    try {
      await billingService.cancelar();
      toast.success(t('billing.toastCancelada'));
      await load();
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, t('billing.toastErrorCancelar')));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivar = async () => {
    setActionLoading(true);
    try {
      await billingService.reactivar();
      toast.success(t('billing.toastReactivada'));
      await load();
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, t('billing.toastErrorReactivar')));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const currentPlan = suscripcion?.plan;
  const isCancelled = suscripcion?.estado === 'cancelada' || suscripcion?.cancelado_at;
  const isExpired = suscripcion?.estado === 'vencida' || suscripcion?.estado === 'suspendida';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('billing.title')}</h1>

      <Card title={t('billing.paymentEmailTitle')}>
        <div className="space-y-3">
          <Input
            type="email"
            label={t('billing.paymentEmailLabel')}
            value={billingEmail}
            onChange={(event) => setBillingEmail(event.target.value)}
            placeholder="nombre@dominio.com"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {usesDemoDomain ? t('billing.paymentEmailHintDemo') : t('billing.paymentEmailHint')}
          </p>
        </div>
      </Card>

      {/* ── Current subscription summary ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={t('billing.suscripcionActual')}>
          {suscripcion ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {planIcons[currentPlan?.nombre ?? 'free']}
                <div>
                  <p className="text-lg font-bold uppercase text-gray-900 dark:text-white">{currentPlan?.nombre}</p>
                  <Badge label={t(`enum.suscripcionEstado.${suscripcion.estado}`)} variant={estadoBadge[suscripcion.estado] ?? 'default'} />
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>{t('billing.periodo')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{t(`enum.periodo.${suscripcion.periodo}`)}</span>
                </div>
                {suscripcion.trial_hasta && (
                  <div className="flex justify-between">
                    <span>{t('billing.trialHasta')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{fmtDate(suscripcion.trial_hasta)}</span>
                  </div>
                )}
                {suscripcion.proximo_cobro && (
                  <div className="flex justify-between">
                    <span>{t('billing.proximoCobro')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{fmtDate(suscripcion.proximo_cobro)}</span>
                  </div>
                )}
                {suscripcion.monto_pagado != null && Number(suscripcion.monto_pagado) > 0 && (
                  <div className="flex justify-between">
                    <span>{t('billing.ultimoPago')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{fmt(Number(suscripcion.monto_pagado))}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t('billing.autoRenovacion')}</span>
                  <span className={`font-medium ${suscripcion.auto_renovar ? 'text-green-600' : 'text-red-600'}`}>
                    {suscripcion.auto_renovar ? t('billing.autoActiva') : t('billing.autoDesactivada')}
                  </span>
                </div>
              </div>

              <div className="border-t pt-3">
                {isCancelled ? (
                  <Button onClick={handleReactivar} loading={actionLoading} className="w-full">
                    {t('billing.reactivar')}
                  </Button>
                ) : isExpired ? (
                  <p className="text-center text-sm text-red-600">{t('billing.seleccionaPlanAbajo')}</p>
                ) : (
                  <Button variant="secondary" onClick={handleCancelar} loading={actionLoading} className="w-full">
                    {t('billing.cancelarSuscripcion')}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">{t('billing.sinSuscripcion')}</p>
          )}
        </Card>

        {/* ── Usage ── */}
        <Card title={t('billing.usoPlan')} className="lg:col-span-2">
          {usage ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <UsageBar label={t('billing.usageUsuarios')} icon={Users} {...usage.usuarios} />
              <UsageBar label={t('billing.usageVehiculos')} icon={Car} {...usage.vehiculos} />
              <UsageBar label={t('billing.usageOtsMes')} icon={ClipboardList} {...usage.ots_mes} />
              <UsageBar label={t('billing.usageAlmacenamiento')} icon={HardDrive} {...usage.storage_mb} />
            </div>
          ) : (
            <p className="text-sm text-gray-400">{t('billing.cargandoUso')}</p>
          )}
        </Card>
      </div>

      {/* ── Period toggle ── */}
      <div className="flex items-center justify-center gap-2">
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            periodo === 'mensual' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          onClick={() => setPeriodo('mensual')}
        >
          {t('billing.mensual')}
        </button>
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            periodo === 'anual' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          onClick={() => setPeriodo('anual')}
        >
          {t('billing.anual')} <span className="ml-1 text-xs opacity-80">{t('billing.descAnual')}</span>
        </button>
      </div>

      {/* ── Plan cards ── */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {planes.filter((p) => p.nombre !== 'admin').map((plan) => {
          const isCurrent = suscripcion?.plan_id === plan.id && suscripcion?.periodo === periodo;
          const monto = periodo === 'anual' ? plan.precio_anual : plan.precio_mensual;
          const mensualEquiv = periodo === 'anual' ? Math.round(plan.precio_anual / 12) : plan.precio_mensual;

          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 p-6 transition-all duration-300 ease-out ${
                isCurrent ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xl hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    {t('billing.planActualBtn')}
                  </span>
                </div>
              )}

              <div className="mb-4 flex items-center gap-2">
                {planIcons[plan.nombre]}
                <h3 className="text-lg font-bold uppercase text-gray-900 dark:text-white">{plan.nombre}</h3>
              </div>

              <div className="mb-4">
                {monto === 0 ? (
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{t('billing.gratis')}</p>
                ) : plan.nombre === 'enterprise' ? (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{t('billing.aMedida')}</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{fmt(mensualEquiv)}<span className="text-base font-normal text-gray-500 dark:text-gray-400">{t('billing.porMes')}</span></p>
                    {periodo === 'anual' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{fmt(monto)} {t('billing.facturadoAnual')}</p>
                    )}
                  </>
                )}
              </div>

              <ul className="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Users size={14} />
                  {plan.max_usuarios >= 999999 ? t('billing.usuariosIlimitados') : t('billing.xUsuarios').replace('{count}', String(plan.max_usuarios))}
                </li>
                <li className="flex items-center gap-2">
                  <ClipboardList size={14} />
                  {plan.max_ots_mes >= 999999 ? t('billing.otsIlimitadas') : t('billing.xOtsMes').replace('{count}', String(plan.max_ots_mes))}
                </li>
                <li className="flex items-center gap-2">
                  <Car size={14} />
                  {plan.max_vehiculos >= 999999 ? t('billing.vehiculosIlimitados') : t('billing.xVehiculos').replace('{count}', String(plan.max_vehiculos))}
                </li>
                <li className="flex items-center gap-2">
                  <HardDrive size={14} />
                  {plan.max_storage_mb >= 999999 ? t('billing.storageIlimitado') : t('billing.xGb').replace('{count}', String((plan.max_storage_mb / 1000).toFixed(0)))}
                </li>
                <FeatureCheck label={t('billing.featureFacturacion')} enabled={plan.tiene_facturacion} />
                <FeatureCheck label={t('billing.featurePortal')} enabled={plan.tiene_portal} />
                <FeatureCheck label={t('billing.featureWhatsapp')} enabled={plan.tiene_whatsapp} />
                <FeatureCheck label={t('billing.featureReportes')} enabled={plan.tiene_reportes} />
                <FeatureCheck label={t('billing.featureApi')} enabled={plan.tiene_api} />
              </ul>

              {plan.nombre === 'enterprise' ? (
                <Button variant="secondary" className="w-full" disabled>
                  {t('billing.contactanos')}
                </Button>
              ) : isCurrent ? (
                <Button className="w-full" disabled>
                  {t('billing.planActualBtn')}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleCambiarPlan(plan.id)}
                  loading={actionLoading}
                >
                  {suscripcion && plan.precio_mensual > (currentPlan?.precio_mensual ?? 0) ? t('billing.upgrade') : t('billing.seleccionar')}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Payment history ── */}
      <Card title={t('billing.historialPagos')}>
        {pagos.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-4">{t('billing.pagosEmpty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <th className="pb-2 font-medium">{t('billing.pagoThFecha')}</th>
                  <th className="pb-2 font-medium">{t('billing.pagoThMonto')}</th>
                  <th className="pb-2 font-medium">{t('billing.pagoThMetodo')}</th>
                  <th className="pb-2 font-medium">{t('billing.pagoThEstado')}</th>
                  <th className="pb-2 font-medium">{t('billing.pagoThPeriodo')}</th>
                  <th className="pb-2 font-medium">{t('billing.pagoThReferencia')}</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id} className="border-b dark:border-gray-700 last:border-0">
                    <td className="py-2 dark:text-gray-300">{fmtDate(p.fecha_pago)}</td>
                    <td className="py-2 font-medium dark:text-white">{fmt(Number(p.monto))}</td>
                    <td className="py-2 dark:text-gray-300">{paymentMethodLabel(t, p.metodo_pago)}</td>
                    <td className="py-2">
                      <Badge label={t(`enum.pagoEstado.${p.estado}`)} variant={pagoBadge[p.estado] ?? 'default'} />
                    </td>
                    <td className="py-2 text-gray-500 dark:text-gray-400">
                      {p.periodo_desde && p.periodo_hasta
                        ? `${fmtDate(p.periodo_desde)} – ${fmtDate(p.periodo_hasta)}`
                        : '—'}
                    </td>
                    <td className="py-2 font-mono text-xs text-gray-400 dark:text-gray-500">{p.referencia ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function FeatureCheck({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <li className={`flex items-center gap-2 ${enabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600 line-through'}`}>
      {enabled ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-gray-300 dark:text-gray-600" />}
      {label}
    </li>
  );
}
