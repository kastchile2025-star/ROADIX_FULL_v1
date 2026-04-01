import { useState } from 'react';
import {
  X, ChevronLeft, ChevronRight,
  Users, Car, ClipboardList, Package, Truck, DollarSign, BarChart3,
  FileText, HardHat, Bell, Settings,
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface TourTopic {
  key: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;        // bg gradient
  iconBg: string;       // icon circle bg
  steps: string[];      // i18n keys for each step
}

const topics: TourTopic[] = [
  {
    key: 'clientes',
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    steps: ['tour.clientes.s1', 'tour.clientes.s2', 'tour.clientes.s3', 'tour.clientes.s4'],
  },
  {
    key: 'vehiculos',
    icon: Car,
    color: 'from-teal-500 to-teal-600',
    iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300',
    steps: ['tour.vehiculos.s1', 'tour.vehiculos.s2', 'tour.vehiculos.s3'],
  },
  {
    key: 'ordenes',
    icon: ClipboardList,
    color: 'from-indigo-500 to-indigo-600',
    iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
    steps: ['tour.ordenes.s1', 'tour.ordenes.s2', 'tour.ordenes.s3', 'tour.ordenes.s4', 'tour.ordenes.s5'],
  },
  {
    key: 'mecanicos',
    icon: HardHat,
    color: 'from-amber-500 to-amber-600',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300',
    steps: ['tour.mecanicos.s1', 'tour.mecanicos.s2', 'tour.mecanicos.s3'],
  },
  {
    key: 'inventario',
    icon: Package,
    color: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300',
    steps: ['tour.inventario.s1', 'tour.inventario.s2', 'tour.inventario.s3'],
  },
  {
    key: 'proveedores',
    icon: Truck,
    color: 'from-orange-500 to-orange-600',
    iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
    steps: ['tour.proveedores.s1', 'tour.proveedores.s2', 'tour.proveedores.s3'],
  },
  {
    key: 'caja',
    icon: DollarSign,
    color: 'from-green-500 to-green-600',
    iconBg: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
    steps: ['tour.caja.s1', 'tour.caja.s2', 'tour.caja.s3'],
  },
  {
    key: 'facturacion',
    icon: FileText,
    color: 'from-purple-500 to-purple-600',
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
    steps: ['tour.facturacion.s1', 'tour.facturacion.s2', 'tour.facturacion.s3'],
  },
  {
    key: 'notificaciones',
    icon: Bell,
    color: 'from-rose-500 to-rose-600',
    iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300',
    steps: ['tour.notificaciones.s1', 'tour.notificaciones.s2', 'tour.notificaciones.s3'],
  },
  {
    key: 'reportes',
    icon: BarChart3,
    color: 'from-cyan-500 to-cyan-600',
    iconBg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300',
    steps: ['tour.reportes.s1', 'tour.reportes.s2', 'tour.reportes.s3'],
  },
  {
    key: 'configuracion',
    icon: Settings,
    color: 'from-slate-500 to-slate-600',
    iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    steps: ['tour.configuracion.s1', 'tour.configuracion.s2', 'tour.configuracion.s3'],
  },
];

/* ═══ Slides view for a single topic ═══ */
function TopicSlides({ topic, onBack }: { topic: TourTopic; onBack: () => void }) {
  const { t } = useI18n();
  const [slide, setSlide] = useState(0);
  const total = topic.steps.length;
  const Icon = topic.icon;

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${topic.color} px-5 py-4 text-white`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Icon size={22} />
        </div>
        <div>
          <h3 className="font-bold text-lg">{t(`tour.${topic.key}.title`)}</h3>
          <p className="text-sm text-white/80">{t('tour.pasoDeTotal', { current: String(slide + 1), total: String(total) })}</p>
        </div>
      </div>

      {/* slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${topic.iconBg}`}>
          <Icon size={40} />
        </div>
        <p className="text-base text-gray-700 dark:text-gray-200 leading-relaxed max-w-md">
          {t(topic.steps[slide])}
        </p>
      </div>

      {/* progress dots */}
      <div className="flex justify-center gap-2 pb-4">
        {topic.steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`h-2.5 rounded-full transition-all ${i === slide ? 'w-8 bg-blue-500' : 'w-2.5 bg-gray-300 dark:bg-gray-600'}`}
          />
        ))}
      </div>

      {/* navigation */}
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-5 py-3">
        <button onClick={onBack} className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          ← {t('tour.volverTemas')}
        </button>
        <div className="flex gap-2">
          <button
            disabled={slide === 0}
            onClick={() => setSlide((s) => s - 1)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-30"
          >
            <ChevronLeft size={16} /> {t('wizard.atras')}
          </button>
          <button
            disabled={slide === total - 1}
            onClick={() => setSlide((s) => s + 1)}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-30"
          >
            {t('wizard.siguiente')} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ Main Tour Guide modal ═══ */
export function TourGuide({ open, onClose }: Props) {
  const { t } = useI18n();
  const [activeTopic, setActiveTopic] = useState<TourTopic | null>(null);

  const handleClose = () => { setActiveTopic(null); onClose(); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden />
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-800 overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('tour.title')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('tour.subtitle')}</p>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto">
          {activeTopic ? (
            <TopicSlides topic={activeTopic} onBack={() => setActiveTopic(null)} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6">
              {topics.map((topic) => {
                const Icon = topic.icon;
                return (
                  <button
                    key={topic.key}
                    onClick={() => setActiveTopic(topic)}
                    className="group flex flex-col items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-white dark:bg-gray-800"
                  >
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${topic.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon size={26} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {t(`tour.${topic.key}.title`)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
