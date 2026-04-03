import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/guards/ProtectedRoute';
import RouteErrorPage from './RouteErrorPage';
import { lazyWithRetry } from '../utils/chunkLoadRecovery';

// Auth pages — small, keep eager for fast initial load
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Lazy-loaded pages
const ForgotPasswordPage = lazyWithRetry(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazyWithRetry(() => import('../pages/auth/ResetPasswordPage'));
const ActivatePage = lazyWithRetry(() => import('../pages/auth/ActivatePage'));
const DashboardPage = lazyWithRetry(() => import('../pages/dashboard/DashboardPage'));
const ClientesPage = lazyWithRetry(() => import('../pages/clientes/ClientesPage'));
const VehiculosPage = lazyWithRetry(() => import('../pages/vehiculos/VehiculosPage'));
const UsuariosPage = lazyWithRetry(() => import('../pages/usuarios/UsuariosPage'));
const ConfiguracionPage = lazyWithRetry(() => import('../pages/configuracion/ConfiguracionPage'));
const OrdenesTrabajoPage = lazyWithRetry(() => import('../pages/ordenes-trabajo/OrdenesTrabajoPage'));
const NuevaOtPage = lazyWithRetry(() => import('../pages/ordenes-trabajo/NuevaOtPage'));
const OtDetallePage = lazyWithRetry(() => import('../pages/ordenes-trabajo/OtDetallePage'));
const KanbanPage = lazyWithRetry(() => import('../pages/kanban/KanbanPage'));
const MecanicosPage = lazyWithRetry(() => import('../pages/mecanicos/MecanicosPage'));
const InventarioPage = lazyWithRetry(() => import('../pages/inventario/InventarioPage'));
const ProveedoresPage = lazyWithRetry(() => import('../pages/proveedores/ProveedoresPage'));
const CajaPage = lazyWithRetry(() => import('../pages/caja/CajaPage'));
const FacturacionPage = lazyWithRetry(() => import('../pages/facturacion/FacturacionPage'));
const NotificacionesPage = lazyWithRetry(() => import('../pages/notificaciones/NotificacionesPage'));
const ReportesPage = lazyWithRetry(() => import('../pages/reportes/ReportesPage'));
const BillingPage = lazyWithRetry(() => import('../pages/billing/BillingPage'));
const BillingReturnPage = lazyWithRetry(() => import('../pages/billing/BillingReturnPage'));
const PortalPage = lazyWithRetry(() => import('../pages/portal/PortalPage'));

function LazyFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LazyFallback />}>{children}</Suspense>;
}

const routeErrorElement = <RouteErrorPage />;

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage />, errorElement: routeErrorElement },
  { path: '/register', element: <RegisterPage />, errorElement: routeErrorElement },
  { path: '/forgot-password', element: <Lazy><ForgotPasswordPage /></Lazy>, errorElement: routeErrorElement },
  { path: '/reset-password', element: <Lazy><ResetPasswordPage /></Lazy>, errorElement: routeErrorElement },
  { path: '/activate', element: <Lazy><ActivatePage /></Lazy>, errorElement: routeErrorElement },
  { path: '/billing/return', element: <Lazy><BillingReturnPage /></Lazy>, errorElement: routeErrorElement },
  { path: '/portal/:token', element: <Lazy><PortalPage /></Lazy>, errorElement: routeErrorElement },

  // Protected routes
  {
    element: <ProtectedRoute />,
    errorElement: routeErrorElement,
    children: [
      {
        element: <AppLayout />,
        errorElement: routeErrorElement,
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
          { path: '/usuarios', element: <Lazy><UsuariosPage /></Lazy> },
          { path: '/configuracion', element: <Lazy><ConfiguracionPage /></Lazy> },
        ],
      },
    ],
  },
], { basename: '/app' });
