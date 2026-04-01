-- Clientes
UPDATE cliente SET nombre='Juan Pérez López'    WHERE id=11;
UPDATE cliente SET nombre='María González Soto' WHERE id=12;
UPDATE cliente SET nombre='Andrea Muñoz Reyes'  WHERE id=14;

-- Mecánicos (especialidad)
UPDATE mecanico SET especialidad='Motor y transmisión' WHERE id=3;
UPDATE mecanico SET especialidad='Frenos y suspensión' WHERE id=4;

-- Órdenes de trabajo — tipo_servicio
UPDATE orden_trabajo SET tipo_servicio='Mantención 50.000 km'        WHERE id=2;
UPDATE orden_trabajo SET tipo_servicio='Ruido en suspensión'         WHERE id=3;
UPDATE orden_trabajo SET tipo_servicio='Cambio correa distribución'  WHERE id=4;
UPDATE orden_trabajo SET tipo_servicio='Revisión general'            WHERE id=6;
UPDATE orden_trabajo SET tipo_servicio='Mantención 80.000 km'        WHERE id=8;
UPDATE orden_trabajo SET tipo_servicio='Reparación motor arranque'   WHERE id=9;

-- Órdenes de trabajo — diagnostico
UPDATE orden_trabajo SET diagnostico='Cambio aceite, filtros, revisión frenos'                        WHERE id=2;
UPDATE orden_trabajo SET diagnostico='Cambio aceite, filtros, bujías, revisión suspensión'            WHERE id=8;

-- Órdenes de trabajo — observaciones
UPDATE orden_trabajo SET observaciones='Cliente solicita revisión completa' WHERE id=2;
UPDATE orden_trabajo SET observaciones='Vehículo flota empresa'             WHERE id=4;
UPDATE orden_trabajo SET observaciones='Vehículo pesado, uso intensivo'     WHERE id=5;
UPDATE orden_trabajo SET observaciones='Vehículo listo para retiro'         WHERE id=7;

-- Usuarios (por si acaso)
UPDATE usuario SET nombre='María Recepción' WHERE email='recepcion@roadix.cl';
UPDATE usuario SET nombre='Carlos Mecánico' WHERE email='mecanico1@roadix.cl';
UPDATE usuario SET nombre='Pedro Mecánico'  WHERE email='mecanico2@roadix.cl';
