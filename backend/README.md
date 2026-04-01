# ROADIX Backend

## Propósito

Este backend soporta la operación principal de ROADIX como plataforma para gestión de talleres automotrices.

## Stack
- NestJS
- TypeScript
- TypeORM
- PostgreSQL
- JWT / Passport
- Bull
- Docker

## Entry point
- `src/main.ts`

## Composición principal
- `src/app.module.ts`

## Capacidades principales detectadas
- autenticación y autorización
- usuarios y roles
- talleres
- clientes
- vehículos
- órdenes de trabajo
- inventario y repuestos
- proveedores
- caja
- facturación
- reportes
- planes y suscripciones
- portal por token
- notificaciones

## Lógica SaaS
El backend contiene señales claras de modelo SaaS:
- entidad `Taller`
- entidad `Plan`
- entidad `Suscripcion`
- límites por plan
- uso por `taller_id`
- endpoints de suscripciones y planes

## Billing
Existe lógica de billing y suscripciones con:
- consulta de planes
- consulta de suscripción actual
- uso por plan
- historial de pagos
- cambio de plan
- cancelación / reactivación
- cron de cobros y expiración de trial

## Importante
La lógica de cobro existe, pero el gateway de pago aún está simulado. Todavía no debe considerarse un billing productivo final.

## Relación con frontend
El frontend operativo consume los endpoints de este backend para autenticación, operaciones de taller, facturación, billing y otros módulos del sistema.

## Próximos pasos técnicos sugeridos
- documentar módulos con mayor detalle
- auditar aislamiento multi-taller
- integrar gateway de pago real
- revisar limpieza de artefactos compilados y estructura de despliegue