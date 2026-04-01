-- =============================================
-- SEED: ot_detalle (servicios y repuestos por OT)
-- Alimenta reportes de top servicios, mecánicos e ingresos
-- =============================================

-- OT-2026-001 (en_reparacion — Juan Pérez / mecánico 3)
INSERT INTO ot_detalle (ot_id, tipo, descripcion, cantidad, precio_unit, descuento, subtotal) VALUES
(2, 'mano_obra', 'Mantención 50.000 km',       1, 35000, 0, 35000),
(2, 'mano_obra', 'Revisión de frenos',          1, 20000, 0, 20000),
(2, 'repuesto',  'Filtro de aceite Toyota',     1,  7500, 0,  7500),
(2, 'repuesto',  'Aceite 5W-30 sintético 4L',  1, 28000, 0, 28000)
ON CONFLICT DO NOTHING;

-- OT-2026-002 (diagnostico — María González / mecánico 3)
INSERT INTO ot_detalle (ot_id, tipo, descripcion, cantidad, precio_unit, descuento, subtotal) VALUES
(3, 'mano_obra', 'Diagnóstico suspensión',     1, 15000, 0, 15000)
ON CONFLICT DO NOTHING;

-- OT-2026-003 (esperando_repuestos — Transportes Del Sur / mecánico 4)
INSERT INTO ot_detalle (ot_id, tipo, descripcion, cantidad, precio_unit, descuento, subtotal) VALUES
(4, 'mano_obra', 'Cambio correa distribución', 1, 55000, 0, 55000),
(4, 'repuesto',  'Correa distribución Hyundai',1, 48000, 0, 48000),
(4, 'repuesto',  'Filtro de aire universal',   1,  8500, 0,  8500)
ON CONFLICT DO NOTHING;

-- OT-2026-004 (presupuesto — Transportes Del Sur / mecánico 4)
INSERT INTO ot_detalle (ot_id, tipo, descripcion, cantidad, precio_unit, descuento, subtotal) VALUES
(5, 'mano_obra', 'Cambio pastillas y discos',  1, 65000, 0, 65000),
(5, 'repuesto',  'Pastillas de freno delant.', 2, 25000, 0, 50000),
(5, 'repuesto',  'Disco de freno delantero',   2, 35000, 0, 70000)
ON CONFLICT DO NOTHING;

-- OT-2026-006 (listo — Juan Pérez / mecánico 3)
INSERT INTO ot_detalle (ot_id, tipo, descripcion, cantidad, precio_unit, descuento, subtotal) VALUES
(7, 'mano_obra', 'Cambio de aceite y filtros', 1, 18000, 0, 18000),
(7, 'repuesto',  'Aceite 10W-40 semi 4L',      1, 19000, 0, 19000),
(7, 'repuesto',  'Filtro de aceite Toyota',     1,  7500, 0,  7500)
ON CONFLICT DO NOTHING;

-- OT-2026-007 (control_calidad — Constructora Norte / mecánico 4)
INSERT INTO ot_detalle (ot_id, tipo, descripcion, cantidad, precio_unit, descuento, subtotal) VALUES
(8, 'mano_obra', 'Mantención 80.000 km',       1, 40000, 0, 40000),
(8, 'repuesto',  'Aceite 5W-30 sintético 4L',  1, 28000, 0, 28000),
(8, 'repuesto',  'Filtro de aire universal',    1,  8500, 0,  8500),
(8, 'repuesto',  'Bujía NGK estándar',          4,  5500, 0, 22000)
ON CONFLICT DO NOTHING;

-- OT-2026-008 (entregado — Constructora Norte / mecánico 4)
INSERT INTO ot_detalle (ot_id, tipo, descripcion, cantidad, precio_unit, descuento, subtotal) VALUES
(9, 'mano_obra', 'Reparación motor arranque',  1, 45000, 0, 45000),
(9, 'repuesto',  'Motor de arranque',           1, 35000, 0, 35000)
ON CONFLICT DO NOTHING;
