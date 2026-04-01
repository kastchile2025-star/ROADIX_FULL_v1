# ðŸ› ï¸ ROADIX â€” Plan Completo de Desarrollo
## Sistema de GestiÃ³n Inteligente para Talleres MecÃ¡nicos y Automotrices
### "GestiÃ³n tÃ©cnica con inteligencia digital"

---

## ðŸ“‹ ÃNDICE
0. [Estrategia de Repositorio â€” Monorepo](#0-estrategia-de-repositorio--monorepo)
1. [Arquitectura General](#1-arquitectura-general)
2. [Stack TecnolÃ³gico](#2-stack-tecnolÃ³gico)
3. [Base de Datos (PostgreSQL)](#3-base-de-datos-postgresql)
4. [MÃ³dulos del Sistema](#4-mÃ³dulos-del-sistema)
5. [Sistema de Correos ElectrÃ³nicos](#5-sistema-de-correos-electrÃ³nicos)
6. [Integraciones Externas](#6-integraciones-externas)
7. [Fases de Desarrollo](#7-fases-de-desarrollo)
8. [Seguridad y Permisos](#8-seguridad-y-permisos)
9. [Despliegue y DevOps](#9-despliegue-y-devops)
10. [GuÃ­a de ImplementaciÃ³n Paso a Paso](#10-guÃ­a-de-implementaciÃ³n-paso-a-paso)

---

## 0. ESTRATEGIA DE REPOSITORIO â€” MONOREPO

Se utiliza un **monorepo** (un solo repositorio Git) que contiene tanto el frontend como el backend.

### JustificaciÃ³n
- Un solo `git clone` para tener todo el proyecto
- `docker-compose` levanta backend + frontend + PostgreSQL + Redis de una sola vez
- Cambios que afectan frontend y backend van en un solo commit/PR
- Tipos TypeScript compartidos entre frontend y backend (interfaces, DTOs)
- Despliegue coordinado desde un solo CI/CD pipeline

### Estructura del monorepo
```
ROADIX/
â”œâ”€â”€ backend/               # NestJS API
â”‚   â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ package.json
â”‚   â””â”€â”€ tsconfig.json
â”œâ”€â”€ frontend/              # React App (Vite)
â”‚   â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ package.json
â”‚   â””â”€â”€ tsconfig.json
â”œâ”€â”€ shared/                # Tipos e interfaces compartidos
â”‚   â””â”€â”€ types/
â”œâ”€â”€ docker-compose.yml     # PostgreSQL + Redis + API + Frontend
â”œâ”€â”€ .gitignore
â”œâ”€â”€ .env.example
â””â”€â”€ README.md
```

---

## 1. ARQUITECTURA GENERAL

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    CLIENTES / USUARIOS                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  ðŸ“± App MÃ³vil â”‚  ðŸ–¥ï¸ Web App  â”‚  ðŸ‘¤ Portal del Cliente          â”‚
â”‚  (Capacitor) â”‚  (React)     â”‚  (Link Ãºnico por OT)           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                   âš¡ API Gateway (NestJS)                      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Auth/JWT  â”‚ REST API â”‚ WebSocketâ”‚ Cron Jobsâ”‚ File Upload      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                   ðŸ’¾ PostgreSQL Database                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ ðŸ“¦ GCloud â”‚ ðŸ“§ Email â”‚ ðŸ’¬ WSP  â”‚ ðŸ“„ FacturaciÃ³n ElectrÃ³nica  â”‚
â”‚  Storage  â”‚ SendGrid â”‚  API    â”‚  (SII Chile)                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Estructura de Carpetas
```
SMART_MEC/
â”œâ”€â”€ src/                          # Frontend React + Tailwind
â”‚   â”œâ”€â”€ assets/                   # ImÃ¡genes, iconos, fuentes
â”‚   â”œâ”€â”€ components/               # Componentes reutilizables
â”‚   â”‚   â”œâ”€â”€ ui/                   # Botones, inputs, modals, cards
â”‚   â”‚   â”œâ”€â”€ layout/               # Sidebar, header, footer
â”‚   â”‚   â”œâ”€â”€ forms/                # Formularios complejos
â”‚   â”‚   â””â”€â”€ charts/               # GrÃ¡ficos del dashboard
â”‚   â”œâ”€â”€ pages/                    # PÃ¡ginas principales
â”‚   â”‚   â”œâ”€â”€ auth/                 # Login, registro, recuperaciÃ³n
â”‚   â”‚   â”œâ”€â”€ billing/              # Planes, suscripciÃ³n, pagos
â”‚   â”‚   â”œâ”€â”€ dashboard/            # Panel gerencial
â”‚   â”‚   â”œâ”€â”€ recepcion/            # RecepciÃ³n digital
â”‚   â”‚   â”œâ”€â”€ diagnostico/          # Centro de diagnÃ³stico
â”‚   â”‚   â”œâ”€â”€ operaciones/          # Tablero Kanban
â”‚   â”‚   â”œâ”€â”€ inventario/           # Stock y bodega
â”‚   â”‚   â”œâ”€â”€ caja/                 # FacturaciÃ³n y pagos
â”‚   â”‚   â”œâ”€â”€ clientes/             # CRM y fidelizaciÃ³n
â”‚   â”‚   â”œâ”€â”€ vehiculos/            # Fichas de vehÃ­culos
â”‚   â”‚   â”œâ”€â”€ mecanicos/            # GestiÃ³n de tÃ©cnicos
â”‚   â”‚   â”œâ”€â”€ reportes/             # Reportes y analytics
â”‚   â”‚   â””â”€â”€ configuracion/        # Ajustes del taller
â”‚   â”œâ”€â”€ hooks/                    # Custom hooks
â”‚   â”œâ”€â”€ services/                 # API calls (axios/fetch)
â”‚   â”œâ”€â”€ store/                    # Estado global (Zustand)
â”‚   â”œâ”€â”€ utils/                    # Helpers, formatters
â”‚   â”œâ”€â”€ types/                    # TypeScript types/interfaces
â”‚   â””â”€â”€ routes/                   # React Router config
â”‚
â”œâ”€â”€ backend/                      # NestJS API
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ modules/
â”‚   â”‚   â”‚   â”œâ”€â”€ auth/             # AutenticaciÃ³n JWT + roles
â”‚   â”‚   â”‚   â”œâ”€â”€ users/            # Usuarios del sistema
â”‚   â”‚   â”‚   â”œâ”€â”€ talleres/         # Multi-taller (SaaS ready)
â”‚   â”‚   â”‚   â”œâ”€â”€ planes/           # Planes y pricing
â”‚   â”‚   â”‚   â”œâ”€â”€ suscripciones/    # Suscripciones y cobros
â”‚   â”‚   â”‚   â”œâ”€â”€ clientes/         # Clientes del taller
â”‚   â”‚   â”‚   â”œâ”€â”€ vehiculos/        # VehÃ­culos
â”‚   â”‚   â”‚   â”œâ”€â”€ ordenes-trabajo/  # Ã“rdenes de trabajo (OT)
â”‚   â”‚   â”‚   â”œâ”€â”€ diagnosticos/     # DiagnÃ³sticos tÃ©cnicos
â”‚   â”‚   â”‚   â”œâ”€â”€ presupuestos/     # Cotizaciones/presupuestos
â”‚   â”‚   â”‚   â”œâ”€â”€ operaciones/      # Flujo Kanban
â”‚   â”‚   â”‚   â”œâ”€â”€ inventario/       # Stock de repuestos
â”‚   â”‚   â”‚   â”œâ”€â”€ proveedores/      # Proveedores
â”‚   â”‚   â”‚   â”œâ”€â”€ caja/             # Caja, cobros, pagos
â”‚   â”‚   â”‚   â”œâ”€â”€ facturacion/      # FacturaciÃ³n electrÃ³nica
â”‚   â”‚   â”‚   â”œâ”€â”€ mecanicos/        # TÃ©cnicos y asignaciones
â”‚   â”‚   â”‚   â”œâ”€â”€ email/            # Servicio de correos
â”‚   â”‚   â”‚   â”œâ”€â”€ whatsapp/         # IntegraciÃ³n WhatsApp
â”‚   â”‚   â”‚   â”œâ”€â”€ archivos/         # Upload de fotos/docs
â”‚   â”‚   â”‚   â”œâ”€â”€ recordatorios/    # Motor de alertas y cron
â”‚   â”‚   â”‚   â”œâ”€â”€ reportes/         # GeneraciÃ³n de reportes
â”‚   â”‚   â”‚   â””â”€â”€ portal-cliente/   # API pÃºblica para portal
â”‚   â”‚   â”œâ”€â”€ common/
â”‚   â”‚   â”‚   â”œâ”€â”€ guards/           # Auth guards, role guards
â”‚   â”‚   â”‚   â”œâ”€â”€ decorators/       # Custom decorators
â”‚   â”‚   â”‚   â”œâ”€â”€ interceptors/     # Logging, transform
â”‚   â”‚   â”‚   â”œâ”€â”€ filters/          # Exception filters
â”‚   â”‚   â”‚   â”œâ”€â”€ pipes/            # Validation pipes
â”‚   â”‚   â”‚   â””â”€â”€ dto/              # DTOs compartidos
â”‚   â”‚   â”œâ”€â”€ config/               # ConfiguraciÃ³n (env vars)
â”‚   â”‚   â””â”€â”€ database/
â”‚   â”‚       â”œâ”€â”€ entities/         # Entidades TypeORM
â”‚   â”‚       â”œâ”€â”€ migrations/       # Migraciones SQL
â”‚   â”‚       â””â”€â”€ seeds/            # Datos iniciales
â”‚   â””â”€â”€ test/
â”‚
â”œâ”€â”€ android/                      # Capacitor (auto-generado)
â”œâ”€â”€ ios/                          # Capacitor (auto-generado)
â”œâ”€â”€ docker-compose.yml            # PostgreSQL + Redis + API
â””â”€â”€ capacitor.config.ts           # Config Capacitor
```

---

## 2. STACK TECNOLÃ“GICO

### Frontend
| TecnologÃ­a | Uso |
|---|---|
| **React 18+** | SPA principal |
| **TypeScript** | Tipado estricto |
| **Tailwind CSS** | Estilos utility-first |
| **Zustand** | Estado global (ligero) |
| **React Router v6** | NavegaciÃ³n |
| **React Query (TanStack)** | Cache y sync de datos API |
| **React Hook Form + Zod** | Formularios + validaciÃ³n |
| **Recharts** | GrÃ¡ficos del dashboard |
| **@dnd-kit** | Drag & drop para Kanban |
| **Capacitor** | Empaquetado nativo (Android/iOS) |
| **Capacitor Camera** | Fotos de peritaje |
| **Capacitor Speech** | Dictado por voz |
| **SignaturePad** | Firma digital del cliente |
| **Tesseract.js** | OCR de patentes |

### Backend
| TecnologÃ­a | Uso |
|---|---|
| **NestJS** | Framework API (modular) |
| **TypeScript** | Tipado estricto |
| **TypeORM** | ORM para PostgreSQL |
| **Passport + JWT** | AutenticaciÃ³n |
| **class-validator** | ValidaciÃ³n de DTOs |
| **Bull/BullMQ** | Colas de trabajo (emails, cron) |
| **@nestjs/schedule** | Tareas programadas (recordatorios) |
| **Multer** | Upload de archivos |
| **PDFKit / Puppeteer** | GeneraciÃ³n de PDFs |
| **SendGrid / Nodemailer** | EnvÃ­o de correos |
| **Socket.io** | WebSocket para portal tiempo real |

### Infraestructura
| TecnologÃ­a | Uso |
|---|---|
| **PostgreSQL 16** | Base de datos principal |
| **Redis** | Cache + colas Bull |
| **Google Cloud Storage** | Fotos y documentos |
| **Docker** | Contenedores dev/prod |
| **Nginx** | Reverse proxy |

---

## 3. BASE DE DATOS (PostgreSQL)

### Diagrama Entidad-RelaciÃ³n

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚      PLAN        â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ id               â”‚
â”‚ nombre           â”‚  (free/starter/pro/enterprise)
â”‚ precio_mensual   â”‚  (CLP)
â”‚ precio_anual     â”‚  (CLP, descuento ~15%)
â”‚ max_usuarios     â”‚  (ej: 2, 5, 15, ilimitado)
â”‚ max_ots_mes      â”‚  (ej: 30, 200, ilimitado)
â”‚ max_vehiculos    â”‚  (ej: 50, 500, ilimitado)
â”‚ max_storage_mb   â”‚  (ej: 500, 5000, 50000)
â”‚ tiene_facturacion â”‚  (bool)
â”‚ tiene_whatsapp   â”‚  (bool)
â”‚ tiene_portal     â”‚  (bool)
â”‚ tiene_reportes   â”‚  (bool)
â”‚ tiene_api        â”‚  (bool)
â”‚ activo           â”‚
â”‚ created_at       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
         â”‚
         â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   SUSCRIPCION        â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ id                   â”‚
â”‚ taller_id FK â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â–º TALLER
â”‚ plan_id FK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â–º PLAN
â”‚ periodo              â”‚  (mensual/anual)
â”‚ estado               â”‚  (activa/trial/vencida/cancelada/suspendida)
â”‚ fecha_inicio         â”‚
â”‚ fecha_fin            â”‚  (renovaciÃ³n automÃ¡tica)
â”‚ trial_hasta          â”‚  (14 dÃ­as gratis)
â”‚ proximo_cobro        â”‚
â”‚ metodo_pago          â”‚
â”‚ referencia_pago      â”‚  (ID transacciÃ³n pasarela)
â”‚ monto_pagado         â”‚
â”‚ descuento_pct        â”‚  (cupones, promos)
â”‚ auto_renovar         â”‚  (bool, default true)
â”‚ cancelado_at         â”‚
â”‚ created_at           â”‚
â”‚ updated_at           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  HISTORIAL_PAGO_SUSC â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ id                   â”‚
â”‚ suscripcion_id FK    â”‚
â”‚ monto                â”‚
â”‚ metodo_pago          â”‚
â”‚ referencia           â”‚  (ID pasarela)
â”‚ estado               â”‚  (exitoso/fallido/pendiente/reembolsado)
â”‚ fecha_pago           â”‚
â”‚ periodo_desde        â”‚
â”‚ periodo_hasta        â”‚
â”‚ created_at           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   TALLER    â”‚â”€â”€â”€â”€<â”‚   USUARIO    â”‚     â”‚   PROVEEDOR      â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ id          â”‚     â”‚ id           â”‚     â”‚ id               â”‚
â”‚ nombre      â”‚     â”‚ taller_id FK â”‚     â”‚ taller_id FK     â”‚
â”‚ rut         â”‚     â”‚ nombre       â”‚     â”‚ razon_social     â”‚
â”‚ direccion   â”‚     â”‚ email        â”‚     â”‚ rut              â”‚
â”‚ telefono    â”‚     â”‚ password     â”‚     â”‚ contacto         â”‚
â”‚ logo_url    â”‚     â”‚ rol          â”‚     â”‚ email            â”‚
â”‚ config_json â”‚     â”‚ telefono     â”‚     â”‚ telefono         â”‚
â”‚ created_at  â”‚     â”‚ avatar_url   â”‚     â”‚ created_at       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â”‚ activo       â”‚     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                    â”‚ created_at   â”‚              â”‚
                    â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜              â”‚
                           â”‚                      â”‚
         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”‚
         â”‚                 â”‚                â”‚     â”‚
         â–¼                 â–¼                â–¼     â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   CLIENTE    â”‚  â”‚   MECANICO   â”‚  â”‚ REPUESTO/PRODUCTO â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚  â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚  â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ id           â”‚  â”‚ id           â”‚  â”‚ id                â”‚
â”‚ taller_id FK â”‚  â”‚ usuario_id FKâ”‚  â”‚ taller_id FK      â”‚
â”‚ nombre       â”‚  â”‚ taller_id FK â”‚  â”‚ proveedor_id FK   â”‚
â”‚ rut          â”‚  â”‚ especialidad â”‚  â”‚ codigo            â”‚
â”‚ email        â”‚  â”‚ tarifa_hora  â”‚  â”‚ nombre            â”‚
â”‚ telefono     â”‚  â”‚ activo       â”‚  â”‚ descripcion       â”‚
â”‚ direccion    â”‚  â”‚ created_at   â”‚  â”‚ categoria         â”‚
â”‚ tipo         â”‚  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚ precio_compra     â”‚
â”‚ created_at   â”‚         â”‚          â”‚ precio_venta      â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜         â”‚          â”‚ stock_actual      â”‚
       â”‚                 â”‚          â”‚ stock_minimo      â”‚
       â–¼                 â”‚          â”‚ ubicacion_bodega  â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”‚          â”‚ created_at        â”‚
â”‚  VEHICULO    â”‚         â”‚          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚         â”‚                    â”‚
â”‚ id           â”‚         â”‚                    â”‚
â”‚ cliente_id FKâ”‚         â”‚                    â”‚
â”‚ taller_id FK â”‚         â”‚                    â”‚
â”‚ patente      â”‚â—„â”€ OCR   â”‚                    â”‚
â”‚ marca        â”‚         â”‚                    â”‚
â”‚ modelo       â”‚         â”‚                    â”‚
â”‚ anio         â”‚         â”‚                    â”‚
â”‚ color        â”‚         â”‚                    â”‚
â”‚ vin          â”‚         â”‚                    â”‚
â”‚ tipo_vehiculoâ”‚         â”‚                    â”‚
â”‚ km_actual    â”‚         â”‚                    â”‚
â”‚ combustible  â”‚         â”‚                    â”‚
â”‚ rev_tecnica  â”‚    â—„â”€â”€ Recordatorio          â”‚
â”‚ permiso_circ â”‚    â—„â”€â”€ Recordatorio          â”‚
â”‚ soap_vence   â”‚    â—„â”€â”€ Recordatorio          â”‚
â”‚ foto_url     â”‚         â”‚                    â”‚
â”‚ notas        â”‚         â”‚                    â”‚
â”‚ created_at   â”‚         â”‚                    â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜         â”‚                    â”‚
       â”‚                 â”‚                    â”‚
       â–¼                 â”‚                    â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”‚                    â”‚
â”‚  ORDEN_TRABAJO   â”‚     â”‚                    â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚     â”‚                    â”‚
â”‚ id               â”‚     â”‚                    â”‚
â”‚ taller_id FK     â”‚     â”‚                    â”‚
â”‚ vehiculo_id FK   â”‚     â”‚                    â”‚
â”‚ cliente_id FK    â”‚     â”‚                    â”‚
â”‚ mecanico_id FK â”€â”€â”¼â”€â”€â”€â”€â”€â”˜                    â”‚
â”‚ numero_ot        â”‚ (Autoincremental)        â”‚
â”‚ estado           â”‚ (enum: ver abajo)        â”‚
â”‚ tipo_servicio    â”‚                          â”‚
â”‚ km_ingreso       â”‚                          â”‚
â”‚ combustible_ing  â”‚                          â”‚
â”‚ diagnostico      â”‚ â—„â”€â”€ Dictado por voz      â”‚
â”‚ observaciones    â”‚                          â”‚
â”‚ fecha_ingreso    â”‚                          â”‚
â”‚ fecha_prometida  â”‚                          â”‚
â”‚ fecha_entrega    â”‚                          â”‚
â”‚ prioridad        â”‚ (baja/media/alta/urgente)â”‚
â”‚ token_portal     â”‚ (UUID para portal clienteâ”‚
â”‚ subtotal         â”‚                          â”‚
â”‚ descuento        â”‚                          â”‚
â”‚ iva              â”‚                          â”‚
â”‚ total            â”‚                          â”‚
â”‚ firma_cliente_urlâ”‚ â—„â”€â”€ Firma digital        â”‚
â”‚ created_at       â”‚                          â”‚
â”‚ updated_at       â”‚                          â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                          â”‚
       â”‚                                      â”‚
       â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                   â”‚
       â”‚                  â”‚                   â”‚
       â–¼                  â–¼                   â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”‚
â”‚ OT_DETALLE     â”‚ â”‚ OT_FOTO        â”‚         â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚ â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚         â”‚
â”‚ id             â”‚ â”‚ id             â”‚         â”‚
â”‚ ot_id FK       â”‚ â”‚ ot_id FK       â”‚         â”‚
â”‚ tipo           â”‚ â”‚ url            â”‚         â”‚
â”‚  (mano_obra/   â”‚ â”‚ tipo           â”‚         â”‚
â”‚   repuesto)    â”‚ â”‚  (ingreso/     â”‚         â”‚
â”‚ repuesto_id FKâ”€â”¼â”€â”¼â”€proceso/       â”‚         â”‚
â”‚ descripcion    â”‚ â”‚  entrega/      â”‚         â”‚
â”‚ cantidad       â”‚ â”‚  dano)         â”‚         â”‚
â”‚ precio_unit    â”‚ â”‚ descripcion    â”‚         â”‚
â”‚ descuento      â”‚ â”‚ created_at     â”‚         â”‚
â”‚ subtotal       â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                            â”‚
       â”‚                                      â”‚
       â–¼                                      â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                        â”‚
â”‚ MOVIMIENTO_STOCK   â”‚                        â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                        â”‚
â”‚ id                 â”‚                        â”‚
â”‚ repuesto_id FK â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚ ot_detalle_id FK   â”‚
â”‚ tipo               â”‚ (entrada/salida/ajuste)
â”‚ cantidad           â”‚
â”‚ motivo             â”‚
â”‚ usuario_id FK      â”‚
â”‚ created_at         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   PRESUPUESTO    â”‚     â”‚   PAGO           â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ id               â”‚     â”‚ id               â”‚
â”‚ ot_id FK         â”‚     â”‚ ot_id FK         â”‚
â”‚ taller_id FK     â”‚     â”‚ taller_id FK     â”‚
â”‚ numero           â”‚     â”‚ monto            â”‚
â”‚ estado           â”‚     â”‚ metodo_pago      â”‚
â”‚  (borrador/      â”‚     â”‚  (efectivo/      â”‚
â”‚   enviado/       â”‚     â”‚   tarjeta/       â”‚
â”‚   aprobado/      â”‚     â”‚   transferencia) â”‚
â”‚   rechazado)     â”‚     â”‚ referencia       â”‚
â”‚ items_json       â”‚     â”‚ fecha_pago       â”‚
â”‚ subtotal         â”‚     â”‚ created_at       â”‚
â”‚ iva              â”‚     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚ total            â”‚
â”‚ pdf_url          â”‚     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ enviado_email    â”‚     â”‚   FACTURA        â”‚
â”‚ enviado_wsp      â”‚     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ aprobado_at      â”‚     â”‚ id               â”‚
â”‚ firma_url        â”‚     â”‚ ot_id FK         â”‚
â”‚ created_at       â”‚     â”‚ taller_id FK     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â”‚ numero_dte       â”‚
                         â”‚ tipo_dte         â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”‚  (boleta/factura)â”‚
â”‚  RECORDATORIO    â”‚     â”‚ rut_receptor     â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚     â”‚ xml_dte          â”‚
â”‚ id               â”‚     â”‚ pdf_url          â”‚
â”‚ taller_id FK     â”‚     â”‚ estado_sii       â”‚
â”‚ cliente_id FK    â”‚     â”‚ monto_neto       â”‚
â”‚ vehiculo_id FK   â”‚     â”‚ iva              â”‚
â”‚ tipo             â”‚     â”‚ monto_total      â”‚
â”‚  (rev_tecnica/   â”‚     â”‚ created_at       â”‚
â”‚   permiso_circ/  â”‚     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚   soap/          â”‚
â”‚   mantencion/    â”‚     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   seguimiento)   â”‚     â”‚  HISTORIAL_EMAIL â”‚
â”‚ mensaje          â”‚     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ fecha_envio      â”‚     â”‚ id               â”‚
â”‚ canal            â”‚     â”‚ taller_id FK     â”‚
â”‚  (email/wsp/     â”‚     â”‚ destinatario     â”‚
â”‚   ambos)         â”‚     â”‚ asunto           â”‚
â”‚ estado           â”‚     â”‚ tipo             â”‚
â”‚  (pendiente/     â”‚     â”‚  (presupuesto/   â”‚
â”‚   enviado/       â”‚     â”‚   ot_finalizada/ â”‚
â”‚   fallido)       â”‚     â”‚   recordatorio/  â”‚
â”‚ enviado_at       â”‚     â”‚   rev_tecnica/   â”‚
â”‚ created_at       â”‚     â”‚   bienvenida/    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â”‚   marketing)     â”‚
                         â”‚ template_usado   â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”‚ variables_json   â”‚
â”‚  CHECKLIST_RECEP â”‚     â”‚ estado           â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚     â”‚  (enviado/       â”‚
â”‚ id               â”‚     â”‚   entregado/     â”‚
â”‚ ot_id FK         â”‚     â”‚   fallido/       â”‚
â”‚ zona_vehiculo    â”‚     â”‚   abierto)       â”‚
â”‚  (frente/trasera/â”‚     â”‚ sendgrid_id      â”‚
â”‚   lat_izq/       â”‚     â”‚ abierto_at       â”‚
â”‚   lat_der/       â”‚     â”‚ created_at       â”‚
â”‚   techo/interior)â”‚     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚ estado           â”‚
â”‚  (ok/danio_prev/ â”‚     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   danio_nuevo)   â”‚     â”‚  AUDITORIA_LOG   â”‚
â”‚ foto_url         â”‚     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ notas            â”‚     â”‚ id               â”‚
â”‚ created_at       â”‚     â”‚ taller_id FK     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â”‚ usuario_id FK    â”‚
                         â”‚ accion           â”‚
                         â”‚ entidad          â”‚
                         â”‚ entidad_id       â”‚
                         â”‚ datos_antes      â”‚
                         â”‚ datos_despues    â”‚
                         â”‚ ip               â”‚
                         â”‚ created_at       â”‚
                         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Estados de la Orden de Trabajo (Flujo Kanban)
```
  RECEPCION â†’ DIAGNOSTICO â†’ PRESUPUESTO â†’ ESPERANDO_APROBACION
       â†“                                         â†“
  (checklist,                               (cliente aprueba
   fotos,                                    por portal/firma)
   km, combustible)                               â†“
                                        ESPERANDO_REPUESTOS
                                               â†“
                                         EN_REPARACION
                                               â†“
                                        CONTROL_CALIDAD
                                               â†“
                                             LISTO
                                               â†“
                                           ENTREGADO
                                               â†“
                                           FACTURADO
```

### Enums y Tipos Importantes
```sql
-- Roles de usuario
CREATE TYPE user_role AS ENUM (
  'superadmin',    -- Admin de la plataforma
  'admin_taller',  -- DueÃ±o/gerente del taller
  'recepcionista', -- RecepciÃ³n de vehÃ­culos
  'mecanico',      -- TÃ©cnico/mecÃ¡nico
  'bodeguero',     -- Control de inventario
  'cajero',        -- FacturaciÃ³n y cobros
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

-- Tipo de vehÃ­culo
CREATE TYPE tipo_vehiculo AS ENUM (
  'automovil', 'camioneta', 'suv', 'van', 'camion',
  'moto', 'bus', 'maquinaria', 'otro'
);

-- MÃ©todo de pago
CREATE TYPE metodo_pago AS ENUM (
  'efectivo', 'tarjeta_debito', 'tarjeta_credito',
  'transferencia', 'cheque', 'credito'
);

-- Estado de suscripciÃ³n
CREATE TYPE suscripcion_estado AS ENUM (
  'activa', 'trial', 'vencida', 'cancelada', 'suspendida'
);

-- Periodo de suscripciÃ³n
CREATE TYPE suscripcion_periodo AS ENUM ('mensual', 'anual');

-- Estado de pago de suscripciÃ³n
CREATE TYPE pago_suscripcion_estado AS ENUM (
  'exitoso', 'fallido', 'pendiente', 'reembolsado'
);
```

### Ãndices CrÃ­ticos
```sql
-- BÃºsquedas frecuentes
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

## 4. MÃ“DULOS DEL SISTEMA

### 4.1 AutenticaciÃ³n y Usuarios
```
Funcionalidades:
â”œâ”€â”€ Login con email + password (JWT)
â”œâ”€â”€ Refresh token (rotaciÃ³n automÃ¡tica)
â”œâ”€â”€ RecuperaciÃ³n de contraseÃ±a por email
â”œâ”€â”€ Roles y permisos granulares
â”œâ”€â”€ Multi-taller (un usuario puede estar en varios talleres)
â””â”€â”€ InvitaciÃ³n de usuarios por email
```

### 4.1b Planes y Suscripciones (SaaS Billing)
```
Planes disponibles:
â”œâ”€â”€ ðŸ†“ Free (Trial 14 dÃ­as)
â”‚   â”œâ”€â”€ 2 usuarios, 30 OTs/mes, 50 vehÃ­culos
â”‚   â”œâ”€â”€ 500 MB almacenamiento
â”‚   â””â”€â”€ Sin facturaciÃ³n electrÃ³nica, WhatsApp ni portal
â”œâ”€â”€ ðŸš€ Starter ($29.990 CLP/mes)
â”‚   â”œâ”€â”€ 5 usuarios, 200 OTs/mes, 500 vehÃ­culos
â”‚   â”œâ”€â”€ 5 GB almacenamiento
â”‚   â”œâ”€â”€ FacturaciÃ³n electrÃ³nica âœ…
â”‚   â”œâ”€â”€ Portal del cliente âœ…
â”‚   â””â”€â”€ Sin WhatsApp ni API
â”œâ”€â”€ âš¡ Pro ($59.990 CLP/mes)
â”‚   â”œâ”€â”€ 15 usuarios, OTs ilimitadas, vehÃ­culos ilimitados
â”‚   â”œâ”€â”€ 50 GB almacenamiento
â”‚   â”œâ”€â”€ Todas las funcionalidades âœ…
â”‚   â”œâ”€â”€ WhatsApp Business âœ…
â”‚   â””â”€â”€ Reportes avanzados âœ…
â””â”€â”€ ðŸ¢ Enterprise (Precio a medida)
    â”œâ”€â”€ Usuarios ilimitados, todo ilimitado
    â”œâ”€â”€ API access âœ…
    â”œâ”€â”€ Soporte prioritario
    â”œâ”€â”€ Multi-sucursal
    â””â”€â”€ SLA garantizado

Funcionalidades del mÃ³dulo:
â”œâ”€â”€ Registro de taller con trial automÃ¡tico (14 dÃ­as)
â”œâ”€â”€ SelecciÃ³n y cambio de plan
â”œâ”€â”€ Pago mensual o anual (descuento ~15% anual)
â”œâ”€â”€ IntegraciÃ³n con pasarela de pago (Transbank/MercadoPago/Stripe)
â”œâ”€â”€ Cobro automÃ¡tico recurrente
â”œâ”€â”€ Historial completo de pagos
â”œâ”€â”€ Alertas de vencimiento y cobro fallido
â”œâ”€â”€ PerÃ­odo de gracia (3 dÃ­as tras fallo de pago)
â”œâ”€â”€ Cupones y cÃ³digos de descuento
â”œâ”€â”€ Upgrade/downgrade de plan con prorrateo
â”œâ”€â”€ Guard middleware: verificar lÃ­mites del plan en cada request
â”‚   â”œâ”€â”€ Antes de crear OT â†’ verificar max_ots_mes
â”‚   â”œâ”€â”€ Antes de crear usuario â†’ verificar max_usuarios
â”‚   â”œâ”€â”€ Antes de subir archivo â†’ verificar max_storage_mb
â”‚   â””â”€â”€ Antes de usar feature â†’ verificar flag del plan
â”œâ”€â”€ Panel de billing para admin del taller
â”‚   â”œâ”€â”€ Plan actual y uso (barras de progreso)
â”‚   â”œâ”€â”€ PrÃ³ximo cobro y monto
â”‚   â”œâ”€â”€ Historial de facturas/pagos
â”‚   â”œâ”€â”€ Cambiar plan / cancelar
â”‚   â””â”€â”€ Actualizar mÃ©todo de pago
â””â”€â”€ Panel superadmin para gestionar planes y suscripciones
    â”œâ”€â”€ CRUD de planes y precios
    â”œâ”€â”€ Ver talleres por plan
    â”œâ”€â”€ MÃ©tricas: MRR, churn, LTV
    â””â”€â”€ Forzar extensiÃ³n/cancelaciÃ³n manual
```

### 4.2 Dashboard Gerencial
```
MÃ©tricas en tiempo real:
â”œâ”€â”€ Ingresos del dÃ­a / semana / mes
â”œâ”€â”€ OTs activas por estado (grÃ¡fico circular)
â”œâ”€â”€ VehÃ­culos en taller ahora
â”œâ”€â”€ Eficiencia de mecÃ¡nicos (OTs completadas vs tiempo)
â”œâ”€â”€ Top 5 servicios mÃ¡s solicitados
â”œâ”€â”€ Alertas: stock bajo, OTs atrasadas, recordatorios pendientes
â”œâ”€â”€ Ingresos proyectados (OTs en curso)
â””â”€â”€ Comparativa mes actual vs anterior
```

### 4.3 RecepciÃ³n Digital (Mobile First)
```
Flujo de recepciÃ³n:
â”œâ”€â”€ 1. Escanear patente (OCR) o buscar manualmente
â”‚   â”œâ”€â”€ Si existe â†’ cargar ficha del vehÃ­culo
â”‚   â””â”€â”€ Si no existe â†’ crear vehÃ­culo + cliente nuevo
â”œâ”€â”€ 2. Registrar km y nivel de combustible
â”œâ”€â”€ 3. Checklist visual de daÃ±os
â”‚   â”œâ”€â”€ Diagrama del vehÃ­culo (6 zonas)
â”‚   â”œâ”€â”€ Marcar daÃ±os existentes vs nuevos
â”‚   â””â”€â”€ Foto por cada zona con daÃ±o
â”œâ”€â”€ 4. Fotos generales del vehÃ­culo (mÃ­nimo 4)
â”œâ”€â”€ 5. Motivo de ingreso (texto o dictado por voz)
â”œâ”€â”€ 6. Firma digital del cliente (aceptaciÃ³n estado actual)
â””â”€â”€ 7. Generar OT automÃ¡ticamente
    â””â”€â”€ Enviar confirmaciÃ³n por email/WhatsApp al cliente
```

### 4.4 Centro de DiagnÃ³stico y Presupuesto
```
Funcionalidades:
â”œâ”€â”€ MecÃ¡nico registra hallazgos (texto o voz)
â”œâ”€â”€ Agregar fotos del diagnÃ³stico
â”œâ”€â”€ Convertir hallazgos a lÃ­neas de presupuesto
â”‚   â”œâ”€â”€ Mano de obra (horas Ã— tarifa)
â”‚   â””â”€â”€ Repuestos (buscar en inventario)
â”œâ”€â”€ Generar PDF del presupuesto
â”œâ”€â”€ Enviar por email y/o WhatsApp
â”œâ”€â”€ Cliente aprueba desde portal (firma digital)
â””â”€â”€ Historial de presupuestos por vehÃ­culo
```

### 4.5 Operaciones â€” Tablero Kanban
```
Columnas del tablero:
â”œâ”€â”€ ðŸ“‹ DiagnÃ³stico
â”œâ”€â”€ ðŸ’° Esperando AprobaciÃ³n
â”œâ”€â”€ ðŸ“¦ Esperando Repuestos
â”œâ”€â”€ ðŸ”§ En ReparaciÃ³n
â”œâ”€â”€ âœ… Control de Calidad
â””â”€â”€ ðŸ Listo para Entrega

Funcionalidades:
â”œâ”€â”€ Drag & drop entre columnas
â”œâ”€â”€ Asignar/reasignar mecÃ¡nico
â”œâ”€â”€ Timer por OT (tiempo en cada estado)
â”œâ”€â”€ Filtros: mecÃ¡nico, prioridad, fecha
â”œâ”€â”€ CÃ³digo de colores por prioridad
â”œâ”€â”€ Alertas de OTs que llevan mucho tiempo
â””â”€â”€ Cambio de estado actualiza portal del cliente en tiempo real
```

### 4.6 Inventario y Bodega
```
Funcionalidades:
â”œâ”€â”€ CatÃ¡logo de repuestos y productos
â”‚   â”œâ”€â”€ CÃ³digo, nombre, categorÃ­a
â”‚   â”œâ”€â”€ Precio compra / precio venta
â”‚   â”œâ”€â”€ Stock actual / stock mÃ­nimo
â”‚   â””â”€â”€ UbicaciÃ³n en bodega (estante/zona)
â”œâ”€â”€ Alertas automÃ¡ticas de stock bajo
â”œâ”€â”€ Movimientos de stock (entrada/salida/ajuste)
â”œâ”€â”€ Trazabilidad: quÃ© repuesto fue a quÃ© OT
â”œâ”€â”€ Proveedores por repuesto
â”œâ”€â”€ Ã“rdenes de compra a proveedores
â””â”€â”€ Reporte de rotaciÃ³n de inventario
```

### 4.7 Caja y FacturaciÃ³n
```
Funcionalidades:
â”œâ”€â”€ Cobro de OT (parcial o total)
â”œâ”€â”€ MÃºltiples mÃ©todos de pago
â”œâ”€â”€ Cierre de caja diario
â”œâ”€â”€ FacturaciÃ³n electrÃ³nica (SII Chile)
â”‚   â”œâ”€â”€ Boleta electrÃ³nica
â”‚   â”œâ”€â”€ Factura electrÃ³nica
â”‚   â””â”€â”€ Nota de crÃ©dito
â”œâ”€â”€ GeneraciÃ³n de PDF
â”œâ”€â”€ EnvÃ­o automÃ¡tico al cliente
â””â”€â”€ Reportes de ingresos/egresos
```

### 4.8 CRM y FidelizaciÃ³n
```
Funcionalidades:
â”œâ”€â”€ Ficha completa del cliente
â”‚   â”œâ”€â”€ Datos personales
â”‚   â”œâ”€â”€ VehÃ­culos asociados
â”‚   â”œâ”€â”€ Historial de OTs
â”‚   â””â”€â”€ Historial de pagos
â”œâ”€â”€ Recordatorios automÃ¡ticos
â”‚   â”œâ”€â”€ RevisiÃ³n tÃ©cnica (30 dÃ­as antes)
â”‚   â”œâ”€â”€ Permiso de circulaciÃ³n (enero-febrero)
â”‚   â”œâ”€â”€ SOAP (vencimiento)
â”‚   â””â”€â”€ MantenciÃ³n preventiva (km/tiempo)
â”œâ”€â”€ Portal del cliente (link Ãºnico)
â”‚   â”œâ”€â”€ Estado de la OT en tiempo real
â”‚   â”œâ”€â”€ Fotos del proceso
â”‚   â”œâ”€â”€ Aprobar presupuesto
â”‚   â””â”€â”€ Descargar factura
â””â”€â”€ CampaÃ±as masivas (ej: "Promo cambio de aceite")
```

### 4.9 Herramientas MecÃ¡nico (Mobile)
```
Funcionalidades:
â”œâ”€â”€ Ver OTs asignadas
â”œâ”€â”€ Cambiar estado de OT
â”œâ”€â”€ Dictado por voz para diagnÃ³sticos
â”œâ”€â”€ Tomar fotos del proceso
â”œâ”€â”€ Solicitar repuestos a bodega
â”œâ”€â”€ Registrar horas trabajadas
â””â”€â”€ Notificaciones push de nuevas asignaciones
```

---

## 5. SISTEMA DE CORREOS ELECTRÃ“NICOS

### Proveedor: SendGrid (o Nodemailer como fallback)

### 5.1 Tipos de Correo

| # | Tipo | Trigger | Destinatario | Template |
|---|---|---|---|---|
| 1 | **Bienvenida** | Nuevo cliente creado | Cliente | `welcome.hbs` |
| 2 | **ConfirmaciÃ³n de RecepciÃ³n** | OT creada en estado recepcion | Cliente | `ot_recepcion.hbs` |
| 3 | **Presupuesto** | Presupuesto generado | Cliente | `presupuesto.hbs` + PDF adjunto |
| 4 | **Presupuesto Aprobado** | Cliente aprueba por portal | Taller (admin) | `presupuesto_aprobado.hbs` |
| 5 | **OT en ReparaciÃ³n** | Estado â†’ en_reparacion | Cliente | `ot_en_reparacion.hbs` |
| 6 | **OT Finalizada** | Estado â†’ listo | Cliente | `ot_finalizada.hbs` + fotos + factura |
| 7 | **Factura/Boleta** | Factura emitida | Cliente | `factura.hbs` + PDF adjunto |
| 8 | **Recordatorio Rev. TÃ©cnica** | Cron: 30 dÃ­as antes de vencimiento | Cliente | `recordatorio_rev_tecnica.hbs` |
| 9 | **Recordatorio Permiso Circ.** | Cron: enero (campana masiva) | Todos los clientes | `recordatorio_permiso.hbs` |
| 10 | **Recordatorio SOAP** | Cron: 30 dÃ­as antes | Cliente | `recordatorio_soap.hbs` |
| 11 | **Recordatorio MantenciÃ³n** | Cron: km proyectado o 6 meses | Cliente | `recordatorio_mantencion.hbs` |
| 12 | **Recuperar ContraseÃ±a** | Usuario solicita reset | Usuario | `reset_password.hbs` |
| 13 | **InvitaciÃ³n de Usuario** | Admin invita nuevo usuario | Invitado | `invitacion.hbs` |
| 14 | **Reporte Diario** | Cron: 8:00 AM | Admin taller | `reporte_diario.hbs` |
| 15 | **Marketing/PromociÃ³n** | Manual o programa | Clientes seleccionados | `promo_custom.hbs` |
| 16 | **Trial por Vencer** | Cron: 3 dÃ­as antes de fin trial | Admin taller | `trial_expiring.hbs` |
| 17 | **SuscripciÃ³n Activada** | Pago exitoso | Admin taller | `suscripcion_activa.hbs` |
| 18 | **Pago Fallido** | Cobro rechazado | Admin taller | `pago_fallido.hbs` |
| 19 | **Cuenta Suspendida** | 3 dÃ­as sin pago | Admin taller | `cuenta_suspendida.hbs` |

### 5.2 Arquitectura del Sistema de Email

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              TRIGGER (Evento/Cron)                â”‚
â”‚  ej: OT cambia a estado "listo"                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚           EmailService (NestJS Module)            â”‚
â”‚                                                   â”‚
â”‚  1. Determinar template segÃºn tipo                â”‚
â”‚  2. Cargar datos del contexto (OT, cliente, etc.) â”‚
â”‚  3. Renderizar template con Handlebars            â”‚
â”‚  4. Adjuntar PDFs si aplica                       â”‚
â”‚  5. Encolar en BullMQ                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              Bull Queue: "email-queue"             â”‚
â”‚                                                   â”‚
â”‚  - Reintentos automÃ¡ticos (3 intentos)            â”‚
â”‚  - Delay entre reintentos (exponential backoff)   â”‚
â”‚  - Dead letter queue si falla 3 veces             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚            SendGrid API / Nodemailer              â”‚
â”‚                                                   â”‚
â”‚  - EnvÃ­o real del correo                          â”‚
â”‚  - Webhook de tracking (abierto/entregado)        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚            historial_email (PostgreSQL)            â”‚
â”‚                                                   â”‚
â”‚  - Log de cada envÃ­o                              â”‚
â”‚  - Estado: enviado/entregado/fallido/abierto      â”‚
â”‚  - Tracking de apertura vÃ­a webhook               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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
    <h3>Â¡Su vehÃ­culo estÃ¡ listo! ðŸŽ‰</h3>
    <p>Estimado/a <strong>{{cliente.nombre}}</strong>,</p>
    <p>Le informamos que su <strong>{{vehiculo.marca}} {{vehiculo.modelo}}</strong> 
       (Patente: {{vehiculo.patente}}) ya estÃ¡ listo para ser retirado.</p>
    
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
    {{taller.nombre}} Â· {{taller.direccion}} Â· {{taller.telefono}}
  </div>
</div>
```

### 5.4 Cron Jobs para Recordatorios

```typescript
// Ejecutar todos los dÃ­as a las 9:00 AM
@Cron('0 9 * * *')
async procesarRecordatorios() {
  const hoy = new Date();
  const en30Dias = addDays(hoy, 30);

  // 1. RevisiÃ³n TÃ©cnica
  //    Ãšltimo dÃ­gito de patente determina el mes de vencimiento
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

  // 3. MantenciÃ³n preventiva
  //    Cada vehÃ­culo tiene un km_proxima_mantencion calculado
  const vehiculosMantencion = await this.vehiculoRepo.find({
    where: { km_proxima_mantencion: LessThanOrEqual(v.km_actual + 500) }
  });
  for (const v of vehiculosMantencion) {
    await this.emailService.enviarRecordatorio('mantencion', v);
  }

  // 4. Permiso de circulaciÃ³n (campaÃ±a masiva en enero-febrero)
  if (hoy.getMonth() === 0 || hoy.getMonth() === 1) {
    // Solo enviar una vez al mes por cliente
    await this.emailService.campanaPermisoCirculacion();
  }
}

// Cobros automÃ¡ticos de suscripciÃ³n â€” cada dÃ­a a las 3:00 AM
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
      // Periodo de gracia: 3 dÃ­as
      if (daysSinceLastPayment(s) > 3) {
        s.estado = 'suspendida';
        await this.suscripcionRepo.save(s);
        await this.emailService.enviar('cuenta_suspendida', s);
      }
    }
  }

  // 2. Trials que vencen en 3 dÃ­as
  const en3Dias = addDays(hoy, 3);
  const trialsExpirando = await this.suscripcionRepo.find({
    where: { estado: 'trial', trial_hasta: Between(hoy, en3Dias) }
  });
  for (const s of trialsExpirando) {
    await this.emailService.enviar('trial_expiring', s);
  }

  // 3. Trials vencidos â†’ pasar a 'vencida'
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
â”œâ”€â”€ Transbank Webpay Plus (tarjetas en Chile)
â”œâ”€â”€ MercadoPago (tarjetas + transferencia)
â””â”€â”€ Stripe (internacional, tarjetas)

Flujo de cobro recurrente:
â”œâ”€â”€ 1. Taller selecciona plan y completa checkout
â”œâ”€â”€ 2. Pasarela tokeniza tarjeta (PCI DSS handled by provider)
â”œâ”€â”€ 3. Backend guarda referencia del token (nunca la tarjeta)
â”œâ”€â”€ 4. Cron diario cobra automÃ¡ticamente al vencimiento
â”œâ”€â”€ 5. Webhook de pasarela confirma pago exitoso/fallido
â”œâ”€â”€ 6. Se actualiza suscripcion + historial_pago_susc
â””â”€â”€ 7. Si falla â†’ email de alerta â†’ 3 dÃ­as gracia â†’ suspender
```

### 6.1 WhatsApp Business API
```
Mensajes automatizados:
â”œâ”€â”€ ConfirmaciÃ³n de recepciÃ³n + link portal
â”œâ”€â”€ Presupuesto listo (con PDF)
â”œâ”€â”€ "Su vehÃ­culo estÃ¡ listo para retiro"
â”œâ”€â”€ Recordatorios (rev. tÃ©cnica, SOAP, mantenciÃ³n)
â””â”€â”€ CampaÃ±as masivas con opt-in
```

### 6.2 FacturaciÃ³n ElectrÃ³nica (SII Chile)
```
IntegraciÃ³n:
â”œâ”€â”€ GeneraciÃ³n de DTE (Documento Tributario ElectrÃ³nico)
â”‚   â”œâ”€â”€ Boleta electrÃ³nica (33)
â”‚   â”œâ”€â”€ Factura electrÃ³nica (34)
â”‚   â””â”€â”€ Nota de crÃ©dito (61)
â”œâ”€â”€ Firma digital con certificado SII
â”œâ”€â”€ EnvÃ­o al SII y validaciÃ³n
â”œâ”€â”€ PDF estandarizado con timbre electrÃ³nico
â””â”€â”€ Almacenamiento de XML
```

### 6.3 Google Cloud Storage
```
Uso:
â”œâ”€â”€ Fotos de peritaje/recepciÃ³n (comprimidas)
â”œâ”€â”€ Fotos del proceso de reparaciÃ³n
â”œâ”€â”€ PDFs de presupuestos y facturas
â”œâ”€â”€ Firmas digitales
â”œâ”€â”€ Logo y branding del taller
â””â”€â”€ Backup de documentos
```

---

## 7. FASES DE DESARROLLO

### FASE 1 â€” Fundamentos (Semanas 1-3)
```
Prioridad: CRÃTICA
â”œâ”€â”€ [F1.1] Setup del proyecto (monorepo, Docker, CI)
â”œâ”€â”€ [F1.2] Base de datos: migraciones, entidades, seeds
â”œâ”€â”€ [F1.3] Auth: login, JWT, roles, guards
â”œâ”€â”€ [F1.4] CRUD Usuarios + Talleres
â”œâ”€â”€ [F1.5] CRUD Clientes
â”œâ”€â”€ [F1.6] CRUD VehÃ­culos (con patente como PK lÃ³gica)
â”œâ”€â”€ [F1.7] Layout principal (sidebar, header, responsive)
â”œâ”€â”€ [F1.8] Dashboard bÃ¡sico (placeholder con datos mock)
â”œâ”€â”€ [F1.9] Planes y seed con planes iniciales (Free/Starter/Pro/Enterprise)
â”œâ”€â”€ [F1.10] Suscripciones: registro con trial, guard de lÃ­mites
â””â”€â”€ Entregable: Login funcional + ABM + Trial con plan Free activo
```

### FASE 2 â€” Core del Taller (Semanas 4-6)
```
Prioridad: CRÃTICA
â”œâ”€â”€ [F2.1] Ã“rdenes de Trabajo (CRUD completo)
â”œâ”€â”€ [F2.2] RecepciÃ³n Digital (checklist, fotos, firma)
â”œâ”€â”€ [F2.3] Tablero Kanban (drag & drop de estados)
â”œâ”€â”€ [F2.4] AsignaciÃ³n de mecÃ¡nicos
â”œâ”€â”€ [F2.5] DiagnÃ³stico (texto + fotos)
â”œâ”€â”€ [F2.6] Presupuestos (generaciÃ³n + PDF)
â”œâ”€â”€ [F2.7] Upload de archivos a Cloud Storage
â”œâ”€â”€ [F2.8] PÃ¡gina de detalle de OT completa
â””â”€â”€ Entregable: Flujo completo RecepciÃ³n â†’ DiagnÃ³stico â†’ Presupuesto â†’ Kanban
```

### FASE 3 â€” Inventario y FacturaciÃ³n (Semanas 7-9)
```
Prioridad: ALTA
â”œâ”€â”€ [F3.1] CRUD Repuestos/Productos
â”œâ”€â”€ [F3.2] CRUD Proveedores
â”œâ”€â”€ [F3.3] Movimientos de stock (entrada/salida)
â”œâ”€â”€ [F3.4] Alertas de stock bajo
â”œâ”€â”€ [F3.5] Trazabilidad repuesto â†’ OT
â”œâ”€â”€ [F3.6] Caja: cobros y mÃ©todos de pago
â”œâ”€â”€ [F3.7] Cierre de caja diario
â”œâ”€â”€ [F3.8] IntegraciÃ³n facturaciÃ³n electrÃ³nica (SII)
â””â”€â”€ Entregable: Inventario funcional + cobros + facturas
```

### FASE 4 â€” Comunicaciones (Semanas 10-11)
```
Prioridad: ALTA
â”œâ”€â”€ [F4.1] Servicio de Email (SendGrid + templates)
â”œâ”€â”€ [F4.2] Cola BullMQ para envÃ­os
â”œâ”€â”€ [F4.3] Templates: bienvenida, recepciÃ³n, presupuesto,
â”‚          OT finalizada, factura
â”œâ”€â”€ [F4.4] Historial de emails con tracking
â”œâ”€â”€ [F4.5] Motor de recordatorios (cron jobs)
â”‚   â”œâ”€â”€ RevisiÃ³n tÃ©cnica
â”‚   â”œâ”€â”€ SOAP
â”‚   â”œâ”€â”€ Permiso de circulaciÃ³n
â”‚   â””â”€â”€ MantenciÃ³n preventiva
â”œâ”€â”€ [F4.6] IntegraciÃ³n WhatsApp Business (bÃ¡sica)
â””â”€â”€ Entregable: Emails automÃ¡ticos + recordatorios + WhatsApp
```

### FASE 5 â€” Portal del Cliente + Mobile (Semanas 12-14)
```
Prioridad: MEDIA
â”œâ”€â”€ [F5.1] Portal pÃºblico del cliente (link Ãºnico por OT)
â”‚   â”œâ”€â”€ Estado en tiempo real
â”‚   â”œâ”€â”€ Fotos del proceso
â”‚   â”œâ”€â”€ Aprobar presupuesto con firma
â”‚   â””â”€â”€ Descargar factura
â”œâ”€â”€ [F5.2] WebSocket para actualizaciones en vivo
â”œâ”€â”€ [F5.3] Capacitor: build Android
â”œâ”€â”€ [F5.4] Capacitor Camera (fotos nativas)
â”œâ”€â”€ [F5.5] Dictado por voz (Web Speech API)
â”œâ”€â”€ [F5.6] EscÃ¡ner OCR de patentes (Tesseract.js)
â”œâ”€â”€ [F5.7] Firma digital nativa
â””â”€â”€ Entregable: Portal cliente + App Android funcional
```

### FASE 6 â€” Analytics y OptimizaciÃ³n (Semanas 15-16)
```
Prioridad: MEDIA
â”œâ”€â”€ [F6.1] Dashboard gerencial completo con grÃ¡ficos
â”œâ”€â”€ [F6.2] Reportes exportables (PDF/Excel)
â”‚   â”œâ”€â”€ Ingresos por perÃ­odo
â”‚   â”œâ”€â”€ Rendimiento por mecÃ¡nico
â”‚   â”œâ”€â”€ RotaciÃ³n de inventario
â”‚   â””â”€â”€ Clientes top
â”œâ”€â”€ [F6.3] CRM: segmentaciÃ³n de clientes
â”œâ”€â”€ [F6.4] CampaÃ±as masivas de email
â”œâ”€â”€ [F6.5] Notificaciones push (Capacitor)
â”œâ”€â”€ [F6.6] OptimizaciÃ³n de rendimiento
â””â”€â”€ Entregable: Dashboard completo + reportes + CRM avanzado
```

---

## 8. SEGURIDAD Y PERMISOS

### Matriz de Permisos por Rol

| MÃ³dulo | Superadmin | Admin Taller | Recepcionista | MecÃ¡nico | Bodeguero | Cajero | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard | âœ… Full | âœ… Full | âŒ | âŒ | âŒ | ðŸ“Š Caja | ðŸ‘ï¸ |
| Usuarios | âœ… | âœ… | âŒ | âŒ | âŒ | âŒ | âŒ |
| Clientes | âœ… | âœ… | âœ… | ðŸ‘ï¸ | âŒ | ðŸ‘ï¸ | ðŸ‘ï¸ |
| VehÃ­culos | âœ… | âœ… | âœ… | ðŸ‘ï¸ | âŒ | âŒ | ðŸ‘ï¸ |
| RecepciÃ³n | âœ… | âœ… | âœ… | âŒ | âŒ | âŒ | âŒ |
| OTs | âœ… | âœ… | âœ… Crear | âœ… Asignadas | âŒ | ðŸ‘ï¸ | ðŸ‘ï¸ |
| Kanban | âœ… | âœ… | âœ… | âœ… Mover | âŒ | âŒ | ðŸ‘ï¸ |
| DiagnÃ³stico | âœ… | âœ… | âŒ | âœ… | âŒ | âŒ | âŒ |
| Presupuestos | âœ… | âœ… | âœ… | âœ… Crear | âŒ | âŒ | ðŸ‘ï¸ |
| Inventario | âœ… | âœ… | âŒ | ðŸ“¦ Pedir | âœ… | âŒ | ðŸ‘ï¸ |
| Caja | âœ… | âœ… | âŒ | âŒ | âŒ | âœ… | ðŸ‘ï¸ |
| FacturaciÃ³n | âœ… | âœ… | âŒ | âŒ | âŒ | âœ… | ðŸ‘ï¸ |
| Reportes | âœ… | âœ… | âŒ | âŒ | âŒ | ðŸ“Š | ðŸ‘ï¸ |
| Config | âœ… | âœ… | âŒ | âŒ | âŒ | âŒ | âŒ |
| Billing/Plan | âœ… | âœ… Pagar | âŒ | âŒ | âŒ | âŒ | âŒ |

### Medidas de Seguridad
```
â”œâ”€â”€ JWT con refresh token rotation
â”œâ”€â”€ Bcrypt para passwords (salt rounds: 12)
â”œâ”€â”€ Rate limiting en login (5 intentos / 15 min)
â”œâ”€â”€ CORS configurado por dominio
â”œâ”€â”€ Helmet.js (headers de seguridad)
â”œâ”€â”€ Input sanitization (class-validator + class-transformer)
â”œâ”€â”€ AuditorÃ­a: log de cada acciÃ³n crÃ­tica
â”œâ”€â”€ Fotos: URLs firmadas con expiraciÃ³n (Cloud Storage)
â”œâ”€â”€ Multi-tenancy: cada query filtrada por taller_id
â””â”€â”€ HTTPS obligatorio en producciÃ³n
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

### ProducciÃ³n
```
â”œâ”€â”€ Frontend: Vercel o Cloudflare Pages (SSG/SPA)
â”œâ”€â”€ Backend: Google Cloud Run (contenedor NestJS)
â”œâ”€â”€ Database: Cloud SQL (PostgreSQL managed)
â”œâ”€â”€ Storage: Google Cloud Storage
â”œâ”€â”€ Cache: Memorystore (Redis managed)
â”œâ”€â”€ Domain: roadix.cl
â””â”€â”€ CI/CD: GitHub Actions
    â”œâ”€â”€ Lint + tests en PR
    â”œâ”€â”€ Build + deploy a staging en merge a develop
    â””â”€â”€ Deploy a producciÃ³n en merge a main
```

### Variables de Entorno Necesarias
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/roadix
DATABASE_SSL=true

# Auth
JWT_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES_IN=7d

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=notificaciones@roadix.cl
SENDGRID_FROM_NAME=Roadix

# Google Cloud Storage
GCS_BUCKET=roadix-files
GCS_PROJECT_ID=roadix-prod
GCS_KEY_FILE=./gcs-key.json

# WhatsApp Business
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_ID=...

# FacturaciÃ³n SII
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
APP_URL=https://app.roadix.cl
PORTAL_URL=https://portal.roadix.cl
```

---

## 10. GUÃA DE IMPLEMENTACIÃ“N PASO A PASO

> Esta secciÃ³n detalla **exactamente** quÃ© comandos ejecutar, quÃ© archivos crear y en quÃ© orden,
> para cada fase del desarrollo.

---

### 10.1 FASE 1 â€” Fundamentos

#### Paso 1: Inicializar el monorepo

```bash
# Desde la raÃ­z del proyecto ROADIX/
mkdir backend frontend shared

# Inicializar backend con NestJS
cd backend
npx @nestjs/cli new . --package-manager npm --skip-git
npm install @nestjs/config @nestjs/typeorm typeorm pg
npm install @nestjs/passport passport passport-jwt @nestjs/jwt
npm install bcrypt class-validator class-transformer
npm install @nestjs/schedule @nestjs/bull bull
npm install -D @types/passport-jwt @types/bcrypt

# Volver a la raÃ­z e inicializar frontend con Vite + React
cd ..
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom@6 zustand @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install axios recharts @dnd-kit/core @dnd-kit/sortable
npm install -D tailwindcss @tailwindcss/vite

# Volver a la raÃ­z
cd ..
```

#### Paso 2: Docker Compose (PostgreSQL + Redis)

Crear `docker-compose.yml` en la raÃ­z:

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    container_name: roadix-db
    environment:
      POSTGRES_DB: roadix
      POSTGRES_USER: roadix_user
      POSTGRES_PASSWORD: roadix_dev_pass
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: roadix-redis
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

```bash
# Levantar servicios
docker-compose up -d
```

#### Paso 3: ConfiguraciÃ³n del Backend (.env)

Crear `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=roadix_user
DB_PASSWORD=roadix_dev_pass
DB_DATABASE=roadix

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
        synchronize: false, // NUNCA true en producciÃ³n
      }),
    }),
    // AquÃ­ se irÃ¡n agregando los mÃ³dulos
  ],
})
export class AppModule {}
```

#### Paso 5: Crear entidades de base de datos

Orden de creaciÃ³n de entidades (respetar dependencias FK):

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

#### Paso 6: Generar migraciÃ³n inicial

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
# Generar la migraciÃ³n
npm run migration:generate -- src/database/migrations/InitialSchema

# Ejecutar la migraciÃ³n
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

#### Paso 8: MÃ³dulo de Auth (Login + JWT)

Estructura de archivos a crear:

```
backend/src/modules/auth/
â”œâ”€â”€ auth.module.ts
â”œâ”€â”€ auth.controller.ts
â”œâ”€â”€ auth.service.ts
â”œâ”€â”€ strategies/
â”‚   â””â”€â”€ jwt.strategy.ts
â”œâ”€â”€ guards/
â”‚   â”œâ”€â”€ jwt-auth.guard.ts
â”‚   â””â”€â”€ roles.guard.ts
â”œâ”€â”€ decorators/
â”‚   â”œâ”€â”€ current-user.decorator.ts
â”‚   â””â”€â”€ roles.decorator.ts
â””â”€â”€ dto/
    â”œâ”€â”€ login.dto.ts
    â”œâ”€â”€ register.dto.ts
    â””â”€â”€ refresh-token.dto.ts
```

Endpoints de Auth:

```
POST   /api/auth/login             â†’ { email, password } â†’ { accessToken, refreshToken }
POST   /api/auth/refresh           â†’ { refreshToken }    â†’ { accessToken, refreshToken }
POST   /api/auth/register          â†’ { datos taller + usuario admin }
POST   /api/auth/forgot-password   â†’ { email }
POST   /api/auth/reset-password    â†’ { token, newPassword }
GET    /api/auth/me                â†’ datos del usuario autenticado
```

#### Paso 9: MÃ³dulos CRUD (Usuarios, Talleres, Clientes, VehÃ­culos)

Para cada mÃ³dulo, crear la estructura estÃ¡ndar NestJS:

```
backend/src/modules/[nombre]/
â”œâ”€â”€ [nombre].module.ts
â”œâ”€â”€ [nombre].controller.ts
â”œâ”€â”€ [nombre].service.ts
â””â”€â”€ dto/
    â”œâ”€â”€ create-[nombre].dto.ts
    â””â”€â”€ update-[nombre].dto.ts
```

Endpoints por mÃ³dulo:

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
POST   /api/usuarios/invitar        â†’ enviar email de invitaciÃ³n

# Clientes
GET    /api/clientes                â†’ con paginaciÃ³n y bÃºsqueda
POST   /api/clientes
GET    /api/clientes/:id
PUT    /api/clientes/:id
DELETE /api/clientes/:id
GET    /api/clientes/:id/vehiculos
GET    /api/clientes/:id/ordenes

# VehÃ­culos
GET    /api/vehiculos               â†’ con bÃºsqueda por patente
POST   /api/vehiculos
GET    /api/vehiculos/:id
PUT    /api/vehiculos/:id
GET    /api/vehiculos/:id/historial â†’ OTs del vehÃ­culo
GET    /api/vehiculos/buscar/:patente
```

#### Paso 10: Frontend â€” Setup base

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
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ ui/              â†’ Button, Input, Modal, Card, Badge, Table
â”‚   â””â”€â”€ layout/          â†’ Sidebar.tsx, Header.tsx, MainLayout.tsx
â”œâ”€â”€ pages/
â”‚   â””â”€â”€ auth/            â†’ LoginPage.tsx, ForgotPasswordPage.tsx
â”œâ”€â”€ hooks/
â”‚   â””â”€â”€ useAuth.ts
â”œâ”€â”€ services/
â”‚   â””â”€â”€ api.ts           â†’ instancia de axios con interceptors
â”œâ”€â”€ store/
â”‚   â””â”€â”€ authStore.ts     â†’ Zustand store para auth
â”œâ”€â”€ types/
â”‚   â””â”€â”€ index.ts         â†’ interfaces compartidas
â”œâ”€â”€ routes/
â”‚   â””â”€â”€ AppRouter.tsx    â†’ React Router config con guards
â”œâ”€â”€ App.tsx
â””â”€â”€ main.tsx
```

Archivos clave a implementar:

**`frontend/src/services/api.ts`** â€” Cliente HTTP base:
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

**`frontend/src/store/authStore.ts`** â€” Estado de autenticaciÃ³n:
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

**`frontend/src/routes/AppRouter.tsx`** â€” Rutas protegidas:
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
                {/* ... mÃ¡s rutas */}
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
# Verificar: http://localhost:3000/api â†’ responde

# Terminal 3: Frontend
cd frontend
npm run dev
# Verificar: http://localhost:5173 â†’ muestra login

# Tests manuales:
# 1. POST /api/auth/register â†’ crear taller + admin
# 2. POST /api/auth/login â†’ obtener tokens
# 3. GET /api/auth/me â†’ datos del usuario
# 4. CRUD clientes y vehÃ­culos con token
# 5. Login desde el frontend
```

---

### 10.2 FASE 2 â€” Core del Taller

#### Paso 1: MÃ³dulo de Ã“rdenes de Trabajo

```
backend/src/modules/ordenes-trabajo/
â”œâ”€â”€ ordenes-trabajo.module.ts
â”œâ”€â”€ ordenes-trabajo.controller.ts
â”œâ”€â”€ ordenes-trabajo.service.ts
â””â”€â”€ dto/
    â”œâ”€â”€ create-ot.dto.ts
    â”œâ”€â”€ update-ot.dto.ts
    â”œâ”€â”€ cambiar-estado.dto.ts
    â””â”€â”€ asignar-mecanico.dto.ts
```

Endpoints:

```
POST   /api/ordenes-trabajo                  â†’ crear OT (estado: recepcion)
GET    /api/ordenes-trabajo                  â†’ listar con filtros (estado, mecÃ¡nico, fecha)
GET    /api/ordenes-trabajo/:id              â†’ detalle completo (con detalles, fotos, pagos)
PUT    /api/ordenes-trabajo/:id              â†’ actualizar datos
PATCH  /api/ordenes-trabajo/:id/estado       â†’ cambiar estado (validar transiciones)
PATCH  /api/ordenes-trabajo/:id/mecanico     â†’ asignar mecÃ¡nico
GET    /api/ordenes-trabajo/kanban           â†’ agrupadas por estado (para tablero)
GET    /api/ordenes-trabajo/:id/portal/:token â†’ datos pÃºblicos para portal cliente
```

LÃ³gica de transiciÃ³n de estados (validar que sea secuencial):
```typescript
const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  recepcion:              ['diagnostico', 'cancelado'],
  diagnostico:            ['presupuesto', 'cancelado'],
  presupuesto:            ['esperando_aprobacion', 'cancelado'],
  esperando_aprobacion:   ['esperando_repuestos', 'en_reparacion', 'cancelado'],
  esperando_repuestos:    ['en_reparacion', 'cancelado'],
  en_reparacion:          ['control_calidad', 'cancelado'],
  control_calidad:        ['listo', 'en_reparacion'], // puede volver a reparaciÃ³n
  listo:                  ['entregado'],
  entregado:              ['facturado'],
  facturado:              [],
  cancelado:              [],
};
```

#### Paso 2: RecepciÃ³n Digital

```
backend/src/modules/recepcion/
â”œâ”€â”€ recepcion.module.ts
â”œâ”€â”€ recepcion.controller.ts
â”œâ”€â”€ recepcion.service.ts
â””â”€â”€ dto/
    â”œâ”€â”€ checklist-item.dto.ts
    â””â”€â”€ recepcion-completa.dto.ts
```

Endpoints:

```
POST   /api/recepcion/iniciar              â†’ { patente, clienteId? } â†’ crea OT + checklist
POST   /api/recepcion/:otId/checklist      â†’ guardar items del checklist
POST   /api/recepcion/:otId/fotos          â†’ upload mÃºltiple de fotos (multipart)
POST   /api/recepcion/:otId/firma          â†’ guardar firma digital (base64 â†’ archivo)
POST   /api/recepcion/:otId/completar      â†’ finaliza recepciÃ³n, OT pasa a "diagnostico"
```

Frontend â€” PÃ¡ginas a crear:

```
frontend/src/pages/recepcion/
â”œâ”€â”€ RecepcionPage.tsx          â†’ flujo paso a paso (wizard)
â”œâ”€â”€ BuscarVehiculoStep.tsx     â†’ buscar por patente o crear nuevo
â”œâ”€â”€ DatosIngresoStep.tsx       â†’ km, combustible, motivo
â”œâ”€â”€ ChecklistStep.tsx          â†’ diagrama del vehÃ­culo con zonas tocables
â”œâ”€â”€ FotosStep.tsx              â†’ cÃ¡mara / upload de fotos
â”œâ”€â”€ FirmaStep.tsx              â†’ canvas de firma digital
â””â”€â”€ ResumenStep.tsx            â†’ resumen antes de confirmar
```

#### Paso 3: Tablero Kanban

Frontend:

```
frontend/src/pages/operaciones/
â”œâ”€â”€ KanbanPage.tsx             â†’ tablero con columnas
â”œâ”€â”€ KanbanColumn.tsx           â†’ columna individual (droppable)
â”œâ”€â”€ KanbanCard.tsx             â†’ tarjeta de OT (draggable)
â””â”€â”€ KanbanFilters.tsx          â†’ filtros: mecÃ¡nico, prioridad, fecha
```

ImplementaciÃ³n con `@dnd-kit`:

```typescript
// KanbanPage.tsx â€” estructura base
import { DndContext, DragEndEvent } from '@dnd-kit/core';

const COLUMNAS = [
  { id: 'diagnostico', titulo: 'ðŸ“‹ DiagnÃ³stico' },
  { id: 'esperando_aprobacion', titulo: 'ðŸ’° Esperando AprobaciÃ³n' },
  { id: 'esperando_repuestos', titulo: 'ðŸ“¦ Esperando Repuestos' },
  { id: 'en_reparacion', titulo: 'ðŸ”§ En ReparaciÃ³n' },
  { id: 'control_calidad', titulo: 'âœ… Control de Calidad' },
  { id: 'listo', titulo: 'ðŸ Listo para Entrega' },
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

#### Paso 4: DiagnÃ³stico y Presupuestos

```
backend/src/modules/diagnosticos/
â”œâ”€â”€ diagnosticos.module.ts
â”œâ”€â”€ diagnosticos.controller.ts
â”œâ”€â”€ diagnosticos.service.ts

backend/src/modules/presupuestos/
â”œâ”€â”€ presupuestos.module.ts
â”œâ”€â”€ presupuestos.controller.ts
â”œâ”€â”€ presupuestos.service.ts
â””â”€â”€ dto/
    â”œâ”€â”€ create-presupuesto.dto.ts
    â””â”€â”€ item-presupuesto.dto.ts
```

Endpoints:

```
# DiagnÃ³stico
PATCH  /api/ordenes-trabajo/:id/diagnostico   â†’ { texto, fotos[] }

# Presupuestos
POST   /api/presupuestos                      â†’ { otId, items[] }
GET    /api/presupuestos/:id
GET    /api/presupuestos/:id/pdf              â†’ generar y descargar PDF
POST   /api/presupuestos/:id/enviar           â†’ enviar por email al cliente
PATCH  /api/presupuestos/:id/aprobar          â†’ cliente aprueba (desde portal)
```

#### Paso 5: Upload de archivos

```
backend/src/modules/archivos/
â”œâ”€â”€ archivos.module.ts
â”œâ”€â”€ archivos.controller.ts
â””â”€â”€ archivos.service.ts         â†’ Google Cloud Storage o disco local (dev)
```

```
POST   /api/archivos/upload       â†’ multipart/form-data â†’ retorna { url }
DELETE /api/archivos/:id
```

Para desarrollo local, guardar en `backend/uploads/` y servir con NestJS `ServeStaticModule`. En producciÃ³n, subir a Google Cloud Storage.

#### Paso 6: Verificar Fase 2

```bash
# Tests manuales del flujo completo:
# 1. Crear cliente + vehÃ­culo
# 2. Iniciar recepciÃ³n (buscar patente â†’ checklist â†’ fotos â†’ firma)
# 3. OT aparece en Kanban en columna "DiagnÃ³stico"
# 4. Escribir diagnÃ³stico
# 5. Crear presupuesto con items
# 6. Generar PDF del presupuesto
# 7. Mover OT por las columnas del Kanban (drag & drop)
# 8. Verificar que estados cambian correctamente en BD
```

---

### 10.3 FASE 3 â€” Inventario y FacturaciÃ³n

#### Paso 1: MÃ³dulo de Inventario

```
backend/src/modules/inventario/
â”œâ”€â”€ inventario.module.ts
â”œâ”€â”€ inventario.controller.ts
â”œâ”€â”€ inventario.service.ts
â””â”€â”€ dto/
    â”œâ”€â”€ create-repuesto.dto.ts
    â”œâ”€â”€ movimiento-stock.dto.ts
    â””â”€â”€ filtros-inventario.dto.ts

backend/src/modules/proveedores/
â”œâ”€â”€ proveedores.module.ts
â”œâ”€â”€ proveedores.controller.ts
â”œâ”€â”€ proveedores.service.ts
```

Endpoints:

```
# Repuestos
GET    /api/repuestos                 â†’ con bÃºsqueda, filtro por categorÃ­a, stock bajo
POST   /api/repuestos
GET    /api/repuestos/:id
PUT    /api/repuestos/:id
GET    /api/repuestos/stock-bajo      â†’ alertas de stock mÃ­nimo
GET    /api/repuestos/:id/movimientos â†’ historial de movimientos

# Movimientos de stock
POST   /api/inventario/entrada        â†’ entrada de mercaderÃ­a
POST   /api/inventario/salida         â†’ salida a OT
POST   /api/inventario/ajuste         â†’ ajuste manual (inventario)

# Proveedores
GET    /api/proveedores
POST   /api/proveedores
GET    /api/proveedores/:id
PUT    /api/proveedores/:id
```

Frontend:

```
frontend/src/pages/inventario/
â”œâ”€â”€ InventarioPage.tsx        â†’ tabla con bÃºsqueda y filtros
â”œâ”€â”€ RepuestoForm.tsx          â†’ crear/editar repuesto
â”œâ”€â”€ MovimientosPage.tsx       â†’ historial de movimientos
â”œâ”€â”€ StockBajoAlert.tsx        â†’ banner de alertas
â””â”€â”€ EntradaStockModal.tsx     â†’ registrar entrada de mercaderÃ­a
```

#### Paso 2: MÃ³dulo de Caja

```
backend/src/modules/caja/
â”œâ”€â”€ caja.module.ts
â”œâ”€â”€ caja.controller.ts
â”œâ”€â”€ caja.service.ts
â””â”€â”€ dto/
    â”œâ”€â”€ registrar-pago.dto.ts
    â””â”€â”€ cierre-caja.dto.ts
```

Endpoints:

```
POST   /api/caja/cobrar              â†’ { otId, monto, metodoPago, referencia }
GET    /api/caja/movimientos         â†’ movimientos del dÃ­a con filtros
GET    /api/caja/cierre-diario       â†’ resumen del dÃ­a (totales por mÃ©todo)
POST   /api/caja/cerrar              â†’ cierre formal del dÃ­a
```

#### Paso 3: FacturaciÃ³n ElectrÃ³nica (SII)

> **Nota**: Esta es la integraciÃ³n mÃ¡s compleja. Puede hacerse con un proveedor
> intermediario (como Haulmer, Bsale, o SimpleDTE) para no lidiar directamente con el SII.

```
backend/src/modules/facturacion/
â”œâ”€â”€ facturacion.module.ts
â”œâ”€â”€ facturacion.controller.ts
â”œâ”€â”€ facturacion.service.ts
â””â”€â”€ sii/
    â”œâ”€â”€ sii.service.ts            â†’ comunicaciÃ³n con SII o proveedor
    â”œâ”€â”€ dte-builder.ts            â†’ construir XML del DTE
    â””â”€â”€ pdf-generator.ts          â†’ generar PDF con timbre
```

Endpoints:

```
POST   /api/facturacion/boleta       â†’ emitir boleta electrÃ³nica
POST   /api/facturacion/factura      â†’ emitir factura electrÃ³nica
POST   /api/facturacion/nota-credito â†’ anular/corregir DTE
GET    /api/facturacion/:id/pdf      â†’ descargar PDF
GET    /api/facturacion/:id/xml      â†’ descargar XML
GET    /api/facturacion              â†’ listar facturas emitidas
```

---

### 10.4 FASE 4 â€” Comunicaciones

#### Paso 1: Servicio de Email

```
backend/src/modules/email/
â”œâ”€â”€ email.module.ts
â”œâ”€â”€ email.service.ts
â”œâ”€â”€ email.processor.ts          â†’ procesar cola BullMQ
â””â”€â”€ templates/
    â”œâ”€â”€ layouts/
    â”‚   â””â”€â”€ base.hbs            â†’ layout base HTML (header + footer)
    â”œâ”€â”€ welcome.hbs
    â”œâ”€â”€ ot_recepcion.hbs
    â”œâ”€â”€ presupuesto.hbs
    â”œâ”€â”€ ot_en_reparacion.hbs
    â”œâ”€â”€ ot_finalizada.hbs
    â”œâ”€â”€ factura.hbs
    â”œâ”€â”€ recordatorio_rev_tecnica.hbs
    â”œâ”€â”€ recordatorio_soap.hbs
    â”œâ”€â”€ recordatorio_permiso.hbs
    â”œâ”€â”€ recordatorio_mantencion.hbs
    â”œâ”€â”€ reset_password.hbs
    â”œâ”€â”€ invitacion.hbs
    â”œâ”€â”€ reporte_diario.hbs
    â”œâ”€â”€ trial_expiring.hbs
    â”œâ”€â”€ suscripcion_activa.hbs
    â”œâ”€â”€ pago_fallido.hbs
    â”œâ”€â”€ cuenta_suspendida.hbs
    â””â”€â”€ promo_custom.hbs
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
// email.service.ts â€” uso desde cualquier mÃ³dulo
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
â”œâ”€â”€ recordatorios.module.ts
â”œâ”€â”€ recordatorios.service.ts    â†’ cron jobs de @nestjs/schedule
â””â”€â”€ recordatorios.processor.ts
```

Cron jobs a implementar:

```
@Cron('0 9 * * *')    â†’ RevisiÃ³n tÃ©cnica, SOAP, mantenciÃ³n (diario 9AM)
@Cron('0 3 * * *')    â†’ Cobros de suscripciÃ³n (diario 3AM)
@Cron('0 8 * * 1-5')  â†’ Reporte diario al admin (lunes a viernes 8AM)
```

#### Paso 3: WhatsApp (Opcional)

```
backend/src/modules/whatsapp/
â”œâ”€â”€ whatsapp.module.ts
â”œâ”€â”€ whatsapp.service.ts          â†’ API de WhatsApp Business Cloud
â””â”€â”€ whatsapp.templates.ts        â†’ templates aprobados por Meta
```

---

### 10.5 FASE 5 â€” Portal del Cliente + Mobile

#### Paso 1: Portal del Cliente

Acceso vÃ­a URL Ãºnica sin login: `/portal/:token`

```
frontend/src/pages/portal/
â”œâ”€â”€ PortalPage.tsx              â†’ pÃ¡gina pÃºblica (sin sidebar)
â”œâ”€â”€ PortalEstado.tsx            â†’ timeline visual del estado de la OT
â”œâ”€â”€ PortalFotos.tsx             â†’ galerÃ­a de fotos del proceso
â”œâ”€â”€ PortalPresupuesto.tsx       â†’ ver y aprobar presupuesto + firma
â””â”€â”€ PortalFactura.tsx           â†’ descargar factura/boleta
```

Backend â€” WebSocket para actualizaciones en vivo:

```
backend/src/modules/portal-cliente/
â”œâ”€â”€ portal-cliente.module.ts
â”œâ”€â”€ portal-cliente.controller.ts   â†’ endpoints pÃºblicos (sin auth)
â””â”€â”€ portal-cliente.gateway.ts      â†’ WebSocket gateway
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
npx cap init roadix cl.roadix.app --web-dir dist

# Agregar Android
npm install @capacitor/android
npx cap add android

# Plugins nativos
npm install @capacitor/camera    # Fotos
npm install @capacitor/haptics   # VibraciÃ³n
npm install @capacitor/splash-screen

# Build y sincronizar
npm run build
npx cap sync android
npx cap open android              # Abre Android Studio
```

#### Paso 3: Funcionalidades Mobile

```
# OCR de patentes (Tesseract.js â€” corre en el browser/webview)
npm install tesseract.js

# Firma digital
npm install react-signature-canvas

# Dictado por voz (Web Speech API â€” nativo del browser)
# No requiere dependencia, es API del navegador
```

---

### 10.6 FASE 6 â€” Analytics y OptimizaciÃ³n

#### Paso 1: Dashboard Gerencial

```
frontend/src/pages/dashboard/
â”œâ”€â”€ DashboardPage.tsx
â”œâ”€â”€ widgets/
â”‚   â”œâ”€â”€ IngresosWidget.tsx       â†’ grÃ¡fico de barras (diario/semanal/mensual)
â”‚   â”œâ”€â”€ OTsPorEstadoWidget.tsx   â†’ grÃ¡fico circular
â”‚   â”œâ”€â”€ VehiculosEnTallerWidget.tsx
â”‚   â”œâ”€â”€ EficienciaMecanicosWidget.tsx
â”‚   â”œâ”€â”€ TopServiciosWidget.tsx
â”‚   â””â”€â”€ AlertasWidget.tsx        â†’ stock bajo, OTs atrasadas
```

Backend â€” Endpoints de reportes:

```
GET /api/reportes/ingresos?desde=&hasta=&agrupacion=dia|semana|mes
GET /api/reportes/ots-por-estado
GET /api/reportes/eficiencia-mecanicos?desde=&hasta=
GET /api/reportes/top-servicios?limite=5
GET /api/reportes/rotacion-inventario
GET /api/reportes/clientes-top
GET /api/reportes/resumen-diario
```

#### Paso 2: ExportaciÃ³n de reportes

```bash
# Dependencia para generar Excel
cd backend
npm install exceljs

# PDF ya estÃ¡ con PDFKit o Puppeteer (instalado en Fase 2)
```

```
GET /api/reportes/ingresos/pdf?desde=&hasta=
GET /api/reportes/ingresos/excel?desde=&hasta=
```

---

### 10.7 CHECKLIST GENERAL DE VERIFICACIÃ“N

```
Para cada fase, verificar antes de pasar a la siguiente:

â–¡ Backend compila sin errores (npm run build)
â–¡ Frontend compila sin errores (npm run build)
â–¡ Migraciones ejecutan correctamente
â–¡ Todos los endpoints responden con datos correctos
â–¡ Guards de auth bloquean acceso sin token
â–¡ Multi-tenancy: datos filtrados por taller_id
â–¡ Permisos: cada rol solo accede a lo permitido
â–¡ Frontend navega correctamente entre pÃ¡ginas
â–¡ Formularios validan datos antes de enviar
â–¡ Manejo de errores: mensajes claros al usuario
```

### 10.8 COMANDOS ÃšTILES â€” REFERENCIA RÃPIDA

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
npm run build                           # Build de producciÃ³n
npx cap sync android                    # Sincronizar con Android
npx cap open android                    # Abrir en Android Studio
npx cap run android                     # Ejecutar en dispositivo/emulador

# === PRODUCCIÃ“N ===
cd backend && npm run build             # Compilar TypeScript
cd frontend && npm run build            # Build optimizado
docker build -t roadix-api ./backend  # Imagen Docker del backend
```

---

## ðŸ“Š RESUMEN EJECUTIVO

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

*Plan generado para Roadix â€” Marzo 2026*

