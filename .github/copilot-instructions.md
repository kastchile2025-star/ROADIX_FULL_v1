---
applyTo: "**"
---

# ROADIX — Instrucciones Globales del Proyecto

> Sistema SaaS de gestión para talleres automotrices en Chile.

---

## URLs de Producción

| Servicio | URL |
|----------|-----|
| Landing | `https://www.roadix.cl` |
| App | `https://www.roadix.cl/app` |
| API | `https://roadix-full-v2.onrender.com/api` |

**Acceso superadmin:** `admin` / `1234` (rol `superadmin`)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS v10 + TypeScript + TypeORM + PostgreSQL 16 |
| Frontend | React 19 + Vite 6 + TailwindCSS 3 + Zustand + React Router v7 |
| Landing | HTML/CSS/JS vanilla (6 páginas) |
| Auth | JWT + Passport + bcrypt |
| Pagos | Flow Chile (CLP) |
| Deploy Front | Vercel (remote `origin`) |
| Deploy Back | Render (remote `v2` → `ROADIX_FULL_v2.git`) |
| DB | PostgreSQL Render (synchronize: true) |

---

## Git Remotes

```
origin → github.com/kastchile2025-star/ROADIX_FULL_v1.git  (Vercel)
v2     → github.com/kastchile2025-star/ROADIX_FULL_v2.git  (Render)
```

Push frontend: `git push origin main`
Push backend: `git push v2 main`
Push ambos: `git push origin main; git push v2 main`

---

## Estructura del Proyecto

```
ROADIX_FULL_v1/
├── backend/         ← NestJS API (Render)
│   └── src/
│       ├── modules/ ← 24 módulos NestJS
│       ├── database/entities/
│       ├── common/enums.ts
│       └── main.ts
├── frontend/        ← React SPA (Vercel)
│   └── src/
│       ├── pages/
│       ├── components/ui/
│       ├── services/
│       ├── store/
│       ├── i18n/es.ts
│       └── types/
├── web/             ← Landing HTML estático
├── shared/          ← Types compartidos
├── build.sh         ← Build unificado Vercel
├── vercel.json
└── docker-compose.yml
```

---

## Convenciones de Código

### Backend
- Cada módulo: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`
- Guards: `JwtAuthGuard` + `RolesGuard` en endpoints protegidos
- Todas las queries filtran por `taller_id` del usuario autenticado (`req.user.taller_id`)
- Enums en lowercase para match con i18n

### Frontend
- Servicios: `src/services/*.service.ts` (axios con `VITE_API_URL`)
- Páginas: `src/pages/<módulo>/<Módulo>Page.tsx`
- i18n: `const { t } = useI18n()` — nunca texto hardcodeado
- Componentes UI: `Button`, `Input`, `Modal`, `Card`, `Badge` en `components/ui/`

### Build/Deploy
- `build.sh`: frontend → `dist/app/`, web → `dist/`
- Vercel: `VITE_API_URL=https://roadix-full-v2.onrender.com/api`
- Render: `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `NODE_ENV=production`

---

## Roles de Usuario

| Rol | Acceso |
|-----|--------|
| `superadmin` | Todo el sistema, multi-taller, gestión de usuarios |
| `admin_taller` | Todo el taller propio |
| `recepcionista` | OTs, clientes, vehículos |
| `mecanico` | OTs asignadas, actualizar estado |
| `bodeguero` | Inventario, repuestos |
| `cajero` | Caja, pagos, facturación |
| `viewer` | Solo lectura |

---

## Planes del Sistema

| Plan | Precio CLP/mes |
|------|----------------|
| Free | $0 |
| Starter | $25.990 |
| Pro | $1.000 |
| Enterprise | Contacto |

---

## Enums Críticos (valores en DB, lowercase)

```
ot_estado: recepcion | diagnostico | presupuesto | esperando_aprobacion |
           esperando_repuestos | en_reparacion | control_calidad |
           listo | entregado | facturado | cancelado

tipo_dte: boleta | factura | nota_credito
estado_sii: emitido | pendiente | aceptado | rechazado | anulado
user_role: superadmin | admin_taller | recepcionista | mecanico | bodeguero | cajero | viewer
metodo_pago: efectivo | tarjeta_debito | tarjeta_credito | transferencia | cheque | credito
```

---

## Módulos del Backend

| Módulo | Tabla(s) |
|--------|---------|
| auth | usuario |
| talleres | taller |
| clientes | cliente |
| vehiculos | vehiculo |
| ordenes-trabajo | orden_trabajo |
| mecanicos | mecanico |
| inventario | repuesto, movimiento_stock |
| caja | pago |
| facturacion | factura |
| presupuestos | presupuesto |
| recordatorios | recordatorio |
| reportes | multi-tabla (read-only) |
| email | historial_email |
| flow | historial_pago_suscripcion |
| planes | plan |
| suscripciones | suscripcion |
| portal-cliente | orden_trabajo (read-only by token) |
| archivos | ot_foto |
