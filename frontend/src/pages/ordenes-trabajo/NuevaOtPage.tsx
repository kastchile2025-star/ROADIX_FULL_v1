import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Button, Input, Card, SignaturePad } from '../../components/ui';
import { ordenesTrabajoService } from '../../services/ordenes-trabajo.service';
import { clientesService } from '../../services/clientes.service';
import { vehiculosService } from '../../services/vehiculos.service';
import { mecanicosService } from '../../services/mecanicos.service';
import { useI18n } from '../../context/I18nContext';
import type { Cliente, Vehiculo, Mecanico } from '../../types';

const schema = z.object({
  cliente_id: z.number().min(1, 'Seleccione un cliente'),
  vehiculo_id: z.number().min(1, 'Seleccione un vehículo'),
  mecanico_id: z.number().optional(),
  tipo_servicio: z.string().optional(),
  km_ingreso: z.number().optional(),
  combustible_ing: z.string().optional(),
  diagnostico: z.string().optional(),
  observaciones: z.string().optional(),
  prioridad: z.string().optional(),
});

type Form = z.infer<typeof schema>;

const zonaKeys = ['frente', 'trasera', 'lat_izq', 'lat_der', 'techo', 'interior'] as const;

const zonaI18nMap: Record<string, string> = {
  frente: 'nuevaOt.zonaFrente',
  trasera: 'nuevaOt.zonaTrasera',
  lat_izq: 'nuevaOt.zonaLatIzq',
  lat_der: 'nuevaOt.zonaLatDer',
  techo: 'nuevaOt.zonaTecho',
  interior: 'nuevaOt.zonaInterior',
};

export default function NuevaOtPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<number>(0);
  const [checklist, setChecklist] = useState(
    zonaKeys.map((k) => ({ zona_vehiculo: k, estado: 'ok', notas: '' })),
  );
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { prioridad: 'media' },
  });

  useEffect(() => {
    clientesService.list().then(setClientes);
    mecanicosService.getActive().then(setMecanicos);
  }, []);

  useEffect(() => {
    if (selectedCliente) {
      vehiculosService.list().then((all) => {
        setVehiculos(all.filter((v: Vehiculo) => v.cliente_id === selectedCliente));
      });
    }
  }, [selectedCliente]);

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      const ot = await ordenesTrabajoService.create({
        ...data,
        mecanico_id: data.mecanico_id || undefined,
        checklist,
        firma_base64: firmaBase64 ?? undefined,
      });
      navigate(`/ordenes-trabajo/${ot.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => navigate('/ordenes-trabajo')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nuevaOt.title')}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('nuevaOt.datosPrincipales')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('nuevaOt.labelCliente')}</label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedCliente(id);
                  setValue('cliente_id', id);
                }}
              >
                <option value="">{t('nuevaOt.selectCliente')}</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.rut ? `(${c.rut})` : ''}</option>
                ))}
              </select>
              {errors.cliente_id && <p className="text-red-500 text-xs mt-1">{errors.cliente_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('nuevaOt.labelVehiculo')}</label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
                {...register('vehiculo_id', { valueAsNumber: true })}
              >
                <option value="">{t('nuevaOt.selectVehiculo')}</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>{v.patente} - {v.marca} {v.modelo}</option>
                ))}
              </select>
              {errors.vehiculo_id && <p className="text-red-500 text-xs mt-1">{errors.vehiculo_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('nuevaOt.labelMecanico')}</label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
                {...register('mecanico_id', { valueAsNumber: true })}
              >
                <option value="">{t('nuevaOt.sinAsignar')}</option>
                {mecanicos.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre} {m.especialidad ? `(${m.especialidad})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('nuevaOt.labelPrioridad')}</label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
                {...register('prioridad')}
              >
                <option value="baja">{t('nuevaOt.prioridadBaja')}</option>
                <option value="media">{t('nuevaOt.prioridadMedia')}</option>
                <option value="alta">{t('nuevaOt.prioridadAlta')}</option>
                <option value="urgente">{t('nuevaOt.prioridadUrgente')}</option>
              </select>
            </div>
            <div>
              <Input label={t('nuevaOt.labelTipoServicio')} {...register('tipo_servicio')} />
            </div>
            <div>
              <Input label={t('nuevaOt.labelKmIngreso')} type="number" {...register('km_ingreso', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('nuevaOt.labelCombustible')}</label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
                {...register('combustible_ing')}
              >
                <option value="">--</option>
                <option value="bencina">{t('nuevaOt.combustibleBencina')}</option>
                <option value="diesel">{t('nuevaOt.combustibleDiesel')}</option>
                <option value="electrico">{t('nuevaOt.combustibleElectrico')}</option>
                <option value="hibrido">{t('nuevaOt.combustibleHibrido')}</option>
                <option value="gas">{t('nuevaOt.combustibleGas')}</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('nuevaOt.labelDiagnostico')}</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
              rows={3}
              {...register('diagnostico')}
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('nuevaOt.labelObservaciones')}</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
              rows={2}
              {...register('observaciones')}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('nuevaOt.checklistTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {checklist.map((item, idx) => (
              <div key={item.zona_vehiculo} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 dark:bg-gray-800">
                <p className="font-medium text-sm mb-2 dark:text-white">{t(zonaI18nMap[item.zona_vehiculo])}</p>
                <select
                  value={item.estado}
                  onChange={(e) => {
                    const updated = [...checklist];
                    updated[idx] = { ...updated[idx], estado: e.target.value };
                    setChecklist(updated);
                  }}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 text-sm mb-2"
                >
                  <option value="ok">{t('nuevaOt.estadoOk')}</option>
                  <option value="danio_prev">{t('nuevaOt.estadoDanioPrevio')}</option>
                  <option value="danio_nuevo">{t('nuevaOt.estadoDanioNuevo')}</option>
                </select>
                <input
                  placeholder={t('nuevaOt.notasPlaceholder')}
                  value={item.notas}
                  onChange={(e) => {
                    const updated = [...checklist];
                    updated[idx] = { ...updated[idx], notas: e.target.value };
                    setChecklist(updated);
                  }}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 text-sm"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4 dark:text-white">{t('nuevaOt.firmaTitle')}</h2>
          <SignaturePad
            label={t('nuevaOt.firmaLabel')}
            value={firmaBase64}
            onChange={setFirmaBase64}
          />
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate('/ordenes-trabajo')}>
            {t('nuevaOt.cancelar')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('nuevaOt.creando') : t('nuevaOt.crearOt')}
          </Button>
        </div>
      </form>
    </div>
  );
}
