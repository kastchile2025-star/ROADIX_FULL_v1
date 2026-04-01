-- =============================================
-- SEED COMPLETO: Datos demo para ROADIX
-- Password para todos los usuarios demo: demo123
-- Hash bcrypt: $2b$12$JQujwBIUZ7cf8KSfNcBZleg/3fE.0UEdhg/KA06nKq2sgJCIrLSou
-- =============================================

-- USUARIOS POR ROL
INSERT INTO usuario (taller_id, nombre, email, password, rol, telefono, activo) VALUES
(1, 'Super Admin',     'superadmin@roadix.cl',   '$2b$12$JQujwBIUZ7cf8KSfNcBZleg/3fE.0UEdhg/KA06nKq2sgJCIrLSou', 'superadmin',    '+56911111111', true),
(1, 'María Recepción', 'recepcion@roadix.cl',    '$2b$12$JQujwBIUZ7cf8KSfNcBZleg/3fE.0UEdhg/KA06nKq2sgJCIrLSou', 'recepcionista', '+56922222222', true),
(1, 'Carlos Mecánico', 'mecanico1@roadix.cl',    '$2b$12$JQujwBIUZ7cf8KSfNcBZleg/3fE.0UEdhg/KA06nKq2sgJCIrLSou', 'mecanico',      '+56933333333', true),
(1, 'Pedro Mecánico',  'mecanico2@roadix.cl',    '$2b$12$JQujwBIUZ7cf8KSfNcBZleg/3fE.0UEdhg/KA06nKq2sgJCIrLSou', 'mecanico',      '+56933333334', true),
(1, 'Luis Bodeguero',  'bodeguero@roadix.cl',    '$2b$12$JQujwBIUZ7cf8KSfNcBZleg/3fE.0UEdhg/KA06nKq2sgJCIrLSou', 'bodeguero',     '+56944444444', true),
(1, 'Ana Cajera',      'cajero@roadix.cl',       '$2b$12$JQujwBIUZ7cf8KSfNcBZleg/3fE.0UEdhg/KA06nKq2sgJCIrLSou', 'cajero',        '+56955555555', true),
(1, 'Visor Reportes',  'viewer@roadix.cl',       '$2b$12$JQujwBIUZ7cf8KSfNcBZleg/3fE.0UEdhg/KA06nKq2sgJCIrLSou', 'viewer',        '+56966666666', true)
ON CONFLICT (email) DO NOTHING;

-- MECÁNICOS (vinculados a usuarios)
INSERT INTO mecanico (usuario_id, taller_id, especialidad, tarifa_hora, activo)
SELECT u.id, 1, 'Motor y transmisión', 25000, true FROM usuario u WHERE u.email = 'mecanico1@roadix.cl'
AND NOT EXISTS (SELECT 1 FROM mecanico m WHERE m.usuario_id = u.id);

INSERT INTO mecanico (usuario_id, taller_id, especialidad, tarifa_hora, activo)
SELECT u.id, 1, 'Frenos y suspensión', 22000, true FROM usuario u WHERE u.email = 'mecanico2@roadix.cl'
AND NOT EXISTS (SELECT 1 FROM mecanico m WHERE m.usuario_id = u.id);

-- CLIENTES
INSERT INTO cliente (taller_id, nombre, rut, email, telefono, direccion, tipo) VALUES
(1, 'Juan Pérez López',     '12.345.678-9', 'juan.perez@gmail.com',     '+56912345678', 'Los Alerces 1234, Santiago',     'persona'),
(1, 'María González Soto',  '11.222.333-4', 'maria.gonzalez@gmail.com', '+56913456789', 'Av. Providencia 2345, Santiago', 'persona'),
(1, 'Transportes Del Sur',  '76.543.210-K', 'contacto@delsur.cl',       '+56224567890', 'Ruta 5 Sur km 120, Rancagua',   'empresa'),
(1, 'Andrea Muñoz Reyes',   '15.678.901-2', 'andrea.munoz@outlook.com', '+56914567890', 'Pasaje Los Olmos 567, Maipú',   'persona'),
(1, 'Constructora Norte',   '77.888.999-0', 'flota@norte.cl',           '+56225678901', 'Av. Industrial 890, Quilicura',  'empresa')
ON CONFLICT DO NOTHING;

-- VEHÍCULOS
INSERT INTO vehiculo (cliente_id, taller_id, patente, marca, modelo, anio, color, km_actual, combustible, tipo_vehiculo) VALUES
((SELECT id FROM cliente WHERE rut='12.345.678-9'), 1, 'BBCC12', 'Toyota',  'Corolla',  2020, 'Blanco', 45000,  'bencina', 'automovil'),
((SELECT id FROM cliente WHERE rut='12.345.678-9'), 1, 'DDEE34', 'Suzuki',  'Swift',    2019, 'Rojo',   62000,  'bencina', 'automovil'),
((SELECT id FROM cliente WHERE rut='11.222.333-4'), 1, 'FFGG56', 'Hyundai', 'Tucson',   2021, 'Gris',   33000,  'diesel',  'suv'),
((SELECT id FROM cliente WHERE rut='76.543.210-K'), 1, 'HHJJ78', 'Mercedes','Sprinter', 2018, 'Blanco', 120000, 'diesel',  'van'),
((SELECT id FROM cliente WHERE rut='76.543.210-K'), 1, 'KKLL90', 'Hyundai', 'HD78',     2017, 'Blanco', 180000, 'diesel',  'camion'),
((SELECT id FROM cliente WHERE rut='15.678.901-2'), 1, 'MMNN11', 'Kia',     'Morning',  2022, 'Azul',   18000,  'bencina', 'automovil'),
((SELECT id FROM cliente WHERE rut='77.888.999-0'), 1, 'PPQQ22', 'Toyota',  'Hilux',    2020, 'Negro',  85000,  'diesel',  'camioneta'),
((SELECT id FROM cliente WHERE rut='77.888.999-0'), 1, 'RRSS33', 'Ford',    'Ranger',   2019, 'Plata',  95000,  'diesel',  'camioneta')
ON CONFLICT DO NOTHING;

-- PROVEEDORES
INSERT INTO proveedor (taller_id, razon_social, rut, email, telefono) VALUES
(1, 'Repuestos Chile SpA',  '76.111.222-3', 'ventas@repuestoschile.cl', '+56226789012'),
(1, 'AutoPartes Express',   '76.444.555-6', 'pedidos@autopartes.cl',    '+56227890123'),
(1, 'Lubricantes del Sur',  '76.777.888-9', 'ventas@lubrisur.cl',       '+56228901234')
ON CONFLICT DO NOTHING;

-- REPUESTOS / INVENTARIO
INSERT INTO repuesto (taller_id, proveedor_id, codigo, nombre, categoria, precio_compra, precio_venta, stock_actual, stock_minimo, ubicacion_bodega) VALUES
(1, (SELECT id FROM proveedor WHERE rut='76.111.222-3' LIMIT 1), 'FLT-ACE-001', 'Filtro de aceite Toyota',      'Filtros',       3500,  7500,  25, 5,  'A1-01'),
(1, (SELECT id FROM proveedor WHERE rut='76.111.222-3' LIMIT 1), 'FLT-AIR-001', 'Filtro de aire universal',      'Filtros',       4000,  8500,  18, 5,  'A1-02'),
(1, (SELECT id FROM proveedor WHERE rut='76.111.222-3' LIMIT 1), 'PST-FRN-001', 'Pastillas de freno delanteras', 'Frenos',       12000, 25000,  12, 3,  'B2-01'),
(1, (SELECT id FROM proveedor WHERE rut='76.111.222-3' LIMIT 1), 'DSC-FRN-001', 'Disco de freno delantero',      'Frenos',       18000, 35000,   8, 2,  'B2-02'),
(1, (SELECT id FROM proveedor WHERE rut='76.444.555-6' LIMIT 1), 'ACT-5W30',    'Aceite 5W-30 sintético 4L',    'Lubricantes',  15000, 28000,  30, 10, 'C1-01'),
(1, (SELECT id FROM proveedor WHERE rut='76.444.555-6' LIMIT 1), 'ACT-10W40',   'Aceite 10W-40 semi 4L',        'Lubricantes',  10000, 19000,  20, 8,  'C1-02'),
(1, (SELECT id FROM proveedor WHERE rut='76.777.888-9' LIMIT 1), 'BUJ-NGK-001', 'Bujía NGK estándar',           'Encendido',     2500,  5500,  40, 10, 'D1-01'),
(1, (SELECT id FROM proveedor WHERE rut='76.444.555-6' LIMIT 1), 'CRR-DIST-01', 'Correa distribución Hyundai',  'Distribución', 25000, 48000,   5, 2,  'E1-01'),
(1, (SELECT id FROM proveedor WHERE rut='76.111.222-3' LIMIT 1), 'AMT-DLT-01',  'Amortiguador delantero par',   'Suspensión',   35000, 65000,   6, 2,  'F1-01'),
(1, (SELECT id FROM proveedor WHERE rut='76.777.888-9' LIMIT 1), 'BAT-60AH',    'Batería 60Ah 12V',             'Eléctrico',    45000, 79000,   4, 2,  'G1-01')
ON CONFLICT DO NOTHING;

-- ÓRDENES DE TRABAJO (distintos estados del flujo)
INSERT INTO orden_trabajo (taller_id, vehiculo_id, cliente_id, mecanico_id, numero_ot, estado, tipo_servicio, km_ingreso, diagnostico, observaciones, fecha_prometida, prioridad, subtotal, iva, total) VALUES
(1, (SELECT id FROM vehiculo WHERE patente='BBCC12'), (SELECT id FROM cliente WHERE rut='12.345.678-9'), (SELECT id FROM mecanico LIMIT 1),      'OT-2026-001', 'en_reparacion',       'Mantención 50.000 km',        45200,  'Cambio aceite, filtros, revisión frenos',             'Cliente solicita revisión completa',    NOW() + INTERVAL '2 days',  'media',   85000,  16150,  101150),
(1, (SELECT id FROM vehiculo WHERE patente='FFGG56'), (SELECT id FROM cliente WHERE rut='11.222.333-4'), (SELECT id FROM mecanico LIMIT 1),      'OT-2026-002', 'diagnostico',          'Ruido en suspensión',         33500,  'Revisar amortiguadores y bujes',                      'Ruido al pasar topes',                  NOW() + INTERVAL '3 days',  'alta',    0,      0,      0),
(1, (SELECT id FROM vehiculo WHERE patente='HHJJ78'), (SELECT id FROM cliente WHERE rut='76.543.210-K'), (SELECT id FROM mecanico OFFSET 1 LIMIT 1), 'OT-2026-003', 'esperando_repuestos',  'Cambio correa distribución',  121000, 'Correa con desgaste, tensor ok',                      'Vehículo flota empresa',                NOW() + INTERVAL '5 days',  'alta',    120000, 22800,  142800),
(1, (SELECT id FROM vehiculo WHERE patente='KKLL90'), (SELECT id FROM cliente WHERE rut='76.543.210-K'), (SELECT id FROM mecanico OFFSET 1 LIMIT 1), 'OT-2026-004', 'presupuesto',          'Frenos completos',            180500, 'Pastillas y discos delanteros agotados',              'Vehículo pesado, uso intensivo',         NOW() + INTERVAL '4 days',  'urgente', 150000, 28500,  178500),
(1, (SELECT id FROM vehiculo WHERE patente='MMNN11'), (SELECT id FROM cliente WHERE rut='15.678.901-2'), NULL,                                        'OT-2026-005', 'recepcion',            'Revisión general',            18200,  NULL,                                                  'Primera visita del cliente',             NOW() + INTERVAL '3 days',  'baja',    0,      0,      0),
(1, (SELECT id FROM vehiculo WHERE patente='DDEE34'), (SELECT id FROM cliente WHERE rut='12.345.678-9'), (SELECT id FROM mecanico LIMIT 1),      'OT-2026-006', 'listo',                'Cambio de aceite y filtros',   62300,  'Cambio aceite 5W-30, filtro aceite, filtro aire',     'Vehículo listo para retiro',            NOW() - INTERVAL '1 day',   'media',   44000,  8360,   52360),
(1, (SELECT id FROM vehiculo WHERE patente='PPQQ22'), (SELECT id FROM cliente WHERE rut='77.888.999-0'), (SELECT id FROM mecanico OFFSET 1 LIMIT 1), 'OT-2026-007', 'control_calidad',      'Mantención 80.000 km',        85400,  'Cambio aceite, filtros, bujías, revisión suspensión', 'Flota constructora',                    NOW() + INTERVAL '1 day',   'media',   95000,  18050,  113050),
(1, (SELECT id FROM vehiculo WHERE patente='RRSS33'), (SELECT id FROM cliente WHERE rut='77.888.999-0'), (SELECT id FROM mecanico OFFSET 1 LIMIT 1), 'OT-2026-008', 'entregado',            'Reparación motor arranque',    95200,  'Motor arranque defectuoso, reemplazo completo',       'Entregado sin observaciones',           NOW() - INTERVAL '3 days',  'alta',    75000,  14250,  89250)
ON CONFLICT (numero_ot) DO NOTHING;
