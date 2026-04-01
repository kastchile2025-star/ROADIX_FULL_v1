# 🛠️ ROADIX — Plan Completo de Desarrollo
## Sistema de Gestión Inteligente para Talleres Mecánicos y Automotrices
### "Gestión técnica con inteligencia digital"

---

## 📋 ÍNDICE
0. [Estrategia de Repositorio — Monorepo](#0-estrategia-de-repositorio--monorepo)
1. [Arquitectura General](#1-arquitectura-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Base de Datos (PostgreSQL)](#3-base-de-datos-postgresql)
4. [Módulos del Sistema](#4-módulos-del-sistema)
5. [Sistema de Correos Electrónicos](#5-sistema-de-correos-electrónicos)
6. [Integraciones Externas](#6-integraciones-externas)
7. [Fases de Desarrollo](#7-fases-de-desarrollo)
8. [Seguridad y Permisos](#8-seguridad-y-permisos)
9. [Despliegue y DevOps](#9-despliegue-y-devops)
10. [Guía de Implementación Paso a Paso](#10-guía-de-implementación-paso-a-paso)

---

## 0. ESTRATEGIA DE REPOSITORIO — MONOREPO

Se utiliza un **monorepo** (un solo repositorio Git) que contiene tanto el frontend como el backend.

### Justificación
- Un solo `git clone` para tener todo el proyecto
- `docker-compose` levanta backend + frontend + PostgreSQL + Redis de una sola vez
- Cambios que afectan frontend y backend van en un solo commit/PR
- Tipos TypeScript compartidos entre frontend y backend (interfaces, DTOs)
- Despliegue coordinado desde un solo CI/CD pipeline

### Estructura del monorepo
```
SmartMEC/
├── backend/               # NestJS API
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── frontend/              # React App (Vite)
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── shared/                # Tipos e interfaces compartidos
│   └── types/
├── docker-compose.yml     # PostgreSQL + Redis + API + Frontend
├── .gitignore
├── .env.example
└── README.md
```

---

## 1. ARQUITECTURA GENERAL

```
┌──────────────────────────────────────────────────────────────┐
│                    CLIENTES / USUARIOS                        │
├──────────────┬──────────────┬─────────────────────────────────┤
│  📱 App Móvil │  🖥️ Web App  │  👤 Portal del Cliente          │
│  (Capacitor) │  (React)     │  (Link único por OT)           │
├──────────────┴──────────────┴─────────────────────────────────┤
│                   ⚡ API Gateway (NestJS)                      │
├───────────┬──────────┬──────────┬──────────┬──────────────────┤
│ Auth/JWT  │ REST API │ WebSocket│ Cron Jobs│ File Upload      │
├───────────┴──────────┴──────────┴──────────┴──────────────────┤
│                   💾 PostgreSQL Database                       │
├───────────┬──────────┬──────────┬─────────────────────────────┤
│ 📦 GCloud │ 📧 Email │ 💬 WSP  │ 📄 Facturación Electrónica  │
│  Storage  │ SendGrid │  API    │  (SII Chile)                 │
└───────────┴──────────┴──────────┴─────────────────────────────┘
```

### Estructura de Carpetas
```
SMART_MEC/
├── src/                          # Frontend React + Tailwind
│   ├── assets/                   # Imágenes, iconos, fuentes
│   ├── components/               # Componentes reutilizables
│   │   ├── ui/                   # Botones, inputs, modals, cards
│   │   ├── layout/               # Sidebar, header, footer
│   │   ├── forms/                # Formularios complejos
│   │   └── charts/               # Gráficos del dashboard
│   ├── pages/                    # Páginas principales
│   │   ├── auth/                 # Login, registro, recuperación
│   │   ├── billing/              # Planes, suscripción, pagos
│   │   ├── dashboard/            # Panel gerencial
│   │   ├── recepcion/            # Recepción digital
│   │   ├── diagnostico/          # Centro de diagnóstico
│   │   ├── operaciones/          # Tablero Kanban
│   │   ├── inventario/           # Stock y bodega
│   │   ├── caja/                 # Facturación y pagos
│   │   ├── clientes/             # CRM y fidelización
│   │   ├── vehiculos/            # Fichas de vehículos
│   │   ├── mecanicos/            # Gestión de técnicos
│   │   ├── reportes/             # Reportes y analytics
│   │   └── configuracion/        # Ajustes del taller
│   ├── hooks/                    # Custom hooks
│   ├── services/                 # API calls (axios/fetch)
│   ├── store/                    # Estado global (Zustand)
│   ├── utils/                    # Helpers, formatters
│   ├── types/                    # TypeScript types/interfaces
│   └── routes/                   # React Router config
│
├── backend/                      # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/             # Autenticación JWT + roles
│   │   │   ├── users/            # Usuarios del sistema
│   │   │   ├── talleres/         # Multi-taller (SaaS ready)
│   │   │   ├── planes/           # Planes y pricing
│   │   │   ├── suscripciones/    # Suscripciones y cobros
│   │   │   ├── clientes/         # Clientes del taller
│   │   │   ├── vehiculos/        # Vehículos
│   │   │   ├── ordenes-trabajo/  # Órdenes de trabajo (OT)
│   │   │   ├── diagnosticos/     # Diagnósticos técnicos
│   │   │   ├── presupuestos/     # Cotizaciones/presupuestos
│   │   │   ├── operaciones/      # Flujo Kanban
│   │   │   ├── inventario/       # Stock de repuestos
│   │   │   ├── proveedores/      # Proveedores
│   │   │   ├── caja/             # Caja, cobros, pagos
│   │   │   ├── facturacion/      # Facturación electrónica
│   │   │   ├── mecanicos/        # Técnicos y asignaciones
│   │   │   ├── email/            # Servicio de correos
│   │   │   ├── whatsapp/         # Integración WhatsApp
│   │   │   ├── archivos/         # Upload de fotos/docs
│   │   │   ├── recordatorios/    # Motor de alertas y cron
│   │   │   ├── reportes/         # Generación de reportes
│   │   │   └── portal-cliente/   # API pública para portal
│   │   ├── common/
│   │   │   ├── guards/           # Auth guards, role guards
│   │   │   ├── decorators/       # Custom decorators
│   │   │   ├── interceptors/     # Logging, transform
│   │   │   ├── filters/          # Exception filters
│   │   │   ├── pipes/            # Validation pipes
│   │   │   └── dto/              # DTOs compartidos
│   │   ├── config/               # Configuración (env vars)
│   │   └── database/
│   │       ├── entities/         # Entidades TypeORM
│   │       ├── migrations/       # Migraciones SQL
│   │       └── seeds/            # Datos iniciales
│   └── test/
│
├── android/                      # Capacitor (auto-generado)
├── ios/                          # Capacitor (auto-generado)
├── docker-compose.yml            # PostgreSQL + Redis + API
└── capacitor.config.ts           # Config Capacitor
```

---

## 2. STACK TECNOLÓGICO

### Frontend
| Tecnología | Uso |
|---|---|
| **React 18+** | SPA principal |
| **TypeScript** | Tipado estricto |
| **Tailwind CSS** | Estilos utility-first |
| **Zustand** | Estado global (ligero) |
| **React Router v6** | Navegación |
| **React Query (TanStack)** | Cache y sync de datos API |
| **React Hook Form + Zod** | Formularios + validación |
| **Recharts** | Gráficos del dashboard |
| **@dnd-kit** | Drag & drop para Kanban |
| **Capacitor** | Empaquetado nativo (Android/iOS) |
| **Capacitor Camera** | Fotos de peritaje |
| **Capacitor Speech** | Dictado por voz |
| **SignaturePad** | Firma digital del cliente |
| **Tesseract.js** | OCR de patentes |

### Backend
| Tecnología | Uso |
|---|---|
| **NestJS** | Framework API (modular) |
| **TypeScript** | Tipado estricto |
| **TypeORM** | ORM para PostgreSQL |
| **Passport + JWT** | Autenticación |
| **class-validator** | Validación de DTOs |
| **Bull/BullMQ** | Colas de trabajo (emails, cron) |
| **@nestjs/schedule** | Tareas programadas (recordatorios) |
| **Multer** | Upload de archivos |
| **PDFKit / Puppeteer** | Generación de PDFs |
| **SendGrid / Nodemailer** | Envío de correos |
| **Socket.io** | WebSocket para portal tiempo real |

### Infraestructura
| Tecnología | Uso |
|---|---|
| **PostgreSQL 16** | Base de datos principal |
| **Redis** | Cache + colas Bull |
| **Google Cloud Storage** | Fotos y documentos |
| **Docker** | Contenedores dev/prod |
| **Nginx** | Reverse proxy |

---

## 3. BASE DE DATOS (PostgreSQL)

### Diagrama Entidad-Relación

```
┌──────────────────┐
│      PLAN        │
│──────────────────│
│ id               │
│ nombre           │  (free/starter/pro/enterprise)
│ precio_mensual   │  (CLP)
│ precio_anual     │  (CLP, descuento ~15%)
│ max_usuarios     │  (ej: 2, 5, 15, ilimitado)
│ max_ots_mes      │  (ej: 30, 200, ilimitado)
│ max_vehiculos    │  (ej: 50, 500, ilimitado)
│ max_storage_mb   │  (ej: 500, 5000, 50000)
│ tiene_facturacion │  (bool)
│ tiene_whatsapp   │  (bool)
│ tiene_portal     │  (bool)
│ tiene_reportes   │  (bool)
│ tiene_api        │  (bool)
│ activo           │
│ created_at       │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│   SUSCRIPCION        │
│──────────────────────│
│ id                   │
│ taller_id FK ────────┼──► TALLER
│ plan_id FK ──────────┼──► PLAN
│ periodo              │  (mensual/anual)
│ estado               │  (activa/trial/vencida/cancelada/suspendida)
│ fecha_inicio         │
│ fecha_fin            │  (renovación automática)
│ trial_hasta          │  (14 días gratis)
│ proximo_cobro        │
│ metodo_pago          │
│ referencia_pago      │  (ID transacción pasarela)
│ monto_pagado         │
│ descuento_pct        │  (cupones, promos)
│ auto_renovar         │  (bool, default true)
│ cancelado_at         │
│ created_at           │
│ updated_at           │
└──────────────────────┘

┌──────────────────────┐
│  HISTORIAL_PAGO_SUSC │
│──────────────────────│
│ id                   │
│ suscripcion_id FK    │
│ monto                │
│ metodo_pago          │
│ referencia           │  (ID pasarela)
│ estado               │  (exitoso/fallido/pendiente/reembolsado)
│ fecha_pago           │
│ periodo_desde        │
│ periodo_hasta        │
│ created_at           │
└──────────────────────┘

┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   TALLER    │────<│   USUARIO    │     │   PROVEEDOR      │
│─────────────│     │──────────────│     │──────────────────│
│ id          │     │ id           │     │ id               │
│ nombre      │     │ taller_id FK │     │ taller_id FK     │
│ rut         │     │ nombre       │     │ razon_social     │
│ direccion   │     │ email        │     │ rut              │
│ telefono    │     │ password     │     │ contacto         │
│ logo_url    │     │ rol          │     │ email            │
│ config_json │     │ telefono     │     │ telefono         │
│ created_at  │     │ avatar_url   │     │ created_at       │
└─────────────┘     │ activo       │     └──────────────────┘
                    │ created_at   │              │
                    └──────┬───────┘              │
                           │                      │
         ┌─────────────────┼────────────────┐     │
         │                 │                │     │
         ▼                 ▼                ▼     ▼
┌──────────────┐  ┌──────────────┐  ┌───────────────────┐
│   CLIENTE    │  │   MECANICO   │  │ REPUESTO/PRODUCTO │
│──────────────│  │──────────────│  │───────────────────│
│ id           │  │ id           │  │ id                │
│ taller_id FK │  │ usuario_id FK│  │ taller_id FK      │
│ nombre       │  │ taller_id FK │  │ proveedor_id FK   │
│ rut          │  │ especialidad │  │ codigo            │
│ email        │  │ tarifa_hora  │  │ nombre            │
│ telefono     │  │ activo       │  │ descripcion       │
│ direccion    │  │ created_at   │  │ categoria         │
│ tipo         │  └──────┬───────┘  │ precio_compra     │
│ created_at   │         │          │ precio_venta      │
└──────┬───────┘         │          │ stock_actual      │
       │                 │          │ stock_minimo      │
       ▼                 │          │ ubicacion_bodega  │
┌──────────────┐         │          │ created_at        │
│  VEHICULO    │         │          └─────────┬─────────┘
│──────────────│         │                    │
│ id           │         │                    │
│ cliente_id FK│         │                    │
│ taller_id FK │         │                    │
│ patente      │◄─ OCR   │                    │
│ marca        │         │                    │
│ modelo       │         │                    │
│ anio         │         │                    │
│ color        │         │                    │
│ vin          │         │                    │
│ tipo_vehiculo│         │                    │
│ km_actual    │         │                    │
│ combustible  │         │                    │
│ rev_tecnica  │    ◄── Recordatorio          │
│ permiso_circ │    ◄── Recordatorio          │
│ soap_vence   │    ◄── Recordatorio          │
│ foto_url     │         │                    │
│ notas        │         │                    │
│ created_at   │         │                    │
└──────┬───────┘         │                    │
       │                 │                    │
       ▼                 │                    │
┌──────────────────┐     │                    │
│  ORDEN_TRABAJO   │     │                    │
│──────────────────│     │                    │
│ id               │     │                    │
│ taller_id FK     │     │                    │
│ vehiculo_id FK   │     │                    │
│ cliente_id FK    │     │                    │
│ mecanico_id FK ──┼─────┘                    │
│ numero_ot        │ (Autoincremental)        │
│ estado           │ (enum: ver abajo)        │
│ tipo_servicio    │                          │
│ km_ingreso       │                          │
│ combustible_ing  │                          │
│ diagnostico      │ ◄── Dictado por voz      │
│ observaciones    │                          │
│ fecha_ingreso    │                          │
│ fecha_prometida  │                          │
│ fecha_entrega    │                          │
│ prioridad        │ (baja/media/alta/urgente)│
│ token_portal     │ (UUID para portal cliente│
│ subtotal         │                          │
│ descuento        │                          │
│ iva              │                          │
│ total            │                          │
│ firma_cliente_url│ ◄── Firma digital        │
│ created_at       │                          │
│ updated_at       │                          │
└──────┬───────────┘                          │
       │                                      │
       ├──────────────────┐                   │
       │                  │                   │
       ▼                  ▼                   │
┌────────────────┐ ┌────────────────┐         │
│ OT_DETALLE     │ │ OT_FOTO        │         │
│────────────────│ │────────────────│         │
│ id             │ │ id             │         │
│ ot_id FK       │ │ ot_id FK       │         │
│ tipo           │ │ url            │         │
│  (mano_obra/   │ │ tipo           │         │
│   repuesto)    │ │  (ingreso/     │         │
│ repuesto_id FK─┼─┼─proceso/       │         │
│ descripcion    │ │  entrega/      │         │
│ cantidad       │ │  dano)         │         │
│ precio_unit    │ │ descripcion    │         │
│ descuento      │ │ created_at     │         │
│ subtotal       │ └────────────────┘         │
└────────────────┘                            │
       │                                      │
       ▼                                      │
┌────────────────────┐                        │
│ MOVIMIENTO_STOCK   │                        │
│────────────────────│                        │
│ id                 │                        │
│ repuesto_id FK ────┼────────────────────────┘
│ ot_detalle_id FK   │
│ tipo               │ (entrada/salida/ajuste)
│ cantidad           │
│ motivo             │
│ usuario_id FK      │
│ created_at         │
└────────────────────┘

┌──────────────────┐     ┌──────────────────┐
│   PRESUPUESTO    │     │   PAGO           │
│──────────────────│     │──────────────────│
│ id               │     │ id               │
│ ot_id FK         │     │ ot_id FK         │
│ taller_id FK     │     │ taller_id FK     │
│ numero           │     │ monto            │
│ estado           │     │ metodo_pago      │
│  (borrador/      │     │  (efectivo/      │
│   enviado/       │     │   tarjeta/       │
│   aprobado/      │     │   transferencia) │
│   rechazado)     │     │ referencia       │
│ items_json       │     │ fecha_pago       │
│ subtotal         │     │ created_at       │
│ iva              │     └──────────────────┘
│ total            │
│ pdf_url          │     ┌──────────────────┐
│ enviado_email    │     │   FACTURA        │
│ enviado_wsp      │     │──────────────────│
│ aprobado_at      │     │ id               │
│ firma_url        │     │ ot_id FK         │
│ created_at       │     │ taller_id FK     │
└──────────────────┘     │ numero_dte       │
                         │ tipo_dte         │
┌──────────────────┐     │  (boleta/factura)│
│  RECORDATORIO    │     │ rut_receptor     │
│──────────────────│     │ xml_dte          │
│ id               │     │ pdf_url          │
│ taller_id FK     │     │ estado_sii       │
│ cliente_id FK    │     │ monto_neto       │
│ vehiculo_id FK   │     │ iva              │
│ tipo             │     │ monto_total      │
│  (rev_tecnica/   │     │ created_at       │
│   permiso_circ/  │     └──────────────────┘
│   soap/          │
│   mantencion/    │     ┌──────────────────┐
│   seguimiento)   │     │  HISTORIAL_EMAIL │
│ mensaje          │     │──────────────────│
│ fecha_envio      │     │ id               │
│ canal            │     │ taller_id FK     │
│  (email/wsp/     │     │ destinatario     │
│   ambos)         │     │ asunto           │
│ estado           │     │ tipo             │
│  (pendiente/     │     │  (presupuesto/   │
│   enviado/       │     │   ot_finalizada/ │
│   fallido)       │     │   recordatorio/  │
│ enviado_at       │     │   rev_tecnica/   │
│ created_at       │     │   bienvenida/    │
└──────────────────┘     │   marketing)     │
                         │ template_usado   │
┌──────────────────┐     │ variables_json   │
│  CHECKLIST_RECEP │     │ estado           │
│──────────────────│     │  (enviado/       │
│ id               │     │   entregado/     │
│ ot_id FK         │     │   fallido/       │
│ zona_vehiculo    │     │   abierto)       │
│  (frente/trasera/│     │ sendgrid_id      │
│   lat_izq/       │     │ abierto_at       │
│   lat_der/       │     │ created_at       │
│   techo/interior)│     └──────────────────┘
│ estado           │
│  (ok/danio_prev/ │     ┌──────────────────┐
│   danio_nuevo)   │     │  AUDITORIA_LOG   │
│ foto_url         │     │──────────────────│
│ notas            │     │ id               │
│ created_at       │     │ taller_id FK     │
└──────────────────┘     │ usuario_id FK    │
                         │ accion           │
                         │ entidad          │
                         │ entidad_id       │
                         │ datos_antes      │
                         │ datos_despues    │
                         │ ip               │
                         │ created_at       │
                         └──────────────────┘
```

### Estados de la Orden de Trabajo (Flujo Kanban)
```
  RECEPCION → DIAGNOSTICO → PRESUPUESTO → ESPERANDO_APROBACION
       ↓                                         ↓
  (checklist,                               (cliente aprueba
   fotos,                                    por portal/firma)
   km, combustible)                               ↓
                                        ESPERANDO_REPUESTOS
                                               ↓
                                         EN_REPARACION
                                               ↓
                                        CONTROL_CALIDAD
                                               ↓
                                             LISTO
                                               ↓
                                           ENTREGADO
                                               ↓
                                           FACTURADO
```

### Enums y Tipos Importantes
```sql
-- Roles de usuario
CREATE TYPE user_role AS ENUM (
  'superadmin',    -- Admin de la plataforma
  'admin_taller',  -- Dueño/gerente del taller
  'recepcionista', -- Recepción de vehículos
  'mecanico',      -- Técnico/mecánico
  'bodeguero',     -- Control de inventario
  'cajero',        -- Facturación y cobros
  'viewer'         -- Solo lectura (contador, etc.)
);

-- Estados de la OT
CREATE TYPE ot_estado AS ENUM (
  'recepcion',
  'diagnostico',
  'presupuesto',
  'esperando_aprobacion',
  'esperando_repuestos',
  'en_reparacion',
  'control_calidad',
  'listo',
  'entregado',
  'facturado',
  'cancelado'
);

-- Prioridad
CREATE TYPE prioridad AS ENUM ('baja', 'media', 'alta', 'urgente');

-- Tipo de vehículo
CREATE TYPE tipo_vehiculo AS ENUM (
  'automovil', 'camioneta', 'suv', 'van', 'camion',
  'moto', 'bus', 'maquinaria', 'otro'
);

-- Método de pago
CREATE TYPE metodo_pago AS ENUM (
  'efectivo', 'tarjeta_debito', 'tarjeta_credito',
  'transferencia', 'cheque', 'credito'
);

-- Estado de suscripción
CREATE TYPE suscripcion_estado AS ENUM (
  'activa', 'trial', 'vencida', 'cancelada', 'suspendida'
);

-- Periodo de suscripción
CREATE TYPE suscripcion_periodo AS ENUM ('mensual', 'anual');

-- Estado de pago de suscripción
CREATE TYPE pago_suscripcion_estado AS ENUM (
  'exitoso', 'fallido', 'pendiente', 'reembolsado'
);
```

### Índices Críticos
```sql
-- Búsquedas frecuentes
CREATE INDEX idx_vehiculo_patente ON vehiculo(patente);
CREATE INDEX idx_vehiculo_cliente ON vehiculo(cliente_id);
CREATE INDEX idx_ot_estado ON orden_trabajo(estado);
CREATE INDEX idx_ot_taller_fecha ON orden_trabajo(taller_id, fecha_ingreso);
CREATE INDEX idx_ot_mecanico ON orden_trabajo(mecanico_id);
CREATE INDEX idx_ot_vehiculo ON orden_trabajo(vehiculo_id);
CREATE INDEX idx_recordatorio_fecha ON recordatorio(fecha_envio);
CREATE INDEX idx_repuesto_codigo ON repuesto(codigo);
CREATE INDEX idx_repuesto_stock ON repuesto(stock_actual) WHERE stock_actual <= stock_minimo;
CREATE INDEX idx_cliente_rut ON cliente(rut);
CREATE INDEX idx_email_hist_tipo ON historial_email(tipo, created_at);

-- Suscripciones y planes
CREATE INDEX idx_suscripcion_taller ON suscripcion(taller_id);
CREATE INDEX idx_suscripcion_estado ON suscripcion(estado);
CREATE INDEX idx_suscripcion_proximo_cobro ON suscripcion(proximo_cobro) WHERE estado = 'activa';
CREATE INDEX idx_historial_pago_susc ON historial_pago_suscripcion(suscripcion_id, fecha_pago);
```

---

## 4. MÓDULOS DEL SISTEMA

### 4.1 Autenticación y Usuarios
```
Funcionalidades:
├── Login con email + password (JWT)
├── Refresh token (rotación automática)
├── Recuperación de contraseña por email
├── Roles y permisos granulares
├── Multi-taller (un usuario puede estar en varios talleres)
└── Invitación de usuarios por email
```

### 4.1b Planes y Suscripciones (SaaS Billing)
```
Planes disponibles:
├── 🆓 Free (Trial 14 días)
│   ├── 2 usuarios, 30 OTs/mes, 50 vehículos
│   ├── 500 MB almacenamiento
│   └── Sin facturación electrónica, WhatsApp ni portal
├── 🚀 Starter ($29.990 CLP/mes)
│   ├── 5 usuarios, 200 OTs/mes, 500 vehículos
│   ├── 5 GB almacenamiento
│   ├── Facturación electrónica ✅
│   ├── Portal del cliente ✅
│   └── Sin WhatsApp ni API
├── ⚡ Pro ($59.990 CLP/mes)
│   ├── 15 usuarios, OTs ilimitadas, vehículos ilimitados
│   ├── 50 GB almacenamiento
│   ├── Todas las funcionalidades ✅
│   ├── WhatsApp Business ✅
│   └── Reportes avanzados ✅
└── 🏢 Enterprise (Precio a medida)
    ├── Usuarios ilimitados, todo ilimitado
    ├── API access ✅
    ├── Soporte prioritario
    ├── Multi-sucursal
    └── SLA garantizado

Funcionalidades del módulo:
├── Registro de taller con trial automático (14 días)
├── Selección y cambio de plan
├── Pago mensual o anual (descuento ~15% anual)
├── Integración con pasarela de pago (Transbank/MercadoPago/Stripe)
├── Cobro automático recurrente
├── Historial completo de pagos
├── Alertas de vencimiento y cobro fallido
├── Período de gracia (3 días tras fallo de pago)
├── Cupones y códigos de descuento
├── Upgrade/downgrade de plan con prorrateo
├── Guard middleware: verificar límites del plan en cada request
│   ├── Antes de crear OT → verificar max_ots_mes
│   ├── Antes de crear usuario → verificar max_usuarios
│   ├── Antes de subir archivo → verificar max_storage_mb
│   └── Antes de usar feature → verificar flag del plan
├── Panel de billing para admin del taller
│   ├── Plan actual y uso (barras de progreso)
│   ├── Próximo cobro y monto
│   ├── Historial de facturas/pagos
│   ├── Cambiar plan / cancelar
│   └── Actualizar método de pago
└── Panel superadmin para gestionar planes y suscripciones
    ├── CRUD de planes y precios
    ├── Ver talleres por plan
    ├── Métricas: MRR, churn, LTV
    └── Forzar extensión/cancelación manual
```

### 4.2 Dashboard Gerencial
```
Métricas en tiempo real:
├── Ingresos del día / semana / mes
├── OTs activas por estado (gráfico circular)
├── Vehículos en taller ahora
├── Eficiencia de mecánicos (OTs completadas vs tiempo)
├── Top 5 servicios más solicitados
├── Alertas: stock bajo, OTs atrasadas, recordatorios pendientes
├── Ingresos proyectados (OTs en curso)
└── Comparativa mes actual vs anterior
```

### 4.3 Recepción Digital (Mobile First)
```
Flujo de recepción:
├── 1. Escanear patente (OCR) o buscar manualmente
│   ├── Si existe → cargar ficha del vehículo
│   └── Si no existe → crear vehículo + cliente nuevo
├── 2. Registrar km y nivel de combustible
├── 3. Checklist visual de daños
│   ├── Diagrama del vehículo (6 zonas)
│   ├── Marcar daños existentes vs nuevos
│   └── Foto por cada zona con daño
├── 4. Fotos generales del vehículo (mínimo 4)
├── 5. Motivo de ingreso (texto o dictado por voz)
├── 6. Firma digital del cliente (aceptación estado actual)
└── 7. Generar OT automáticamente
    └── Enviar confirmación por email/WhatsApp al cliente
```

### 4.4 Centro de Diagnóstico y Presupuesto
```
Funcionalidades:
├── Mecánico registra hallazgos (texto o voz)
├── Agregar fotos del diagnóstico
├── Convertir hallazgos a líneas de presupuesto
│   ├── Mano de obra (horas × tarifa)
│   └── Repuestos (buscar en inventario)
├── Generar PDF del presupuesto
├── Enviar por email y/o WhatsApp
├── Cliente aprueba desde portal (firma digital)
└── Historial de presupuestos por vehículo
```

### 4.5 Operaciones — Tablero Kanban
```
Columnas del tablero:
├── 📋 Diagnóstico
├── 💰 Esperando Aprobación
├── 📦 Esperando Repuestos
├── 🔧 En Reparación
├── ✅ Control de Calidad
└── 🏁 Listo para Entrega

Funcionalidades:
├── Drag & drop entre columnas
├── Asignar/reasignar mecánico
├── Timer por OT (tiempo en cada estado)
├── Filtros: mecánico, prioridad, fecha
├── Código de colores por prioridad
├── Alertas de OTs que llevan mucho tiempo
└── Cambio de estado actualiza portal del cliente en tiempo real
```

### 4.6 Inventario y Bodega
```
Funcionalidades:
├── Catálogo de repuestos y productos
│   ├── Código, nombre, categoría
│   ├── Precio compra / precio venta
│   ├── Stock actual / stock mínimo
│   └── Ubicación en bodega (estante/zona)
├── Alertas automáticas de stock bajo
├── Movimientos de stock (entrada/salida/ajuste)
├── Trazabilidad: qué repuesto fue a qué OT
├── Proveedores por repuesto
├── Órdenes de compra a proveedores
└── Reporte de rotación de inventario
```

### 4.7 Caja y Facturación
```
Funcionalidades:
├── Cobro de OT (parcial o total)
├── Múltiples métodos de pago
├── Cierre de caja diario
├── Facturación electrónica (SII Chile)
│   ├── Boleta electrónica
│   ├── Factura electrónica
│   └── Nota de crédito
├── Generación de PDF
├── Envío automático al cliente
└── Reportes de ingresos/egresos
```

### 4.8 CRM y Fidelización
```
Funcionalidades:
├── Ficha completa del cliente
│   ├── Datos personales
│   ├── Vehículos asociados
│   ├── Historial de OTs
│   └── Historial de pagos
├── Recordatorios automáticos
│   ├── Revisión técnica (30 días antes)
│   ├── Permiso de circulación (enero-febrero)
│   ├── SOAP (vencimiento)
│   └── Mantención preventiva (km/tiempo)
├── Portal del cliente (link único)
│   ├── Estado de la OT en tiempo real
│   ├── Fotos del proceso
│   ├── Aprobar presupuesto
│   └── Descargar factura
└── Campañas masivas (ej: "Promo cambio de aceite")
```

### 4.9 Herramientas Mecánico (Mobile)
```
Funcionalidades:
├── Ver OTs asignadas
├── Cambiar estado de OT
├── Dictado por voz para diagnósticos
├── Tomar fotos del proceso
├── Solicitar repuestos a bodega
├── Registrar horas trabajadas
└── Notificaciones push de nuevas asignaciones
```

---

## 5. SISTEMA DE CORREOS ELECTRÓNICOS

### Proveedor: SendGrid (o Nodemailer como fallback)

### 5.1 Tipos de Correo

| # | Tipo | Trigger | Destinatario | Template |
|---|---|---|---|---|
| 1 | **Bienvenida** | Nuevo cliente creado | Cliente | `welcome.hbs` |
| 2 | **Confirmación de Recepción** | OT creada en estado recepcion | Cliente | `ot_recepcion.hbs` |
| 3 | **Presupuesto** | Presupuesto generado | Cliente | `presupuesto.hbs` + PDF adjunto |
| 4 | **Presupuesto Aprobado** | Cliente aprueba por portal | Taller (admin) | `presupuesto_aprobado.hbs` |
| 5 | **OT en Reparación** | Estado → en_reparacion | Cliente | `ot_en_reparacion.hbs` |
| 6 | **OT Finalizada** | Estado → listo | Cliente | `ot_finalizada.hbs` + fotos + factura |
| 7 | **Factura/Boleta** | Factura emitida | Cliente | `factura.hbs` + PDF adjunto |
| 8 | **Recordatorio Rev. Técnica** | Cron: 30 días antes de vencimiento | Cliente | `recordatorio_rev_tecnica.hbs` |
| 9 | **Recordatorio Permiso Circ.** | Cron: enero (campana masiva) | Todos los clientes | `recordatorio_permiso.hbs` |
| 10 | **Recordatorio SOAP** | Cron: 30 días antes | Cliente | `recordatorio_soap.hbs` |
| 11 | **Recordatorio Mantención** | Cron: km proyectado o 6 meses | Cliente | `recordatorio_mantencion.hbs` |
| 12 | **Recuperar Contraseña** | Usuario solicita reset | Usuario | `reset_password.hbs` |
| 13 | **Invitación de Usuario** | Admin invita nuevo usuario | Invitado | `invitacion.hbs` |
| 14 | **Reporte Diario** | Cron: 8:00 AM | Admin taller | `reporte_diario.hbs` |
| 15 | **Marketing/Promoción** | Manual o programa | Clientes seleccionados | `promo_custom.hbs` |
| 16 | **Trial por Vencer** | Cron: 3 días antes de fin trial | Admin taller | `trial_expiring.hbs` |
| 17 | **Suscripción Activada** | Pago exitoso | Admin taller | `suscripcion_activa.hbs` |
| 18 | **Pago Fallido** | Cobro rechazado | Admin taller | `pago_fallido.hbs` |
| 19 | **Cuenta Suspendida** | 3 días sin pago | Admin taller | `cuenta_suspendida.hbs` |

### 5.2 Arquitectura del Sistema de Email

```
┌──────────────────────────────────────────────────┐
│              TRIGGER (Evento/Cron)                │
│  ej: OT cambia a estado "listo"                  │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│           EmailService (NestJS Module)            │
│                                                   │
│  1. Determinar template según tipo                │
│  2. Cargar datos del contexto (OT, cliente, etc.) │
│  3. Renderizar template con Handlebars            │
│  4. Adjuntar PDFs si aplica                       │
│  5. Encolar en BullMQ                             │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│              Bull Queue: "email-queue"             │
│                                                   │
│  - Reintentos automáticos (3 intentos)            │
│  - Delay entre reintentos (exponential backoff)   │
│  - Dead letter queue si falla 3 veces             │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│            SendGrid API / Nodemailer              │
│                                                   │
│  - Envío real del correo                          │
│  - Webhook de tracking (abierto/entregado)        │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│            historial_email (PostgreSQL)            │
│                                                   │
│  - Log de cada envío                              │
│  - Estado: enviado/entregado/fallido/abierto      │
│  - Tracking de apertura vía webhook               │
└──────────────────────────────────────────────────┘
```

### 5.3 Templates de Email (Handlebars)

Ejemplo de template `ot_finalizada.hbs`:
```html
<div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
  <div style="background: #1a1a2e; padding: 20px; text-align: center;">
    <img src="{{taller.logo_url}}" height="40" />
    <h2 style="color: #fff;">{{taller.nombre}}</h2>
  </div>
  
  <div style="padding: 30px; background: #fff;">
    <h3>¡Su vehículo está listo! 🎉</h3>
    <p>Estimado/a <strong>{{cliente.nombre}}</strong>,</p>
    <p>Le informamos que su <strong>{{vehiculo.marca}} {{vehiculo.modelo}}</strong> 
       (Patente: {{vehiculo.patente}}) ya está listo para ser retirado.</p>
    
    <h4>Resumen del trabajo:</h4>
    <table style="width:100%; border-collapse: collapse;">
      {{#each ot.detalles}}
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px;">{{this.descripcion}}</td>
        <td style="padding: 8px; text-align: right;">${{formatMoney this.subtotal}}</td>
      </tr>
      {{/each}}
      <tr style="font-weight: bold; border-top: 2px solid #333;">
        <td style="padding: 8px;">TOTAL</td>
        <td style="padding: 8px; text-align: right;">${{formatMoney ot.total}}</td>
      </tr>
    </table>

    {{#if fotos}}
    <h4>Fotos del proceso:</h4>
    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      {{#each fotos}}
      <img src="{{this.url}}" width="120" style="border-radius: 8px;" />
      {{/each}}
    </div>
    {{/if}}

    <a href="{{portal_url}}" style="display:inline-block;background:#6366f1;color:#fff;
       padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:20px;">
      Ver detalle completo
    </a>
  </div>
  
  <div style="background:#f5f5f5; padding:15px; text-align:center; font-size:12px; color:#666;">
    {{taller.nombre}} · {{taller.direccion}} · {{taller.telefono}}
  </div>
</div>
```

### 5.4 Cron Jobs para Recordatorios

```typescript
// Ejecutar todos los días a las 9:00 AM
@Cron('0 9 * * *')
async procesarRecordatorios() {
  const hoy = new Date();
  const en30Dias = addDays(hoy, 30);

  // 1. Revisión Técnica
  //    Último dígito de patente determina el mes de vencimiento
  const vehiculosRevTecnica = await this.vehiculoRepo.find({
    where: { rev_tecnica_vence: Between(hoy, en30Dias) }
  });
  for (const v of vehiculosRevTecnica) {
    await this.emailService.enviarRecordatorio('rev_tecnica', v);
  }

  // 2. SOAP
  const vehiculosSOAP = await this.vehiculoRepo.find({
    where: { soap_vence: Between(hoy, en30Dias) }
  });
  for (const v of vehiculosSOAP) {
    await this.emailService.enviarRecordatorio('soap', v);
  }

  // 3. Mantención preventiva
  //    Cada vehículo tiene un km_proxima_mantencion calculado
  const vehiculosMantencion = await this.vehiculoRepo.find({
    where: { km_proxima_mantencion: LessThanOrEqual(v.km_actual + 500) }
  });
  for (const v of vehiculosMantencion) {
    await this.emailService.enviarRecordatorio('mantencion', v);
  }

  // 4. Permiso de circulación (campaña masiva en enero-febrero)
  if (hoy.getMonth() === 0 || hoy.getMonth() === 1) {
    // Solo enviar una vez al mes por cliente
    await this.emailService.campanaPermisoCirculacion();
  }
}

// Cobros automáticos de suscripción — cada día a las 3:00 AM
@Cron('0 3 * * *')
async procesarCobrosSuscripcion() {
  const hoy = new Date();

  // 1. Cobrar suscripciones con proximo_cobro = hoy
  const suscripcionesACobrar = await this.suscripcionRepo.find({
    where: { proximo_cobro: LessThanOrEqual(hoy), estado: 'activa', auto_renovar: true }
  });
  for (const s of suscripcionesACobrar) {
    const resultado = await this.pagoService.cobrarRecurrente(s);
    if (resultado.exitoso) {
      s.proximo_cobro = s.periodo === 'mensual' ? addMonths(hoy, 1) : addYears(hoy, 1);
      s.fecha_fin = s.proximo_cobro;
      await this.suscripcionRepo.save(s);
      await this.emailService.enviar('suscripcion_activa', s);
    } else {
      await this.emailService.enviar('pago_fallido', s);
      // Periodo de gracia: 3 días
      if (daysSinceLastPayment(s) > 3) {
        s.estado = 'suspendida';
        await this.suscripcionRepo.save(s);
        await this.emailService.enviar('cuenta_suspendida', s);
      }
    }
  }

  // 2. Trials que vencen en 3 días
  const en3Dias = addDays(hoy, 3);
  const trialsExpirando = await this.suscripcionRepo.find({
    where: { estado: 'trial', trial_hasta: Between(hoy, en3Dias) }
  });
  for (const s of trialsExpirando) {
    await this.emailService.enviar('trial_expiring', s);
  }

  // 3. Trials vencidos → pasar a 'vencida'
  const trialsVencidos = await this.suscripcionRepo.find({
    where: { estado: 'trial', trial_hasta: LessThan(hoy) }
  });
  for (const s of trialsVencidos) {
    s.estado = 'vencida';
    await this.suscripcionRepo.save(s);
  }
}
```

---

## 6. INTEGRACIONES EXTERNAS

### 6.0 Pasarela de Pago (Suscripciones)
```
Opciones (Chile):
├── Transbank Webpay Plus (tarjetas en Chile)
├── MercadoPago (tarjetas + transferencia)
└── Stripe (internacional, tarjetas)

Flujo de cobro recurrente:
├── 1. Taller selecciona plan y completa checkout
├── 2. Pasarela tokeniza tarjeta (PCI DSS handled by provider)
├── 3. Backend guarda referencia del token (nunca la tarjeta)
├── 4. Cron diario cobra automáticamente al vencimiento
├── 5. Webhook de pasarela confirma pago exitoso/fallido
├── 6. Se actualiza suscripcion + historial_pago_susc
└── 7. Si falla → email de alerta → 3 días gracia → suspender
```

### 6.1 WhatsApp Business API
```
Mensajes automatizados:
├── Confirmación de recepción + link portal
├── Presupuesto listo (con PDF)
├── "Su vehículo está listo para retiro"
├── Recordatorios (rev. técnica, SOAP, mantención)
└── Campañas masivas con opt-in
```

### 6.2 Facturación Electrónica (SII Chile)
```
Integración:
├── Generación de DTE (Documento Tributario Electrónico)
│   ├── Boleta electrónica (33)
│   ├── Factura electrónica (34)
│   └── Nota de crédito (61)
├── Firma digital con certificado SII
├── Envío al SII y validación
├── PDF estandarizado con timbre electrónico
└── Almacenamiento de XML
```

### 6.3 Google Cloud Storage
```
Uso:
├── Fotos de peritaje/recepción (comprimidas)
├── Fotos del proceso de reparación
├── PDFs de presupuestos y facturas
├── Firmas digitales
├── Logo y branding del taller
└── Backup de documentos
```

---

## 7. FASES DE DESARROLLO

### FASE 1 — Fundamentos (Semanas 1-3)
```
Prioridad: CRÍTICA
├── [F1.1] Setup del proyecto (monorepo, Docker, CI)
├── [F1.2] Base de datos: migraciones, entidades, seeds
├── [F1.3] Auth: login, JWT, roles, guards
├── [F1.4] CRUD Usuarios + Talleres
├── [F1.5] CRUD Clientes
├── [F1.6] CRUD Vehículos (con patente como PK lógica)
├── [F1.7] Layout principal (sidebar, header, responsive)
├── [F1.8] Dashboard básico (placeholder con datos mock)
├── [F1.9] Planes y seed con planes iniciales (Free/Starter/Pro/Enterprise)
├── [F1.10] Suscripciones: registro con trial, guard de límites
└── Entregable: Login funcional + ABM + Trial con plan Free activo
```

### FASE 2 — Core del Taller (Semanas 4-6)
```
Prioridad: CRÍTICA
├── [F2.1] Órdenes de Trabajo (CRUD completo)
├── [F2.2] Recepción Digital (checklist, fotos, firma)
├── [F2.3] Tablero Kanban (drag & drop de estados)
├── [F2.4] Asignación de mecánicos
├── [F2.5] Diagnóstico (texto + fotos)
├── [F2.6] Presupuestos (generación + PDF)
├── [F2.7] Upload de archivos a Cloud Storage
├── [F2.8] Página de detalle de OT completa
└── Entregable: Flujo completo Recepción → Diagnóstico → Presupuesto → Kanban
```

### FASE 3 — Inventario y Facturación (Semanas 7-9)
```
Prioridad: ALTA
├── [F3.1] CRUD Repuestos/Productos
├── [F3.2] CRUD Proveedores
├── [F3.3] Movimientos de stock (entrada/salida)
├── [F3.4] Alertas de stock bajo
├── [F3.5] Trazabilidad repuesto → OT
├── [F3.6] Caja: cobros y métodos de pago
├── [F3.7] Cierre de caja diario
├── [F3.8] Integración facturación electrónica (SII)
└── Entregable: Inventario funcional + cobros + facturas
```

### FASE 4 — Comunicaciones (Semanas 10-11)
```
Prioridad: ALTA
├── [F4.1] Servicio de Email (SendGrid + templates)
├── [F4.2] Cola BullMQ para envíos
├── [F4.3] Templates: bienvenida, recepción, presupuesto,
│          OT finalizada, factura
├── [F4.4] Historial de emails con tracking
├── [F4.5] Motor de recordatorios (cron jobs)
│   ├── Revisión técnica
│   ├── SOAP
│   ├── Permiso de circulación
│   └── Mantención preventiva
├── [F4.6] Integración WhatsApp Business (básica)
└── Entregable: Emails automáticos + recordatorios + WhatsApp
```

### FASE 5 — Portal del Cliente + Mobile (Semanas 12-14)
```
Prioridad: MEDIA
├── [F5.1] Portal público del cliente (link único por OT)
│   ├── Estado en tiempo real
│   ├── Fotos del proceso
│   ├── Aprobar presupuesto con firma
│   └── Descargar factura
├── [F5.2] WebSocket para actualizaciones en vivo
├── [F5.3] Capacitor: build Android
├── [F5.4] Capacitor Camera (fotos nativas)
├── [F5.5] Dictado por voz (Web Speech API)
├── [F5.6] Escáner OCR de patentes (Tesseract.js)
├── [F5.7] Firma digital nativa
└── Entregable: Portal cliente + App Android funcional
```

### FASE 6 — Analytics y Optimización (Semanas 15-16)
```
Prioridad: MEDIA
├── [F6.1] Dashboard gerencial completo con gráficos
├── [F6.2] Reportes exportables (PDF/Excel)
│   ├── Ingresos por período
│   ├── Rendimiento por mecánico
│   ├── Rotación de inventario
│   └── Clientes top
├── [F6.3] CRM: segmentación de clientes
├── [F6.4] Campañas masivas de email
├── [F6.5] Notificaciones push (Capacitor)
├── [F6.6] Optimización de rendimiento
└── Entregable: Dashboard completo + reportes + CRM avanzado
```

---

## 8. SEGURIDAD Y PERMISOS

### Matriz de Permisos por Rol

| Módulo | Superadmin | Admin Taller | Recepcionista | Mecánico | Bodeguero | Cajero | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✅ Full | ✅ Full | ❌ | ❌ | ❌ | 📊 Caja | 👁️ |
| Usuarios | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Clientes | ✅ | ✅ | ✅ | 👁️ | ❌ | 👁️ | 👁️ |
| Vehículos | ✅ | ✅ | ✅ | 👁️ | ❌ | ❌ | 👁️ |
| Recepción | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| OTs | ✅ | ✅ | ✅ Crear | ✅ Asignadas | ❌ | 👁️ | 👁️ |
| Kanban | ✅ | ✅ | ✅ | ✅ Mover | ❌ | ❌ | 👁️ |
| Diagnóstico | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Presupuestos | ✅ | ✅ | ✅ | ✅ Crear | ❌ | ❌ | 👁️ |
| Inventario | ✅ | ✅ | ❌ | 📦 Pedir | ✅ | ❌ | 👁️ |
| Caja | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | 👁️ |
| Facturación | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | 👁️ |
| Reportes | ✅ | ✅ | ❌ | ❌ | ❌ | 📊 | 👁️ |
| Config | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Billing/Plan | ✅ | ✅ Pagar | ❌ | ❌ | ❌ | ❌ | ❌ |

### Medidas de Seguridad
```
├── JWT con refresh token rotation
├── Bcrypt para passwords (salt rounds: 12)
├── Rate limiting en login (5 intentos / 15 min)
├── CORS configurado por dominio
├── Helmet.js (headers de seguridad)
├── Input sanitization (class-validator + class-transformer)
├── Auditoría: log de cada acción crítica
├── Fotos: URLs firmadas con expiración (Cloud Storage)
├── Multi-tenancy: cada query filtrada por taller_id
└── HTTPS obligatorio en producción
```

---

## 9. DESPLIEGUE Y DEVOPS

### Desarrollo Local
```bash
# Levantar todo con Docker
docker-compose up -d  # PostgreSQL + Redis

# Backend
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev

# Mobile (Android)
npx cap sync android
npx cap open android
```

### Producción
```
├── Frontend: Vercel o Cloudflare Pages (SSG/SPA)
├── Backend: Google Cloud Run (contenedor NestJS)
├── Database: Cloud SQL (PostgreSQL managed)
├── Storage: Google Cloud Storage
├── Cache: Memorystore (Redis managed)
├── Domain: smartmec.cl
└── CI/CD: GitHub Actions
    ├── Lint + tests en PR
    ├── Build + deploy a staging en merge a develop
    └── Deploy a producción en merge a main
```

### Variables de Entorno Necesarias
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/smartmec
DATABASE_SSL=true

# Auth
JWT_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES_IN=7d

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=notificaciones@smartmec.cl
SENDGRID_FROM_NAME=Roadix

# Google Cloud Storage
GCS_BUCKET=smartmec-files
GCS_PROJECT_ID=smartmec-prod
GCS_KEY_FILE=./gcs-key.json

# WhatsApp Business
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_ID=...

# Facturación SII
SII_RUT_EMISOR=...
SII_CERTIFICADO_PATH=...
SII_CERTIFICADO_PASS=...
SII_AMBIENTE=certificacion  # o produccion

# Redis
REDIS_URL=redis://localhost:6379

# Pasarela de Pago (Suscripciones)
STRIPE_SECRET_KEY=sk_xxx            # o TRANSBANK / MERCADOPAGO
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_PRO=price_xxx

# App
APP_URL=https://app.smartmec.cl
PORTAL_URL=https://portal.smartmec.cl
```

---

## 10. GUÍA DE IMPLEMENTACIÓN PASO A PASO

> Esta sección detalla **exactamente** qué comandos ejecutar, qué archivos crear y en qué orden,
> para cada fase del desarrollo.

---

### 10.1 FASE 1 — Fundamentos

#### Paso 1: Inicializar el monorepo

```bash
# Desde la raíz del proyecto SmartMEC/
mkdir backend frontend shared

# Inicializar backend con NestJS
cd backend
npx @nestjs/cli new . --package-manager npm --skip-git
npm install @nestjs/config @nestjs/typeorm typeorm pg
npm install @nestjs/passport passport passport-jwt @nestjs/jwt
npm install bcrypt class-validator class-transformer
npm install @nestjs/schedule @nestjs/bull bull
npm install -D @types/passport-jwt @types/bcrypt

# Volver a la raíz e inicializar frontend con Vite + React
cd ..
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom@6 zustand @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install axios recharts @dnd-kit/core @dnd-kit/sortable
npm install -D tailwindcss @tailwindcss/vite

# Volver a la raíz
cd ..
```

#### Paso 2: Docker Compose (PostgreSQL + Redis)

Crear `docker-compose.yml` en la raíz:

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    container_name: smartmec-db
    environment:
      POSTGRES_DB: smartmec
      POSTGRES_USER: smartmec_user
      POSTGRES_PASSWORD: smartmec_dev_pass
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: smartmec-redis
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

```bash
# Levantar servicios
docker-compose up -d
```

#### Paso 3: Configuración del Backend (.env)

Crear `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=smartmec_user
DB_PASSWORD=smartmec_dev_pass
DB_DATABASE=smartmec

# Auth
JWT_SECRET=dev-secret-change-in-production-min-32-chars!!
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-prod-min-32!!
JWT_REFRESH_EXPIRES_IN=7d

# App
APP_URL=http://localhost:5173
PORT=3000
```

#### Paso 4: Configurar TypeORM en NestJS

Editar `backend/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // NUNCA true en producción
      }),
    }),
    // Aquí se irán agregando los módulos
  ],
})
export class AppModule {}
```

#### Paso 5: Crear entidades de base de datos

Orden de creación de entidades (respetar dependencias FK):

```
1. backend/src/database/entities/plan.entity.ts
2. backend/src/database/entities/taller.entity.ts
3. backend/src/database/entities/suscripcion.entity.ts
4. backend/src/database/entities/historial-pago-suscripcion.entity.ts
5. backend/src/database/entities/usuario.entity.ts
6. backend/src/database/entities/cliente.entity.ts
7. backend/src/database/entities/proveedor.entity.ts
8. backend/src/database/entities/mecanico.entity.ts
9. backend/src/database/entities/vehiculo.entity.ts
10. backend/src/database/entities/repuesto.entity.ts
11. backend/src/database/entities/orden-trabajo.entity.ts
12. backend/src/database/entities/ot-detalle.entity.ts
13. backend/src/database/entities/ot-foto.entity.ts
14. backend/src/database/entities/movimiento-stock.entity.ts
15. backend/src/database/entities/presupuesto.entity.ts
16. backend/src/database/entities/pago.entity.ts
17. backend/src/database/entities/factura.entity.ts
18. backend/src/database/entities/recordatorio.entity.ts
19. backend/src/database/entities/checklist-recepcion.entity.ts
20. backend/src/database/entities/historial-email.entity.ts
21. backend/src/database/entities/auditoria-log.entity.ts
```

Ejemplo de entidad `plan.entity.ts`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Suscripcion } from './suscripcion.entity';

@Entity('plan')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  nombre: string; // free, starter, pro, enterprise

  @Column({ type: 'decimal', precision: 10, scale: 0 })
  precio_mensual: number;

  @Column({ type: 'decimal', precision: 10, scale: 0 })
  precio_anual: number;

  @Column({ type: 'int' })
  max_usuarios: number;

  @Column({ type: 'int' })
  max_ots_mes: number;

  @Column({ type: 'int' })
  max_vehiculos: number;

  @Column({ type: 'int' })
  max_storage_mb: number;

  @Column({ default: false })
  tiene_facturacion: boolean;

  @Column({ default: false })
  tiene_whatsapp: boolean;

  @Column({ default: false })
  tiene_portal: boolean;

  @Column({ default: false })
  tiene_reportes: boolean;

  @Column({ default: false })
  tiene_api: boolean;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Suscripcion, (s) => s.plan)
  suscripciones: Suscripcion[];
}
```

#### Paso 6: Generar migración inicial

```bash
cd backend

# Agregar script en package.json
# "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js"
# "migration:generate": "npm run typeorm -- migration:generate -d src/config/data-source.ts"
# "migration:run": "npm run typeorm -- migration:run -d src/config/data-source.ts"

# Crear data-source.ts para CLI de TypeORM
# backend/src/config/data-source.ts
```

```typescript
// backend/src/config/data-source.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
});
```

```bash
# Generar la migración
npm run migration:generate -- src/database/migrations/InitialSchema

# Ejecutar la migración
npm run migration:run
```

#### Paso 7: Seed de planes iniciales

```bash
# Crear archivo de seed
# backend/src/database/seeds/planes.seed.ts
```

```typescript
// backend/src/database/seeds/planes.seed.ts
import { DataSource } from 'typeorm';
import { Plan } from '../entities/plan.entity';

export async function seedPlanes(dataSource: DataSource) {
  const repo = dataSource.getRepository(Plan);
  const planes = [
    {
      nombre: 'free',
      precio_mensual: 0,
      precio_anual: 0,
      max_usuarios: 2,
      max_ots_mes: 30,
      max_vehiculos: 50,
      max_storage_mb: 500,
      tiene_facturacion: false,
      tiene_whatsapp: false,
      tiene_portal: false,
      tiene_reportes: false,
      tiene_api: false,
    },
    {
      nombre: 'starter',
      precio_mensual: 29990,
      precio_anual: 305898, // ~15% descuento
      max_usuarios: 5,
      max_ots_mes: 200,
      max_vehiculos: 500,
      max_storage_mb: 5000,
      tiene_facturacion: true,
      tiene_whatsapp: false,
      tiene_portal: true,
      tiene_reportes: false,
      tiene_api: false,
    },
    {
      nombre: 'pro',
      precio_mensual: 59990,
      precio_anual: 611898,
      max_usuarios: 15,
      max_ots_mes: 999999,
      max_vehiculos: 999999,
      max_storage_mb: 50000,
      tiene_facturacion: true,
      tiene_whatsapp: true,
      tiene_portal: true,
      tiene_reportes: true,
      tiene_api: false,
    },
    {
      nombre: 'enterprise',
      precio_mensual: 0, // Precio a medida
      precio_anual: 0,
      max_usuarios: 999999,
      max_ots_mes: 999999,
      max_vehiculos: 999999,
      max_storage_mb: 999999,
      tiene_facturacion: true,
      tiene_whatsapp: true,
      tiene_portal: true,
      tiene_reportes: true,
      tiene_api: true,
    },
  ];

  for (const plan of planes) {
    const existe = await repo.findOneBy({ nombre: plan.nombre });
    if (!existe) {
      await repo.save(repo.create(plan));
    }
  }
}
```

#### Paso 8: Módulo de Auth (Login + JWT)

Estructura de archivos a crear:

```
backend/src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   └── jwt.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── decorators/
│   ├── current-user.decorator.ts
│   └── roles.decorator.ts
└── dto/
    ├── login.dto.ts
    ├── register.dto.ts
    └── refresh-token.dto.ts
```

Endpoints de Auth:

```
POST   /api/auth/login             → { email, password } → { accessToken, refreshToken }
POST   /api/auth/refresh           → { refreshToken }    → { accessToken, refreshToken }
POST   /api/auth/register          → { datos taller + usuario admin }
POST   /api/auth/forgot-password   → { email }
POST   /api/auth/reset-password    → { token, newPassword }
GET    /api/auth/me                → datos del usuario autenticado
```

#### Paso 9: Módulos CRUD (Usuarios, Talleres, Clientes, Vehículos)

Para cada módulo, crear la estructura estándar NestJS:

```
backend/src/modules/[nombre]/
├── [nombre].module.ts
├── [nombre].controller.ts
├── [nombre].service.ts
└── dto/
    ├── create-[nombre].dto.ts
    └── update-[nombre].dto.ts
```

Endpoints por módulo:

```
# Talleres
GET    /api/talleres/:id
PUT    /api/talleres/:id
PATCH  /api/talleres/:id/config

# Usuarios
GET    /api/usuarios
POST   /api/usuarios
GET    /api/usuarios/:id
PUT    /api/usuarios/:id
DELETE /api/usuarios/:id
POST   /api/usuarios/invitar        → enviar email de invitación

# Clientes
GET    /api/clientes                → con paginación y búsqueda
POST   /api/clientes
GET    /api/clientes/:id
PUT    /api/clientes/:id
DELETE /api/clientes/:id
GET    /api/clientes/:id/vehiculos
GET    /api/clientes/:id/ordenes

# Vehículos
GET    /api/vehiculos               → con búsqueda por patente
POST   /api/vehiculos
GET    /api/vehiculos/:id
PUT    /api/vehiculos/:id
GET    /api/vehiculos/:id/historial → OTs del vehículo
GET    /api/vehiculos/buscar/:patente
```

#### Paso 10: Frontend — Setup base

```bash
cd frontend
```

Configurar Tailwind CSS (`frontend/src/index.css`):

```css
@import "tailwindcss";
```

Estructura de carpetas frontend:

```
frontend/src/
├── components/
│   ├── ui/              → Button, Input, Modal, Card, Badge, Table
│   └── layout/          → Sidebar.tsx, Header.tsx, MainLayout.tsx
├── pages/
│   └── auth/            → LoginPage.tsx, ForgotPasswordPage.tsx
├── hooks/
│   └── useAuth.ts
├── services/
│   └── api.ts           → instancia de axios con interceptors
├── store/
│   └── authStore.ts     → Zustand store para auth
├── types/
│   └── index.ts         → interfaces compartidas
├── routes/
│   └── AppRouter.tsx    → React Router config con guards
├── App.tsx
└── main.tsx
```

Archivos clave a implementar:

**`frontend/src/services/api.ts`** — Cliente HTTP base:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Intentar refresh token
      // Si falla, redirigir a login
    }
    return Promise.reject(error);
  }
);

export default api;
```

**`frontend/src/store/authStore.ts`** — Estado de autenticación:
```typescript
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email, password) => { /* llamar API */ },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },
}));
```

**`frontend/src/routes/AppRouter.tsx`** — Rutas protegidas:
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../pages/auth/LoginPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/clientes" element={<ClientesPage />} />
                <Route path="/vehiculos" element={<VehiculosPage />} />
                {/* ... más rutas */}
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

#### Paso 11: Verificar Fase 1

```bash
# Terminal 1: Base de datos
docker-compose up -d

# Terminal 2: Backend
cd backend
npm run start:dev
# Verificar: http://localhost:3000/api → responde

# Terminal 3: Frontend
cd frontend
npm run dev
# Verificar: http://localhost:5173 → muestra login

# Tests manuales:
# 1. POST /api/auth/register → crear taller + admin
# 2. POST /api/auth/login → obtener tokens
# 3. GET /api/auth/me → datos del usuario
# 4. CRUD clientes y vehículos con token
# 5. Login desde el frontend
```

---

### 10.2 FASE 2 — Core del Taller

#### Paso 1: Módulo de Órdenes de Trabajo

```
backend/src/modules/ordenes-trabajo/
├── ordenes-trabajo.module.ts
├── ordenes-trabajo.controller.ts
├── ordenes-trabajo.service.ts
└── dto/
    ├── create-ot.dto.ts
    ├── update-ot.dto.ts
    ├── cambiar-estado.dto.ts
    └── asignar-mecanico.dto.ts
```

Endpoints:

```
POST   /api/ordenes-trabajo                  → crear OT (estado: recepcion)
GET    /api/ordenes-trabajo                  → listar con filtros (estado, mecánico, fecha)
GET    /api/ordenes-trabajo/:id              → detalle completo (con detalles, fotos, pagos)
PUT    /api/ordenes-trabajo/:id              → actualizar datos
PATCH  /api/ordenes-trabajo/:id/estado       → cambiar estado (validar transiciones)
PATCH  /api/ordenes-trabajo/:id/mecanico     → asignar mecánico
GET    /api/ordenes-trabajo/kanban           → agrupadas por estado (para tablero)
GET    /api/ordenes-trabajo/:id/portal/:token → datos públicos para portal cliente
```

Lógica de transición de estados (validar que sea secuencial):
```typescript
const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  recepcion:              ['diagnostico', 'cancelado'],
  diagnostico:            ['presupuesto', 'cancelado'],
  presupuesto:            ['esperando_aprobacion', 'cancelado'],
  esperando_aprobacion:   ['esperando_repuestos', 'en_reparacion', 'cancelado'],
  esperando_repuestos:    ['en_reparacion', 'cancelado'],
  en_reparacion:          ['control_calidad', 'cancelado'],
  control_calidad:        ['listo', 'en_reparacion'], // puede volver a reparación
  listo:                  ['entregado'],
  entregado:              ['facturado'],
  facturado:              [],
  cancelado:              [],
};
```

#### Paso 2: Recepción Digital

```
backend/src/modules/recepcion/
├── recepcion.module.ts
├── recepcion.controller.ts
├── recepcion.service.ts
└── dto/
    ├── checklist-item.dto.ts
    └── recepcion-completa.dto.ts
```

Endpoints:

```
POST   /api/recepcion/iniciar              → { patente, clienteId? } → crea OT + checklist
POST   /api/recepcion/:otId/checklist      → guardar items del checklist
POST   /api/recepcion/:otId/fotos          → upload múltiple de fotos (multipart)
POST   /api/recepcion/:otId/firma          → guardar firma digital (base64 → archivo)
POST   /api/recepcion/:otId/completar      → finaliza recepción, OT pasa a "diagnostico"
```

Frontend — Páginas a crear:

```
frontend/src/pages/recepcion/
├── RecepcionPage.tsx          → flujo paso a paso (wizard)
├── BuscarVehiculoStep.tsx     → buscar por patente o crear nuevo
├── DatosIngresoStep.tsx       → km, combustible, motivo
├── ChecklistStep.tsx          → diagrama del vehículo con zonas tocables
├── FotosStep.tsx              → cámara / upload de fotos
├── FirmaStep.tsx              → canvas de firma digital
└── ResumenStep.tsx            → resumen antes de confirmar
```

#### Paso 3: Tablero Kanban

Frontend:

```
frontend/src/pages/operaciones/
├── KanbanPage.tsx             → tablero con columnas
├── KanbanColumn.tsx           → columna individual (droppable)
├── KanbanCard.tsx             → tarjeta de OT (draggable)
└── KanbanFilters.tsx          → filtros: mecánico, prioridad, fecha
```

Implementación con `@dnd-kit`:

```typescript
// KanbanPage.tsx — estructura base
import { DndContext, DragEndEvent } from '@dnd-kit/core';

const COLUMNAS = [
  { id: 'diagnostico', titulo: '📋 Diagnóstico' },
  { id: 'esperando_aprobacion', titulo: '💰 Esperando Aprobación' },
  { id: 'esperando_repuestos', titulo: '📦 Esperando Repuestos' },
  { id: 'en_reparacion', titulo: '🔧 En Reparación' },
  { id: 'control_calidad', titulo: '✅ Control de Calidad' },
  { id: 'listo', titulo: '🏁 Listo para Entrega' },
];

function KanbanPage() {
  const { data: ordenes } = useQuery({ queryKey: ['kanban'], queryFn: fetchKanban });

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const otId = active.id;
    const nuevoEstado = over.id;
    await api.patch(`/ordenes-trabajo/${otId}/estado`, { estado: nuevoEstado });
    // invalidar query para refrescar
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4">
        {COLUMNAS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            titulo={col.titulo}
            ordenes={ordenes?.filter((ot) => ot.estado === col.id) || []}
          />
        ))}
      </div>
    </DndContext>
  );
}
```

#### Paso 4: Diagnóstico y Presupuestos

```
backend/src/modules/diagnosticos/
├── diagnosticos.module.ts
├── diagnosticos.controller.ts
├── diagnosticos.service.ts

backend/src/modules/presupuestos/
├── presupuestos.module.ts
├── presupuestos.controller.ts
├── presupuestos.service.ts
└── dto/
    ├── create-presupuesto.dto.ts
    └── item-presupuesto.dto.ts
```

Endpoints:

```
# Diagnóstico
PATCH  /api/ordenes-trabajo/:id/diagnostico   → { texto, fotos[] }

# Presupuestos
POST   /api/presupuestos                      → { otId, items[] }
GET    /api/presupuestos/:id
GET    /api/presupuestos/:id/pdf              → generar y descargar PDF
POST   /api/presupuestos/:id/enviar           → enviar por email al cliente
PATCH  /api/presupuestos/:id/aprobar          → cliente aprueba (desde portal)
```

#### Paso 5: Upload de archivos

```
backend/src/modules/archivos/
├── archivos.module.ts
├── archivos.controller.ts
└── archivos.service.ts         → Google Cloud Storage o disco local (dev)
```

```
POST   /api/archivos/upload       → multipart/form-data → retorna { url }
DELETE /api/archivos/:id
```

Para desarrollo local, guardar en `backend/uploads/` y servir con NestJS `ServeStaticModule`. En producción, subir a Google Cloud Storage.

#### Paso 6: Verificar Fase 2

```bash
# Tests manuales del flujo completo:
# 1. Crear cliente + vehículo
# 2. Iniciar recepción (buscar patente → checklist → fotos → firma)
# 3. OT aparece en Kanban en columna "Diagnóstico"
# 4. Escribir diagnóstico
# 5. Crear presupuesto con items
# 6. Generar PDF del presupuesto
# 7. Mover OT por las columnas del Kanban (drag & drop)
# 8. Verificar que estados cambian correctamente en BD
```

---

### 10.3 FASE 3 — Inventario y Facturación

#### Paso 1: Módulo de Inventario

```
backend/src/modules/inventario/
├── inventario.module.ts
├── inventario.controller.ts
├── inventario.service.ts
└── dto/
    ├── create-repuesto.dto.ts
    ├── movimiento-stock.dto.ts
    └── filtros-inventario.dto.ts

backend/src/modules/proveedores/
├── proveedores.module.ts
├── proveedores.controller.ts
├── proveedores.service.ts
```

Endpoints:

```
# Repuestos
GET    /api/repuestos                 → con búsqueda, filtro por categoría, stock bajo
POST   /api/repuestos
GET    /api/repuestos/:id
PUT    /api/repuestos/:id
GET    /api/repuestos/stock-bajo      → alertas de stock mínimo
GET    /api/repuestos/:id/movimientos → historial de movimientos

# Movimientos de stock
POST   /api/inventario/entrada        → entrada de mercadería
POST   /api/inventario/salida         → salida a OT
POST   /api/inventario/ajuste         → ajuste manual (inventario)

# Proveedores
GET    /api/proveedores
POST   /api/proveedores
GET    /api/proveedores/:id
PUT    /api/proveedores/:id
```

Frontend:

```
frontend/src/pages/inventario/
├── InventarioPage.tsx        → tabla con búsqueda y filtros
├── RepuestoForm.tsx          → crear/editar repuesto
├── MovimientosPage.tsx       → historial de movimientos
├── StockBajoAlert.tsx        → banner de alertas
└── EntradaStockModal.tsx     → registrar entrada de mercadería
```

#### Paso 2: Módulo de Caja

```
backend/src/modules/caja/
├── caja.module.ts
├── caja.controller.ts
├── caja.service.ts
└── dto/
    ├── registrar-pago.dto.ts
    └── cierre-caja.dto.ts
```

Endpoints:

```
POST   /api/caja/cobrar              → { otId, monto, metodoPago, referencia }
GET    /api/caja/movimientos         → movimientos del día con filtros
GET    /api/caja/cierre-diario       → resumen del día (totales por método)
POST   /api/caja/cerrar              → cierre formal del día
```

#### Paso 3: Facturación Electrónica (SII)

> **Nota**: Esta es la integración más compleja. Puede hacerse con un proveedor
> intermediario (como Haulmer, Bsale, o SimpleDTE) para no lidiar directamente con el SII.

```
backend/src/modules/facturacion/
├── facturacion.module.ts
├── facturacion.controller.ts
├── facturacion.service.ts
└── sii/
    ├── sii.service.ts            → comunicación con SII o proveedor
    ├── dte-builder.ts            → construir XML del DTE
    └── pdf-generator.ts          → generar PDF con timbre
```

Endpoints:

```
POST   /api/facturacion/boleta       → emitir boleta electrónica
POST   /api/facturacion/factura      → emitir factura electrónica
POST   /api/facturacion/nota-credito → anular/corregir DTE
GET    /api/facturacion/:id/pdf      → descargar PDF
GET    /api/facturacion/:id/xml      → descargar XML
GET    /api/facturacion              → listar facturas emitidas
```

---

### 10.4 FASE 4 — Comunicaciones

#### Paso 1: Servicio de Email

```
backend/src/modules/email/
├── email.module.ts
├── email.service.ts
├── email.processor.ts          → procesar cola BullMQ
└── templates/
    ├── layouts/
    │   └── base.hbs            → layout base HTML (header + footer)
    ├── welcome.hbs
    ├── ot_recepcion.hbs
    ├── presupuesto.hbs
    ├── ot_en_reparacion.hbs
    ├── ot_finalizada.hbs
    ├── factura.hbs
    ├── recordatorio_rev_tecnica.hbs
    ├── recordatorio_soap.hbs
    ├── recordatorio_permiso.hbs
    ├── recordatorio_mantencion.hbs
    ├── reset_password.hbs
    ├── invitacion.hbs
    ├── reporte_diario.hbs
    ├── trial_expiring.hbs
    ├── suscripcion_activa.hbs
    ├── pago_fallido.hbs
    ├── cuenta_suspendida.hbs
    └── promo_custom.hbs
```

Configurar BullMQ:

```typescript
// email.module.ts
@Module({
  imports: [
    BullModule.registerQueue({ name: 'email-queue' }),
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
```

```typescript
// email.service.ts — uso desde cualquier módulo
@Injectable()
export class EmailService {
  constructor(@InjectQueue('email-queue') private emailQueue: Queue) {}

  async enviar(tipo: string, destinatario: string, variables: Record<string, any>) {
    await this.emailQueue.add('send-email', {
      tipo,
      destinatario,
      variables,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }
}
```

#### Paso 2: Motor de Recordatorios

```
backend/src/modules/recordatorios/
├── recordatorios.module.ts
├── recordatorios.service.ts    → cron jobs de @nestjs/schedule
└── recordatorios.processor.ts
```

Cron jobs a implementar:

```
@Cron('0 9 * * *')    → Revisión técnica, SOAP, mantención (diario 9AM)
@Cron('0 3 * * *')    → Cobros de suscripción (diario 3AM)
@Cron('0 8 * * 1-5')  → Reporte diario al admin (lunes a viernes 8AM)
```

#### Paso 3: WhatsApp (Opcional)

```
backend/src/modules/whatsapp/
├── whatsapp.module.ts
├── whatsapp.service.ts          → API de WhatsApp Business Cloud
└── whatsapp.templates.ts        → templates aprobados por Meta
```

---

### 10.5 FASE 5 — Portal del Cliente + Mobile

#### Paso 1: Portal del Cliente

Acceso vía URL única sin login: `/portal/:token`

```
frontend/src/pages/portal/
├── PortalPage.tsx              → página pública (sin sidebar)
├── PortalEstado.tsx            → timeline visual del estado de la OT
├── PortalFotos.tsx             → galería de fotos del proceso
├── PortalPresupuesto.tsx       → ver y aprobar presupuesto + firma
└── PortalFactura.tsx           → descargar factura/boleta
```

Backend — WebSocket para actualizaciones en vivo:

```
backend/src/modules/portal-cliente/
├── portal-cliente.module.ts
├── portal-cliente.controller.ts   → endpoints públicos (sin auth)
└── portal-cliente.gateway.ts      → WebSocket gateway
```

```typescript
// portal-cliente.gateway.ts
@WebSocketGateway({ namespace: 'portal' })
export class PortalGateway {
  @WebSocketServer() server: Server;

  notificarCambioEstado(token: string, nuevoEstado: string) {
    this.server.to(token).emit('estado-actualizado', { estado: nuevoEstado });
  }
}
```

#### Paso 2: Capacitor (Mobile)

```bash
cd frontend

# Instalar Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init SmartMEC cl.smartmec.app --web-dir dist

# Agregar Android
npm install @capacitor/android
npx cap add android

# Plugins nativos
npm install @capacitor/camera    # Fotos
npm install @capacitor/haptics   # Vibración
npm install @capacitor/splash-screen

# Build y sincronizar
npm run build
npx cap sync android
npx cap open android              # Abre Android Studio
```

#### Paso 3: Funcionalidades Mobile

```
# OCR de patentes (Tesseract.js — corre en el browser/webview)
npm install tesseract.js

# Firma digital
npm install react-signature-canvas

# Dictado por voz (Web Speech API — nativo del browser)
# No requiere dependencia, es API del navegador
```

---

### 10.6 FASE 6 — Analytics y Optimización

#### Paso 1: Dashboard Gerencial

```
frontend/src/pages/dashboard/
├── DashboardPage.tsx
├── widgets/
│   ├── IngresosWidget.tsx       → gráfico de barras (diario/semanal/mensual)
│   ├── OTsPorEstadoWidget.tsx   → gráfico circular
│   ├── VehiculosEnTallerWidget.tsx
│   ├── EficienciaMecanicosWidget.tsx
│   ├── TopServiciosWidget.tsx
│   └── AlertasWidget.tsx        → stock bajo, OTs atrasadas
```

Backend — Endpoints de reportes:

```
GET /api/reportes/ingresos?desde=&hasta=&agrupacion=dia|semana|mes
GET /api/reportes/ots-por-estado
GET /api/reportes/eficiencia-mecanicos?desde=&hasta=
GET /api/reportes/top-servicios?limite=5
GET /api/reportes/rotacion-inventario
GET /api/reportes/clientes-top
GET /api/reportes/resumen-diario
```

#### Paso 2: Exportación de reportes

```bash
# Dependencia para generar Excel
cd backend
npm install exceljs

# PDF ya está con PDFKit o Puppeteer (instalado en Fase 2)
```

```
GET /api/reportes/ingresos/pdf?desde=&hasta=
GET /api/reportes/ingresos/excel?desde=&hasta=
```

---

### 10.7 CHECKLIST GENERAL DE VERIFICACIÓN

```
Para cada fase, verificar antes de pasar a la siguiente:

□ Backend compila sin errores (npm run build)
□ Frontend compila sin errores (npm run build)
□ Migraciones ejecutan correctamente
□ Todos los endpoints responden con datos correctos
□ Guards de auth bloquean acceso sin token
□ Multi-tenancy: datos filtrados por taller_id
□ Permisos: cada rol solo accede a lo permitido
□ Frontend navega correctamente entre páginas
□ Formularios validan datos antes de enviar
□ Manejo de errores: mensajes claros al usuario
```

### 10.8 COMANDOS ÚTILES — REFERENCIA RÁPIDA

```bash
# === DESARROLLO ===
docker-compose up -d                    # Levantar PostgreSQL + Redis
cd backend && npm run start:dev         # Backend en modo watch
cd frontend && npm run dev              # Frontend en modo dev

# === BASE DE DATOS ===
cd backend
npm run migration:generate -- src/database/migrations/NombreMigracion
npm run migration:run                   # Ejecutar migraciones pendientes
npm run seed                            # Ejecutar seeds (agregar script)

# === MOBILE ===
cd frontend
npm run build                           # Build de producción
npx cap sync android                    # Sincronizar con Android
npx cap open android                    # Abrir en Android Studio
npx cap run android                     # Ejecutar en dispositivo/emulador

# === PRODUCCIÓN ===
cd backend && npm run build             # Compilar TypeScript
cd frontend && npm run build            # Build optimizado
docker build -t smartmec-api ./backend  # Imagen Docker del backend
```

---

## 📊 RESUMEN EJECUTIVO

| Aspecto | Detalle |
|---|---|
| **Tablas de BD** | ~21 tablas principales |
| **Endpoints API** | ~120 endpoints estimados |
| **Templates de Email** | 19 tipos de correo |
| **Roles** | 7 roles con permisos granulares |
| **Estados OT** | 11 estados en flujo Kanban |
| **Fases de desarrollo** | 6 fases (~16 semanas) |
| **Integraciones** | SendGrid, WhatsApp, SII, GCS |
| **Plataformas** | Web + Android + iOS (Capacitor) |

---

*Plan generado para Roadix — Marzo 2026*
