# ROADIX Frontend

## Propósito

Este frontend corresponde a la aplicación operativa de ROADIX. Es distinto de la web comercial del producto y representa la interfaz de uso real del sistema.

## Stack
- React 19
- TypeScript
- Vite
- React Router
- React Query
- Zustand
- React Hook Form
- Zod
- Recharts
- Tailwind
- Capacitor Android

## Entry point
- `src/main.tsx`

## Router principal
- `src/routes/index.tsx`

## Módulos visibles detectados
- login / registro / recuperación
- dashboard
- clientes
- vehículos
- órdenes de trabajo
- nueva OT
- detalle OT
- kanban
- mecánicos
- inventario
- proveedores
- caja
- facturación
- notificaciones
- reportes
- billing
- usuarios
- configuración
- portal por token

## Estado general
El frontend muestra señales reales de operación:
- rutas protegidas
- login funcional
- páginas conectadas a servicios
- tablas, filtros, formularios, modales y acciones de negocio

## Billing
El frontend ya consume endpoints de billing y suscripciones mediante `billing.service.ts`, incluyendo:
- planes
- suscripción actual
- uso
- historial de pagos
- cambio de plan
- cancelación / reactivación

## Relación con backend
Este frontend depende del backend de ROADIX para autenticación, módulos operativos y lógica SaaS.

## Relación con la web comercial
- `APP/frontend/` = aplicación operativa real
- `WEB/` = sitio comercial / institucional / demo pública

## Próximos pasos técnicos sugeridos
- distinguir mejor módulos completamente implementados vs parciales
- validar robustez end-to-end de flujos críticos
- revisar paridad entre capacidades reales y narrativa comercial
- revisar salida Android vía Capacitor