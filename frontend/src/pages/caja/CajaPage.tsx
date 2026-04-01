import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, CreditCard, Banknote, ArrowRightLeft } from 'lucide-react';
import { Button, Input, Modal, Card, Badge } from '../../components/ui';
import { cajaService } from '../../services/caja.service';
import { useI18n } from '../../context/I18nContext';
import type { Pago, CierreDiario } from '../../types';

type PagoForm = {
  ot_id: number;
  monto: number;
  metodo_pago: string;
  referencia?: string;
};

const metodoIcons: Record<string, typeof DollarSign> = {
  efectivo: Banknote,
  tarjeta_debito: CreditCard,
  tarjeta_credito: CreditCard,
  transferencia: ArrowRightLeft,
};

export default function CajaPage() {
  const { t } = useI18n();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cierre, setCierre] = useState<CierreDiario | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const pagoSchema = z.object({
    ot_id: z.number().min(1, t('caja.valOt')),
    monto: z.number().min(1, t('caja.valMonto')),
    metodo_pago: z.string().min(1, t('caja.valMetodo')),
    referencia: z.string().optional(),
  });

  const metodoLabels: Record<string, string> = {
    efectivo: t('caja.metodoEfectivo'),
    tarjeta_debito: t('caja.metodoDebito'),
    tarjeta_credito: t('caja.metodoCredito'),
    transferencia: t('caja.metodoTransferencia'),
    cheque: t('caja.metodoCheque'),
    credito: t('caja.metodoCredCliente'),
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PagoForm>({
    resolver: zodResolver(pagoSchema),
  });

  const load = async () => {
    const [movs, cierreData] = await Promise.all([
      cajaService.getMovimientos(fecha),
      cajaService.getCierreDiario(fecha),
    ]);
    setPagos(movs);
    setCierre(cierreData);
  };

  useEffect(() => { load(); }, [fecha]);

  const openCobrar = () => {
    reset({ ot_id: undefined as unknown as number, monto: 0, metodo_pago: 'efectivo', referencia: '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: PagoForm) => {
    setLoading(true);
    try {
      await cajaService.cobrar(data);
      setModalOpen(false);
      load();
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('caja.title')}</h1>
        <div className="flex items-center gap-3">
          <input
            type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={openCobrar}><DollarSign className="h-4 w-4 mr-1" /> {t('caja.cobrar')}</Button>
        </div>
      </div>

      {/* Cierre Resumen */}
      {cierre && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('caja.totalDia')}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${cierre.total_dia.toLocaleString()}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{cierre.cantidad_pagos} {t('caja.pagosCount')}</div>
          </Card>
          {Object.entries(cierre.por_metodo).map(([metodo, total]) => {
            const Icon = metodoIcons[metodo] ?? DollarSign;
            return (
              <Card key={metodo}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">{metodoLabels[metodo] ?? metodo}</span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">${total.toLocaleString()}</div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagos del día */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('caja.pagosDia')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                <th className="pb-3 font-medium">{t('caja.thHora')}</th>
                <th className="pb-3 font-medium">{t('caja.thOt')}</th>
                <th className="pb-3 font-medium text-right">{t('caja.thMonto')}</th>
                <th className="pb-3 font-medium">{t('caja.thMetodo')}</th>
                <th className="pb-3 font-medium">{t('caja.thReferencia')}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {pagos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {new Date(p.fecha_pago).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 font-medium text-gray-900 dark:text-white">
                    {p.orden_trabajo ? `OT-${String(p.ot_id).padStart(6, '0')}` : `#${p.ot_id}`}
                  </td>
                  <td className="py-3 text-right font-semibold dark:text-white">${p.monto.toLocaleString()}</td>
                  <td className="py-3">
                    <Badge label={metodoLabels[p.metodo_pago] ?? p.metodo_pago} />
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{p.referencia || '—'}</td>
                </tr>
              ))}
              {pagos.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">{t('caja.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Cobrar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('caja.modalTitle')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('caja.labelOt')} type="number" {...register('ot_id', { valueAsNumber: true })} error={errors.ot_id?.message} />
          <Input label={t('caja.labelMonto')} type="number" {...register('monto', { valueAsNumber: true })} error={errors.monto?.message} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('caja.labelMetodo')}</label>
            <select {...register('metodo_pago')} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="efectivo">{t('caja.metodoEfectivo')}</option>
              <option value="tarjeta_debito">{t('caja.metodoDebito')}</option>
              <option value="tarjeta_credito">{t('caja.metodoCredito')}</option>
              <option value="transferencia">{t('caja.metodoTransferencia')}</option>
              <option value="cheque">{t('caja.metodoCheque')}</option>
              <option value="credito">{t('caja.metodoCredCliente')}</option>
            </select>
          </div>
          <Input label={t('caja.labelReferencia')} {...register('referencia')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>{t('caja.cancelar')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('caja.procesando') : t('caja.cobrarBtn')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
