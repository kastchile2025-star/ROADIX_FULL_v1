-- =============================================
-- SEED: Caja (pagos) y Facturación (facturas)
-- =============================================

-- ── PAGOS (caja) ──────────────────────────────────────────────────────────
-- OT-2026-006 (listo, Juan Pérez): pagado en efectivo
INSERT INTO pago (ot_id, taller_id, monto, metodo_pago, referencia, fecha_pago) VALUES
(7, 1, 52360,  'efectivo',        NULL,              NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- OT-2026-008 (entregado, Constructora Norte): pago transferencia
INSERT INTO pago (ot_id, taller_id, monto, metodo_pago, referencia, fecha_pago) VALUES
(9, 1, 89250,  'transferencia',   'TRF-20260329-001', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- OT-2026-007 (control_calidad, Constructora Norte): pago parcial tarjeta débito
INSERT INTO pago (ot_id, taller_id, monto, metodo_pago, referencia, fecha_pago) VALUES
(8, 1, 60000,  'tarjeta_debito',  'POS-00123456',     NOW() - INTERVAL '12 hours')
ON CONFLICT DO NOTHING;

-- OT-2026-003 (esperando_repuestos, Transportes Del Sur): anticipo efectivo
INSERT INTO pago (ot_id, taller_id, monto, metodo_pago, referencia, fecha_pago) VALUES
(4, 1, 50000,  'efectivo',        NULL,              NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- OT-2026-004 (presupuesto, Transportes Del Sur): anticipo crédito
INSERT INTO pago (ot_id, taller_id, monto, metodo_pago, referencia, fecha_pago) VALUES
(5, 1, 80000,  'credito',         'CRD-TS-002',       NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Pago adicional efectivo de semanas anteriores (OT ya entregada)
INSERT INTO pago (ot_id, taller_id, monto, metodo_pago, referencia, fecha_pago) VALUES
(9, 1, 25000,  'tarjeta_credito', 'POS-00789012',     NOW() - INTERVAL '4 days')
ON CONFLICT DO NOTHING;


-- ── FACTURAS ──────────────────────────────────────────────────────────────
-- Boleta: Juan Pérez López — OT-2026-006 (listo → cobrado)
INSERT INTO factura (ot_id, taller_id, numero_dte, tipo_dte, rut_receptor, estado_sii, monto_neto, iva, monto_total) VALUES
(7, 1, 'BOL-2026-0001', 'boleta',  '12.345.678-9', 'aceptado', 44000,  8360,  52360)
ON CONFLICT DO NOTHING;

-- Factura: Transportes Del Sur — OT-2026-008 (entregado)
INSERT INTO factura (ot_id, taller_id, numero_dte, tipo_dte, rut_receptor, estado_sii, monto_neto, iva, monto_total) VALUES
(9, 1, 'FAC-2026-0001', 'factura', '77.888.999-0', 'aceptado', 75000, 14250,  89250)
ON CONFLICT DO NOTHING;

-- Factura: Constructora Norte — OT-2026-007 (control_calidad → emitida)
INSERT INTO factura (ot_id, taller_id, numero_dte, tipo_dte, rut_receptor, estado_sii, monto_neto, iva, monto_total) VALUES
(8, 1, 'FAC-2026-0002', 'factura', '77.888.999-0', 'pendiente', 95000, 18050, 113050)
ON CONFLICT DO NOTHING;

-- Boleta: María González Soto — OT-2026-002 (futuro, cuando se cierre)
INSERT INTO factura (ot_id, taller_id, numero_dte, tipo_dte, rut_receptor, estado_sii, monto_neto, iva, monto_total) VALUES
(3, 1, 'BOL-2026-0002', 'boleta',  '11.222.333-4', 'pendiente', 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Factura: Transportes Del Sur — OT-2026-003 (en proceso)
INSERT INTO factura (ot_id, taller_id, numero_dte, tipo_dte, rut_receptor, estado_sii, monto_neto, iva, monto_total) VALUES
(4, 1, 'FAC-2026-0003', 'factura', '76.543.210-K', 'pendiente', 120000, 22800, 142800)
ON CONFLICT DO NOTHING;
