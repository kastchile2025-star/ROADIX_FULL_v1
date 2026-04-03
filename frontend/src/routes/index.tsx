import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/guards/ProtectedRoute';

// Auth pages — small, keep eager for fast initial load
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Lazy-loaded pages
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const ActivatePage = lazy(() => import('../pages/auth/ActivatePage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ClientesPage = lazy(() => import('../pages/clientes/ClientesPage'));
const VehiculosPage = lazy(() => import('../pages/vehiculos/VehiculosPage'));
const UsuariosPage = lazy(() => import('../pages/usuarios/UsuariosPage'));
const ConfiguracionPage = lazy(() => import('../pages/configuracion/ConfiguracionPage'));
const OrdenesTrabajoPage = lazy(() => import('../pages/ordenes-trabajo/OrdenesTrabajoPage'));
const NuevaOtPage = lazy(() => import('../pages/ordenes-trabajo/NuevaOtPage'));
const OtDetallePage = lazy(() => import('../pages/ordenes-trabajo/OtDetallePage'));
const KanbanPage = lazy(() => import('../pages/kanban/KanbanPage'));
const MecanicosPage = lazy(() => import('../pages/mecanicos/MecanicosPage'));
const InventarioPage = lazy(() => import('../pages/inventario/InventarioPage'));
const ProveedoresPage = lazy(() => import('../pages/proveedores/ProveedoresPage'));
const CajaPage = lazy(() => import('../pages/caja/CajaPage'));
const FacturacionPage = lazy(() => import('../pages/facturacion/FacturacionPage'));
const NotificacionesPage = lazy(() => import('../pages/notificaciones/NotificacionesPage'));
const ReportesPage = lazy(() => import('../pages/reportes/ReportesPage'));
const BillingPage = lazy(() => import('../pages/billing/BillingPage'));
const BillingReturnPage = lazy(() => import('../pages/billing/BillingReturnPage'));
const PortalPage = lazy(() => import('../pages/portal/PortalPage'));

function LazyFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LazyFallback />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <Lazy><ForgotPasswordPage /></Lazy> },
  { path: '/reset-password', element: <Lazy><ResetPasswordPage /></Lazy> },
  { path: '/activate', element: <Lazy><ActivatePage /></Lazy> },
  { path: '/portal/:token', element: <Lazy><PortalPage /></Lazy> },

  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Lazy><DashboardPage /></Lazy> },
          { path: '/clientes', element: <Lazy><ClientesPage /></Lazy> },
          { path: '/vehiculos', element: <Lazy><VehiculosPage /></Lazy> },
          { path: '/ordenes-trabajo', element: <Lazy><OrdenesTrabajoPage /></Lazy> },
          { path: '/ordenes-trabajo/nueva', element: <Lazy><NuevaOtPage /></Lazy> },
          { path: '/ordenes-trabajo/:id', element: <Lazy><OtDetallePage /></Lazy> },
          { path: '/kanban', element: <Lazy><KanbanPage /></Lazy> },
          { path: '/mecanicos', element: <Lazy><MecanicosPage /></Lazy> },
          { path: '/inventario', element: <Lazy><InventarioPage /></Lazy> },
          { path: '/proveedores', element: <Lazy><ProveedoresPage /></Lazy> },
          { path: '/caja', element: <Lazy><CajaPage /></Lazy> },
          { path: '/facturacion', element: <Lazy><FacturacionPage /></Lazy> },
          { path: '/notificaciones', element: <Lazy><NotificacionesPage /></Lazy> },
          { path: '/reportes', element: <Lazy><ReportesPage /></Lazy> },
          { path: '/billing', element: <Lazy><BillingPage /></Lazy> },
          { path: '/billing/return', element: <Lazy><BillingReturnPage /></Lazy> },
          { path: '/usuarios', element: <Lazy><UsuariosPage /></Lazy> },
          { path: '/configuracion', element: <Lazy><ConfiguracionPage /></Lazy> },
        ],
      },
    ],
  },
], { basename: '/app' });
