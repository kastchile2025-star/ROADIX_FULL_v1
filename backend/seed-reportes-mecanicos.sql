-- Seed: Datos para Reportes > Mecánicos
-- Ajusta fecha_ingreso a Marzo 2026 y estados a listo/entregado/facturado
-- para que aparezcan en el rango 01/03/2026 – 01/04/2026

-- Mecánico 3 (Motor y transmisión): OTs 2, 3, 7
UPDATE orden_trabajo SET
  fecha_ingreso = '2026-03-05 09:00:00',
  fecha_entrega  = '2026-03-07 17:00:00',
  estado         = 'entregado',
  total          = 125000
WHERE id = 2;

UPDATE orden_trabajo SET
  fecha_ingreso = '2026-03-12 10:30:00',
  fecha_entrega  = '2026-03-14 16:00:00',
  estado         = 'entregado',
  total          = 87500
WHERE id = 3;

UPDATE orden_trabajo SET
  fecha_ingreso = '2026-03-20 08:00:00',
  fecha_entrega  = '2026-03-21 15:30:00',
  estado         = 'entregado',
  total          = 52360
WHERE id = 7;

-- Mecánico 4 (Frenos y suspensión): OTs 4, 5, 8, 9
UPDATE orden_trabajo SET
  fecha_ingreso = '2026-03-08 11:00:00',
  fecha_entrega  = '2026-03-10 17:00:00',
  estado         = 'entregado',
  total          = 142800
WHERE id = 4;

UPDATE orden_trabajo SET
  fecha_ingreso = '2026-03-15 09:30:00',
  fecha_entrega  = '2026-03-17 16:30:00',
  estado         = 'entregado',
  total          = 178500
WHERE id = 5;

UPDATE orden_trabajo SET
  fecha_ingreso = '2026-03-22 10:00:00',
  fecha_entrega  = '2026-03-24 14:00:00',
  estado         = 'listo',
  total          = 113050
WHERE id = 8;

UPDATE orden_trabajo SET
  fecha_ingreso = '2026-03-28 08:30:00',
  fecha_entrega  = '2026-03-29 17:00:00',
  estado         = 'entregado',
  total          = 89250
WHERE id = 9;

-- OT 6 sin mecánico: moverla a marzo también (no afecta el reporte de mecánicos)
UPDATE orden_trabajo SET
  fecha_ingreso = '2026-03-18 14:00:00',
  estado        = 'recepcion'
WHERE id = 6;

-- Verificar resultado
SELECT id, numero_ot, estado, mecanico_id, fecha_ingreso::date, total
FROM orden_trabajo
ORDER BY mecanico_id NULLS LAST, fecha_ingreso;
