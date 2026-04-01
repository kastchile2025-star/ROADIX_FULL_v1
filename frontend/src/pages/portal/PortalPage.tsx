import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Wrench, Camera, FileText, Receipt, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import portalApi from '../../services/portal.service';
import { SignaturePad } from '../../components/ui';
import type { OrdenTrabajo, OtFoto, Presupuesto, Factura } from '../../types';

const estadoTimeline = [
  'recepcion', 'diagnostico', 'presupuesto', 'esperando_aprobacion',
  'esperando_repuestos', 'en_reparacion', 'control_calidad', 'listo', 'entregado', 'facturado',
];

const estadoLabels: Record<string, string> = {
  recepcion: 'Recepción', diagnostico: 'Diagnóstico', presupuesto: 'Presupuesto',
  esperando_aprobacion: 'Esperando Aprobación', esperando_repuestos: 'Esperando Repuestos',
  en_reparacion: 'En Reparación', control_calidad: 'Control de Calidad',
  listo: 'Listo para Entrega', entregado: 'Entregado', facturado: 'Facturado', cancelado: 'Cancelado',
};

type Tab = 'estado' | 'fotos' | 'presupuesto' | 'factura';

export default function PortalPage() {
  const { token } = useParams<{ token: string }>();
  const [ot, setOt] = useState<OrdenTrabajo | null>(null);
  const [fotos, setFotos] = useState<OtFoto[]>([]);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [factura, setFactura] = useState<Factura | null>(null);
  const [tab, setTab] = useState<Tab>('estado');
  const [error, setError] = useState('');
  const [aprobando, setAprobando] = useState(false);
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    portalApi.getOt(token).then(setOt).catch(() => setError('Orden de trabajo no encontrada'));
    portalApi.getFotos(token).then(setFotos).catch(() => {});
    portalApi.getPresupuesto(token).then(setPresupuesto).catch(() => {});
    portalApi.getFactura(token).then(setFactura).catch(() => {});
  }, [token]);

  const aprobar = async () => {
    if (!token) return;
    setAprobando(true);
    try {
      await portalApi.aprobarPresupuesto(token, firmaBase64 ?? undefined);
      const updated = await portalApi.getOt(token);
      setOt(updated);
      const pres = await portalApi.getPresupuesto(token);
      setPresupuesto(pres);
    } finally { setAprobando(false); }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No encontrada</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!ot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  const currentIdx = estadoTimeline.indexOf(ot.estado);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Wrench className="h-7 w-7" />
          <div>
            <h1 className="text-xl font-bold">{ot.taller?.nombre ?? 'Roadix'}</h1>
            <p className="text-blue-100 text-sm">Portal del Cliente — {ot.numero_ot}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Vehicle Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500 block">Vehículo</span><span className="font-semibold">{ot.vehiculo?.marca} {ot.vehiculo?.modelo}</span></div>
            <div><span className="text-gray-500 block">Patente</span><span className="font-semibold">{ot.vehiculo?.patente}</span></div>
            <div><span className="text-gray-500 block">Estado</span><span className="font-semibold text-blue-600">{estadoLabels[ot.estado] ?? ot.estado}</span></div>
            <div><span className="text-gray-500 block">Total</span><span className="font-semibold">${Number(ot.total).toLocaleString()}</span></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 bg-white rounded-t-xl px-2 pt-2">
          {([
            { key: 'estado' as Tab, icon: Clock, label: 'Estado' },
            { key: 'fotos' as Tab, icon: Camera, label: 'Fotos' },
            { key: 'presupuesto' as Tab, icon: FileText, label: 'Presupuesto' },
            { key: 'factura' as Tab, icon: Receipt, label: 'Factura' },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-b-xl rounded-xl shadow-sm p-6">
          {tab === 'estado' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Progreso de la Orden</h2>
              <div className="relative">
                {estadoTimeline.map((estado, idx) => {
                  const done = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <div key={estado} className="flex items-start gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          done ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}>
                          {done ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                        </div>
                        {idx < estadoTimeline.length - 1 && (
                          <div className={`w-0.5 h-8 ${done ? 'bg-blue-600' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <div className="pt-1">
                        <span className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                          {estadoLabels[estado] ?? estado}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'fotos' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Fotos del Proceso</h2>
              {fotos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay fotos disponibles</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {fotos.map((f) => (
                    <div key={f.id} className="rounded-lg overflow-hidden border border-gray-200">
                      <img src={f.url} alt={f.descripcion ?? 'Foto'} className="w-full h-48 object-cover" />
                      <div className="p-2">
                        <span className="text-xs text-gray-500">{f.tipo}</span>
                        {f.descripcion && <p className="text-sm text-gray-700">{f.descripcion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'presupuesto' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Presupuesto</h2>
              {!presupuesto ? (
                <p className="text-gray-500 text-center py-8">Presupuesto no disponible aún</p>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-gray-500">
                          <th className="px-4 py-3 font-medium">Item</th>
                          <th className="px-4 py-3 font-medium text-right">Cantidad</th>
                          <th className="px-4 py-3 font-medium text-right">P. Unitario</th>
                          <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(presupuesto.items_json ?? []).map((item, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 text-gray-900">{item.descripcion}</td>
                            <td className="px-4 py-3 text-right">{item.cantidad}</td>
                            <td className="px-4 py-3 text-right">${item.precio_unit?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">${(item.cantidad * item.precio_unit).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm text-gray-500">Subtotal: ${Number(presupuesto.subtotal).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">IVA (19%): ${Number(presupuesto.iva).toLocaleString()}</p>
                    <p className="text-lg font-bold text-gray-900">Total: ${Number(presupuesto.total).toLocaleString()}</p>
                  </div>
                  {presupuesto.estado === 'enviado' && (
                    <div className="space-y-4 pt-4">
                      <div className="max-w-md mx-auto">
                        <SignaturePad
                          label="Firme para aprobar el presupuesto"
                          value={firmaBase64}
                          onChange={setFirmaBase64}
                          height={160}
                        />
                      </div>
                      <div className="text-center">
                        <button
                          onClick={aprobar}
                          disabled={aprobando || !firmaBase64}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                        >
                          {aprobando ? 'Aprobando...' : '✓ Aprobar Presupuesto'}
                        </button>
                      </div>
                    </div>
                  )}
                  {presupuesto.estado === 'aprobado' && (
                    <div className="text-center pt-4 space-y-2">
                      <div className="inline-flex items-center gap-2 text-green-600 font-semibold">
                        <CheckCircle className="h-5 w-5" /> Presupuesto Aprobado
                      </div>
                      {presupuesto.firma_url && (
                        <div className="border rounded-lg bg-gray-50 p-2 inline-block">
                          <img src={presupuesto.firma_url} alt="Firma" className="max-h-24" />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'factura' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Factura / Boleta</h2>
              {!factura ? (
                <p className="text-gray-500 text-center py-8">No hay documento tributario emitido</p>
              ) : (
                <div className="border rounded-lg p-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Tipo:</span> <span className="font-semibold">{factura.tipo_dte}</span></div>
                    <div><span className="text-gray-500">N° DTE:</span> <span className="font-semibold">{factura.numero_dte}</span></div>
                    <div><span className="text-gray-500">Monto Neto:</span> <span className="font-semibold">${factura.monto_neto.toLocaleString()}</span></div>
                    <div><span className="text-gray-500">IVA:</span> <span className="font-semibold">${factura.iva.toLocaleString()}</span></div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">Total: ${factura.monto_total.toLocaleString()}</p>
                  </div>
                  {factura.pdf_url && (
                    <div className="text-center pt-4">
                      <a
                        href={factura.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                      >
                        <Receipt className="h-4 w-4" /> Descargar Documento
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="text-center text-sm text-gray-400 py-6">
        Powered by Roadix — Sistema de Gestión de Taller
      </footer>
    </div>
  );
}
