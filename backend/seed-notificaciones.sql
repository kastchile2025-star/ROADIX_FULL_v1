-- =============================================
-- SEED: Recordatorios (notificaciones)
-- =============================================

-- Revisión técnica próxima — vehículo BBCC12 (Juan Pérez)
INSERT INTO recordatorio (taller_id, cliente_id, vehiculo_id, tipo, mensaje, fecha_envio, canal, estado) VALUES
(1, 11, (SELECT id FROM vehiculo WHERE patente='BBCC12'), 'rev_tecnica',
 'Estimado Juan Pérez, su vehículo Toyota Corolla (BBCC12) tiene revisión técnica en 15 días. Agenda tu cita con nosotros.',
 NOW() + INTERVAL '15 days', 'email', 'pendiente');

-- SOAP por vencer — vehículo FFGG56 (María González)
INSERT INTO recordatorio (taller_id, cliente_id, vehiculo_id, tipo, mensaje, fecha_envio, canal, estado) VALUES
(1, 12, (SELECT id FROM vehiculo WHERE patente='FFGG56'), 'soap',
 'Estimada María González, el SOAP de su Hyundai Tucson (FFGG56) vence en 10 días. Contáctenos para más información.',
 NOW() + INTERVAL '10 days', 'email', 'pendiente');

-- Mantención programada — vehículo PPQQ22 (Constructora Norte)
INSERT INTO recordatorio (taller_id, cliente_id, vehiculo_id, tipo, mensaje, fecha_envio, canal, estado) VALUES
(1, 15, (SELECT id FROM vehiculo WHERE patente='PPQQ22'), 'mantencion',
 'Estimado cliente de Constructora Norte, su Toyota Hilux (PPQQ22) se acerca a los 90.000 km. Agende su mantención mayor.',
 NOW() + INTERVAL '5 days', 'ambos', 'pendiente');

-- Seguimiento OT entregada — RRSS33 (Constructora Norte)
INSERT INTO recordatorio (taller_id, cliente_id, vehiculo_id, tipo, mensaje, fecha_envio, canal, estado) VALUES
(1, 15, (SELECT id FROM vehiculo WHERE patente='RRSS33'), 'seguimiento',
 'Estimado cliente de Constructora Norte, ¿cómo está funcionando su Ford Ranger (RRSS33) tras la reparación del motor de arranque?',
 NOW() - INTERVAL '1 day', 'email', 'enviado');

-- Permiso de circulación — vehículo DDEE34 (Juan Pérez)
INSERT INTO recordatorio (taller_id, cliente_id, vehiculo_id, tipo, mensaje, fecha_envio, canal, estado) VALUES
(1, 11, (SELECT id FROM vehiculo WHERE patente='DDEE34'), 'permiso_circ',
 'Estimado Juan Pérez, recuerde que el permiso de circulación de su Suzuki Swift (DDEE34) vence en abril. ¡No olvide renovarlo!',
 NOW() + INTERVAL '3 days', 'email', 'pendiente');

-- Revisión técnica vencida — vehículo HHJJ78 (Transportes Del Sur)
INSERT INTO recordatorio (taller_id, cliente_id, vehiculo_id, tipo, mensaje, fecha_envio, canal, estado) VALUES
(1, 13, (SELECT id FROM vehiculo WHERE patente='HHJJ78'), 'rev_tecnica',
 'Transportes Del Sur: la revisión técnica del Mercedes Sprinter (HHJJ78) está vencida. Comuníquese con nosotros a la brevedad.',
 NOW() - INTERVAL '2 days', 'ambos', 'enviado');

-- Mantención vehículo Kia Morning — Andrea Muñoz
INSERT INTO recordatorio (taller_id, cliente_id, vehiculo_id, tipo, mensaje, fecha_envio, canal, estado) VALUES
(1, 14, (SELECT id FROM vehiculo WHERE patente='MMNN11'), 'mantencion',
 'Estimada Andrea Muñoz, su Kia Morning (MMNN11) está próximo a los 20.000 km de mantención. Reserve su hora con anticipación.',
 NOW() + INTERVAL '7 days', 'email', 'pendiente');

-- Seguimiento fallido — KKLL90 (Transportes Del Sur)
INSERT INTO recordatorio (taller_id, cliente_id, vehiculo_id, tipo, mensaje, fecha_envio, canal, estado) VALUES
(1, 13, (SELECT id FROM vehiculo WHERE patente='KKLL90'), 'seguimiento',
 'Transportes Del Sur: seguimiento de presupuesto para frenos del Hyundai HD78 (KKLL90). ¿Desea aprobar la cotización?',
 NOW() - INTERVAL '3 days', 'email', 'fallido');
