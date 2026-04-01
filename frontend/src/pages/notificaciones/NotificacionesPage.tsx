import { useEffect, useState } from 'react';
import { Mail, Bell, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { Card, Badge } from '../../components/ui';
import { notificacionesService } from '../../services/notificaciones.service';
import { useI18n } from '../../context/I18nContext';
import type { HistorialEmail, RecordatorioType } from '../../types';

const estadoEmailConfig: Record<string, { variant: 'success' | 'danger' | 'warning' | 'info' | 'default'; icon: typeof CheckCircle }> = {
  enviado: { variant: 'info', icon: Clock },
  entregado: { variant: 'success', icon: CheckCircle },
  abierto: { variant: 'success', icon: Eye },
  fallido: { variant: 'danger', icon: XCircle },
};

export default function NotificacionesPage() {
  const { t } = useI18n();

  const tipoRecLabels: Record<string, string> = {
    rev_tecnica: t('notificaciones.tipoRevTecnica'),
    permiso_circ: t('notificaciones.tipoPermisoCirc'),
    soap: t('notificaciones.tipoSoap'),
    mantencion: t('notificaciones.tipoMantencion'),
    seguimiento: t('notificaciones.tipoSeguimiento'),
  };
  const [tab, setTab] = useState<'emails' | 'recordatorios'>('emails');
  const [emails, setEmails] = useState<HistorialEmail[]>([]);
  const [recordatorios, setRecordatorios] = useState<RecordatorioType[]>([]);

  useEffect(() => {
    notificacionesService.getHistorialEmail().then(setEmails).catch(() => {});
    notificacionesService.getRecordatorios().then(setRecordatorios).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('notificaciones.title')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('emails')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'emails' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Mail className="h-4 w-4" /> {t('notificaciones.tabEmails')}
        </button>
        <button
          onClick={() => setTab('recordatorios')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'recordatorios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Bell className="h-4 w-4" /> {t('notificaciones.tabRecordatorios')}
        </button>
      </div>

      {tab === 'emails' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="pb-3 font-medium">{t('notificaciones.emailThFecha')}</th>
                  <th className="pb-3 font-medium">{t('notificaciones.emailThDestinatario')}</th>
                  <th className="pb-3 font-medium">{t('notificaciones.emailThAsunto')}</th>
                  <th className="pb-3 font-medium">{t('notificaciones.emailThTipo')}</th>
                  <th className="pb-3 font-medium">{t('notificaciones.emailThEstado')}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {emails.map((e) => {
                  const config = estadoEmailConfig[e.estado] ?? { variant: 'default' as const, icon: Clock };
                  const Icon = config.icon;
                  return (
                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {e.created_at ? new Date(e.created_at).toLocaleString('es-CL') : '—'}
                      </td>
                      <td className="py-3 text-gray-900 dark:text-gray-200">{e.destinatario}</td>
                      <td className="py-3 font-medium text-gray-900 dark:text-white">{e.asunto}</td>
                      <td className="py-3"><Badge label={t(`enum.emailTipo.${e.tipo}`)} /></td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1">
                          <Icon className="h-3 w-3 text-gray-600 dark:text-white" />
                          <Badge label={t(`enum.emailEstado.${e.estado}`)} variant={config.variant} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {emails.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">{t('notificaciones.emailEmpty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'recordatorios' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="pb-3 font-medium">{t('notificaciones.recThFecha')}</th>
                  <th className="pb-3 font-medium">{t('notificaciones.recThTipo')}</th>
                  <th className="pb-3 font-medium">{t('notificaciones.recThCliente')}</th>
                  <th className="pb-3 font-medium">{t('notificaciones.recThVehiculo')}</th>
                  <th className="pb-3 font-medium">{t('notificaciones.recThCanal')}</th>
                  <th className="pb-3 font-medium">{t('notificaciones.recThEstado')}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {recordatorios.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {r.created_at ? new Date(r.created_at).toLocaleString('es-CL') : '—'}
                    </td>
                    <td className="py-3">
                      <Badge label={tipoRecLabels[r.tipo] ?? r.tipo} variant="info" />
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">{r.cliente?.nombre ?? '—'}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {r.vehiculo ? `${r.vehiculo.patente} — ${r.vehiculo.marca ?? ''} ${r.vehiculo.modelo ?? ''}` : '—'}
                    </td>
                    <td className="py-3"><Badge label={t(`enum.canal.${r.canal}`)} /></td>
                    <td className="py-3">
                      <Badge
                        label={t(`enum.recEstado.${r.estado}`)}
                        variant={r.estado === 'enviado' ? 'success' : r.estado === 'fallido' ? 'danger' : 'warning'}
                      />
                    </td>
                  </tr>
                ))}
                {recordatorios.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">{t('notificaciones.recEmpty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
