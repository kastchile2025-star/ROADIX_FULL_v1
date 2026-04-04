import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Car,
  UserCog,
  Settings,
  ClipboardList,
  Columns3,
  HardHat,
  Package,
  Truck,
  DollarSign,
  FileText,
  Bell,
  BarChart3,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { RoadixLogo } from '../ui/RoadixLogo';
import { useI18n } from '../../context/I18nContext';
import { useAuthStore } from '../../store/auth.store';

const links = [
  { to: '/', icon: LayoutDashboard, key: 'sidebar.dashboard' },
  { to: '/ordenes-trabajo', icon: ClipboardList, key: 'sidebar.ordenesTrabajo' },
  { to: '/kanban', icon: Columns3, key: 'sidebar.kanban' },
  { to: '/clientes', icon: Users, key: 'sidebar.clientes' },
  { to: '/vehiculos', icon: Car, key: 'sidebar.vehiculos' },
  { to: '/mecanicos', icon: HardHat, key: 'sidebar.mecanicos' },
  { to: '/inventario', icon: Package, key: 'sidebar.inventario' },
  { to: '/proveedores', icon: Truck, key: 'sidebar.proveedores' },
  { to: '/caja', icon: DollarSign, key: 'sidebar.caja' },
  { to: '/facturacion', icon: FileText, key: 'sidebar.facturacion' },
  { to: '/notificaciones', icon: Bell, key: 'sidebar.notificaciones' },
  { to: '/reportes', icon: BarChart3, key: 'sidebar.reportes' },
  { to: '/billing', icon: CreditCard, key: 'sidebar.billing', adminOnly: true },
  { to: '/usuarios', icon: UserCog, key: 'sidebar.usuarios' },
  { to: '/configuracion', icon: Settings, key: 'sidebar.configuracion' },
  { to: '/gestion-usuarios', icon: ShieldAlert, key: 'sidebar.gestionUsuarios', adminOnly: true, red: true },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onTour: () => void;
}

const ADMIN_ROLES = ['superadmin', 'admin_taller'];

export function Sidebar({ collapsed, onToggle, onTour }: SidebarProps) {
  const { t } = useI18n();
  const rol = useAuthStore((s) => s.user?.rol);
  const visibleLinks = links.filter((l) => !l.adminOnly || ADMIN_ROLES.includes(rol ?? ''));

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 shadow-xl transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <Link
        to="/"
        className="flex h-16 items-center gap-3 border-b border-white/10 px-4 hover:bg-white/5 transition-colors overflow-hidden"
      >
        <RoadixLogo size={36} />
        {!collapsed && (
          <span className="text-xl font-bold text-white whitespace-nowrap tracking-tight">Roadix</span>
        )}
      </Link>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
        {visibleLinks.map(({ to, icon: Icon, key, red }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? t(key) : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg py-2 pr-3 text-sm font-medium transition-all border-l-2 ${
                collapsed ? 'pl-[9px]' : 'pl-[10px]'
              } ${
                red
                  ? isActive
                    ? 'bg-red-500/20 text-red-300 border-red-400'
                    : 'text-red-400 hover:bg-red-500/10 hover:text-red-300 border-transparent'
                  : isActive
                    ? 'bg-blue-500/20 text-blue-300 border-blue-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 border-transparent'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{t(key)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer: tour + toggle + copyright */}
      <div className="border-t border-white/10 px-2 py-3 space-y-1">
        <button
          onClick={onTour}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-blue-300 transition-colors"
          title={t('tour.btnTitle')}
        >
          <HelpCircle size={18} className="flex-shrink-0" />
          {!collapsed && <span>{t('tour.btnLabel')}</span>}
        </button>
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors"
          title={collapsed ? t('sidebar.expandir') : t('sidebar.colapsar')}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        {!collapsed && (
          <p className="text-center text-[10px] text-slate-600 pt-1">
            © 2026 QCORE · v1.26
          </p>
        )}
      </div>
    </aside>
  );
}
