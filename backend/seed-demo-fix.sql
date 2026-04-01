-- FIX: Vehículos (furgon→van, sin direccion en proveedor)
INSERT INTO vehiculo (cliente_id, taller_id, patente, marca, modelo, anio, color, km_actual, combustible, tipo_vehiculo) VALUES
((SELECT id FROM cliente WHERE rut='76.543.210-K'), 1, 'HHJJ78', 'Mercedes','Sprinter', 2018, 'Blanco', 120000, 'diesel', 'van'),
((SELECT id FROM cliente WHERE rut='76.543.210-K'), 1, 'KKLL90', 'Hyundai', 'HD78',     2017, 'Blanco', 180000, 'diesel', 'camion'),
((SELECT id FROM cliente WHERE rut='15.678.901-2'), 1, 'MMNN11', 'Kia',     'Morning',  2022, 'Azul',   18000,  'bencina','automovil'),
((SELECT id FROM cliente WHERE rut='77.888.999-0'), 1, 'PPQQ22', 'Toyota',  'Hilux',    2020, 'Negro',  85000,  'diesel', 'camioneta'),
((SELECT id FROM cliente WHERE rut='77.888.999-0'), 1, 'RRSS33', 'Ford',    'Ranger',   2019, 'Plata',  95000,  'diesel', 'camioneta')
ON CONFLICT DO NOTHING;

-- PROVEEDORES (razon_social, no nombre; contacto, no direccion)
INSERT INTO proveedor (taller_id, razon_social, rut, contacto, email, telefono) VALUES
(1, 'Repuestos Chile SpA',  '76.111.222-3', 'Av. Matta 1500, Santiago',   'ventas@repuestoschile.cl', '+56226789012'),
(1, 'AutoPartes Express',   '76.444.555-6', 'Gran Avenida 3400, San Miguel','pedidos@autopartes.cl',  '+56227890123'),
(1, 'Lubricantes del Sur',  '76.777.888-9', 'Ruta 5 Sur km 80, Rancagua', 'ventas@lubrisur.cl',       '+56228901234')
ON CONFLICT DO NOTHING;

-- REPUESTOS / INVENTARIO
INSERT INTO repuesto (taller_id, proveedor_id, codigo, nombre, categoria, precio_compra, precio_venta, stock_actual, stock_minimo, ubicacion_bodega) VALUES
(1, (SELECT id FROM proveedor WHERE rut='76.111.222-3' LIMIT 1), 'FLT-ACE-001', 'Filtro de aceite Toyota',      'Filtros',       3500,  7500,  25, 5,  'A1-01'),
(1, (SELECT id FROM proveedor WHERE rut='76.111.222-3' LIMIT 1), 'FLT-AIR-001', 'Filtro de aire universal',      'Filtros',       4000,  8500,  18, 5,  'A1-02'),
(1, (SELECT id FROM proveedor WHERE rut='76.111.222-3' LIMIT 1), 'PST-FRN-001', 'Pastillas de freno delanteras', 'Frenos',       12000, 25000,  12, 3,  'B2-01'),
(1, (SELECT id FROM proveedor WHERE rut='76.111.222-3' LIMIT 1), 'DSC-FRN-001', 'Disco de freno delantero',      'Frenos',       18000, 35000,   8, 2,  'B2-02'),
(1, (SELECT id FROM proveedor WHERE rut='76.444.555-6' LIMIT 1), 'ACT-5W30',    'Aceite 5W-30 sintetico 4L',    'Lubricantes',  15000, 28000,  30, 10, 'C1-01'),
(1, (SELECT id FROM proveedor WHERE rut='76.444.555-6' LIMIT 1), 'ACT-10W40',   'Aceite 10W-40 semi 4L',        'Lubricantes',  10000, 19000,  20, 8,  'C1-02'),
(1, (SELECT id FROM proveedor WHERE rut='76.777.888-9' LIMIT 1), 'BUJ-NGK-001', 'Bujia NGK estandar',           'Encendido',     2500,  5500,  40, 10, 'D1-01'),
(1, (SELECT id FROM proveedor WHERE rut='76.444.555-6' LIMIT 1), 'CRR-DIST-01', 'Correa distribucion Hyundai',  'Distribucion', 25000, 48000,   5, 2,  'E1-01'),
(1, (SELECT id FROM proveedor WHERE rut='76.111.222-3' LIMIT 1), 'AMT-DLT-01',  'Amortiguador delantero par',   'Suspension',   35000, 65000,   6, 2,  'F1-01'),
(1, (SELECT id FROM proveedor WHERE rut='76.777.888-9' LIMIT 1), 'BAT-60AH',    'Bateria 60Ah 12V',             'Electrico',    45000, 79000,   4, 2,  'G1-01')
ON CONFLICT DO NOTHING;

-- ÓRDENES DE TRABAJO (distintos estados)
INSERT INTO orden_trabajo (taller_id, vehiculo_id, cliente_id, mecanico_id, numero_ot, estado, tipo_servicio, km_ingreso, diagnostico, observaciones, fecha_prometida, prioridad, subtotal, iva, total) VALUES
(1, (SELECT id FROM vehiculo WHERE patente='BBCC12'), (SELECT id FROM cliente WHERE rut='12.345.678-9'), (SELECT id FROM mecanico ORDER BY id LIMIT 1),            'OT-2026-001', 'en_reparacion',       'Mantencion 50.000 km',        45200,  'Cambio aceite, filtros, revision frenos',             'Cliente solicita revision completa',    NOW() + INTERVAL '2 days',  'media',   85000,  16150,  101150),
(1, (SELECT id FROM vehiculo WHERE patente='FFGG56'), (SELECT id FROM cliente WHERE rut='11.222.333-4'), (SELECT id FROM mecanico ORDER BY id LIMIT 1),            'OT-2026-002', 'diagnostico',          'Ruido en suspension',         33500,  'Revisar amortiguadores y bujes',                      'Ruido al pasar topes',                  NOW() + INTERVAL '3 days',  'alta',    0,      0,      0),
(1, (SELECT id FROM vehiculo WHERE patente='HHJJ78'), (SELECT id FROM cliente WHERE rut='76.543.210-K'), (SELECT id FROM mecanico ORDER BY id OFFSET 1 LIMIT 1),  'OT-2026-003', 'esperando_repuestos',  'Cambio correa distribucion',  121000, 'Correa con desgaste, tensor ok',                      'Vehiculo flota empresa',                NOW() + INTERVAL '5 days',  'alta',    120000, 22800,  142800),
(1, (SELECT id FROM vehiculo WHERE patente='KKLL90'), (SELECT id FROM cliente WHERE rut='76.543.210-K'), (SELECT id FROM mecanico ORDER BY id OFFSET 1 LIMIT 1),  'OT-2026-004', 'presupuesto',          'Frenos completos',            180500, 'Pastillas y discos delanteros agotados',              'Vehiculo pesado, uso intensivo',         NOW() + INTERVAL '4 days',  'urgente', 150000, 28500,  178500),
(1, (SELECT id FROM vehiculo WHERE patente='MMNN11'), (SELECT id FROM cliente WHERE rut='15.678.901-2'), NULL,                                                      'OT-2026-005', 'recepcion',            'Revision general',            18200,  NULL,                                                  'Primera visita del cliente',             NOW() + INTERVAL '3 days',  'baja',    0,      0,      0),
(1, (SELECT id FROM vehiculo WHERE patente='DDEE34'), (SELECT id FROM cliente WHERE rut='12.345.678-9'), (SELECT id FROM mecanico ORDER BY id LIMIT 1),            'OT-2026-006', 'listo',                'Cambio de aceite y filtros',   62300,  'Cambio aceite 5W-30, filtro aceite, filtro aire',     'Vehiculo listo para retiro',            NOW() - INTERVAL '1 day',   'media',   44000,  8360,   52360),
(1, (SELECT id FROM vehiculo WHERE patente='PPQQ22'), (SELECT id FROM cliente WHERE rut='77.888.999-0'), (SELECT id FROM mecanico ORDER BY id OFFSET 1 LIMIT 1),  'OT-2026-007', 'control_calidad',      'Mantencion 80.000 km',        85400,  'Cambio aceite, filtros, bujias, revision suspension', 'Flota constructora',                    NOW() + INTERVAL '1 day',   'media',   95000,  18050,  113050),
(1, (SELECT id FROM vehiculo WHERE patente='RRSS33'), (SELECT id FROM cliente WHERE rut='77.888.999-0'), (SELECT id FROM mecanico ORDER BY id OFFSET 1 LIMIT 1),  'OT-2026-008', 'entregado',            'Reparacion motor arranque',    95200,  'Motor arranque defectuoso, reemplazo completo',       'Entregado sin observaciones',           NOW() - INTERVAL '3 days',  'alta',    75000,  14250,  89250)
ON CONFLICT (numero_ot) DO NOTHING;
