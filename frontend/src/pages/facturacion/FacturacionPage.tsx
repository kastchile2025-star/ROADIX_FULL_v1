import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Plus, XCircle, Download, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Modal, Card, Badge } from '../../components/ui';
import { facturacionService } from '../../services/facturacion.service';
import { useI18n } from '../../context/I18nContext';
import type { Factura } from '../../types';

const emitirSchema = z.object({
  ot_id: z.number().min(1, 'OT requerida'),
  tipo_dte: z.enum(['boleta', 'factura']),
  razon_social: z.string().min(2, 'Razón social requerida'),
  rut: z.string().min(1, 'RUT requerido'),
  direccion: z.string().optional(),
  giro: z.string().optional(),
});

type EmitirForm = z.infer<typeof emitirSchema>;

export default function FacturacionPage() {
  const { t } = useI18n();

  const tipoDteLabels: Record<string, string> = {
    boleta: t('facturacion.tipoBoleta'),
    factura: t('facturacion.tipoFactura'),
    nota_credito: t('facturacion.tipoNotaCredito'),
  };
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmitirForm>({
    resolver: zodResolver(emitirSchema),
  });

  const load = async () => {
    const data = await facturacionService.getAll();
    setFacturas(data);
  };

  useEffect(() => { load(); }, []);

  const openEmitir = () => {
    reset({ ot_id: undefined as unknown as number, tipo_dte: 'boleta', razon_social: '', rut: '', direccion: '', giro: '' });
    setModalOpen(true);
  };

  const openDetalle = async (f: Factura) => {
    try {
      const full = await facturacionService.getOne(f.id);
      setSelectedFactura(full);
    } catch {
      setSelectedFactura(f);
    }
    setDetalleOpen(true);
  };

  const onSubmit = async (data: EmitirForm) => {
    setLoading(true);
    try {
      await facturacionService.emitir(data);
      setModalOpen(false);
      toast.success(t('facturacion.toastEmitido'));
      load();
    } catch {
      toast.error(t('facturacion.toastErrorEmitir'));
    } finally { setLoading(false); }
  };

  const handleAnular = async (id: number) => {
    if (!confirm(t('facturacion.confirmAnular'))) return;
    try {
      await facturacionService.anular(id);
      toast.success(t('facturacion.toastAnulado'));
      load();
    } catch {
      toast.error(t('facturacion.toastErrorAnular'));
    }
  };

  const handleDownloadPdf = async (id: number) => {
    try {
      await facturacionService.downloadPdf(id);
      toast.success(t('facturacion.toastPdfDescargado'));
    } catch {
      toast.error(t('facturacion.toastErrorPdf'));
    }
  };

  const handleEnviarEmail = async (id: number) => {
    try {
      const result = await facturacionService.enviarEmail(id);
      toast.success(result.message);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t('facturacion.toastErrorEmail');
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('facturacion.title')}</h1>
        <Button onClick={openEmitir}><Plus className="h-4 w-4 mr-1" /> {t('facturacion.emitirDte')}</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                <th className="pb-3 font-medium">{t('facturacion.thNumeroDte')}</th>
                <th className="pb-3 font-medium text-center">{t('facturacion.thTipo')}</th>
                <th className="pb-3 font-medium">{t('facturacion.thReceptor')}</th>
                <th className="pb-3 font-medium">{t('facturacion.thRut')}</th>
                <th className="pb-3 font-medium text-right">{t('facturacion.thNeto')}</th>
                <th className="pb-3 font-medium text-right">{t('facturacion.thIva')}</th>
                <th className="pb-3 font-medium text-right">{t('facturacion.thTotal')}</th>
                <th className="pb-3 font-medium text-center pl-6">{t('facturacion.thEstado')}</th>
                <th className="pb-3 font-medium text-center">{t('facturacion.thFecha')}</th>
                <th className="pb-3 font-medium text-center">{t('facturacion.thAcciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {facturas.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 font-mono text-gray-900 dark:text-white">{f.numero_dte ?? '—'}</td>
                  <td className="py-3">
                    <Badge label={tipoDteLabels[f.tipo_dte] ?? f.tipo_dte} variant={f.tipo_dte === 'factura' ? 'info' : 'default'} />
                  </td>
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{f.rut_receptor ? '' : '—'}{f.orden_trabajo ? '' : ''}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{f.rut_receptor || '—'}</td>
                  <td className="py-3 text-right dark:text-gray-200">${f.monto_neto.toLocaleString()}</td>
                  <td className="py-3 text-right dark:text-gray-200">${f.iva.toLocaleString()}</td>
                  <td className="py-3 text-right font-semibold dark:text-white">${f.monto_total.toLocaleString()}</td>
                  <td className="py-3 pl-6">
                    <Badge
                      label={t(`enum.estadoSii.${f.estado_sii ?? 'emitido'}`)}
                      variant={f.estado_sii === 'aceptado' ? 'success' : f.estado_sii === 'rechazado' || f.estado_sii === 'anulado' ? 'danger' : 'warning'}
                    />
                  </td>
                  <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                    {f.created_at ? new Date(f.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleDownloadPdf(f.id)} className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded" title={t('facturacion.tooltipDescargarPdf')}>
                        <Download className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleEnviarEmail(f.id)} className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded" title={t('facturacion.tooltipEnviarEmail')}>
                        <Mail className="h-4 w-4" />
                      </button>
                      <button onClick={() => openDetalle(f)} className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" title={t('facturacion.tooltipVerDetalle')}>
                        <FileText className="h-4 w-4" />
                      </button>
                      {f.estado_sii !== 'anulado' && (
                        <button onClick={() => handleAnular(f.id)} className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title={t('facturacion.tooltipAnular')}>
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {facturas.length === 0 && (
                <tr><td colSpan={10} className="py-8 text-center text-gray-500 dark:text-gray-400">{t('facturacion.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Emitir */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('facturacion.modalEmitir')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('facturacion.labelOt')} type="number" {...register('ot_id', { valueAsNumber: true })} error={errors.ot_id?.message} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('facturacion.labelTipoDte')}</label>
            <select {...register('tipo_dte')} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
              <option value="boleta">{t('facturacion.tipoBoleta')}</option>
              <option value="factura">{t('facturacion.tipoFactura')}</option>
            </select>
          </div>
          <Input label={t('facturacion.labelRazonSocial')} {...register('razon_social')} error={errors.razon_social?.message} />
          <Input label={t('facturacion.labelRut')} {...register('rut')} error={errors.rut?.message} />
          <Input label={t('facturacion.labelDireccion')} {...register('direccion')} />
          <Input label={t('facturacion.labelGiro')} {...register('giro')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>{t('facturacion.cancelar')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('facturacion.emitiendo') : t('facturacion.emitir')}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle */}
      <Modal open={detalleOpen} onClose={() => setDetalleOpen(false)} title={`${t('facturacion.detalleTitle')} ${selectedFactura?.numero_dte ?? ''}`}>
        {selectedFactura && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('facturacion.detalleNumeroDte')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedFactura.numero_dte ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('facturacion.detalleTipo')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{tipoDteLabels[selectedFactura.tipo_dte] ?? selectedFactura.tipo_dte}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('facturacion.detalleRutReceptor')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedFactura.rut_receptor || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('facturacion.detalleEstadoSii')}</p>
                <Badge
                  label={t(`enum.estadoSii.${selectedFactura.estado_sii ?? 'emitido'}`)}
                  variant={selectedFactura.estado_sii === 'anulado' ? 'danger' : 'success'}
                />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('facturacion.detalleOtAsociada')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedFactura.orden_trabajo?.numero_ot ?? `OT #${selectedFactura.ot_id}`}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('facturacion.detalleFecha')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedFactura.created_at ? new Date(selectedFactura.created_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
            <hr className="dark:border-gray-700" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('facturacion.detalleMontoNeto')}</span>
                <span className="text-gray-900 dark:text-white">${selectedFactura.monto_neto.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('facturacion.detalleIva19')}</span>
                <span className="text-gray-900 dark:text-white">${selectedFactura.iva.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t dark:border-gray-700 pt-2 font-semibold">
                <span className="text-gray-700 dark:text-gray-300">Total</span>
                <span className="text-gray-900 dark:text-white">${selectedFactura.monto_total.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => handleDownloadPdf(selectedFactura.id)}>
                <Download className="h-4 w-4 mr-1" /> {t('facturacion.descargarPdf')}
              </Button>
              <Button variant="secondary" onClick={() => handleEnviarEmail(selectedFactura.id)}>
                <Mail className="h-4 w-4 mr-1" /> {t('facturacion.enviarPorEmail')}
              </Button>
              <Button variant="secondary" onClick={() => setDetalleOpen(false)}>{t('facturacion.cerrar')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
