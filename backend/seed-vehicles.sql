-- VEHICULOS (usando IDs directos de cliente: 1-5)
INSERT INTO vehiculo (cliente_id, taller_id, patente, marca, modelo, anio, color, km_actual, combustible, tipo_vehiculo) VALUES
(1, 1, 'BBCC12', 'Toyota',  'Corolla',  2020, 'Blanco', 45000,  'bencina', 'automovil'),
(1, 1, 'DDEE34', 'Suzuki',  'Swift',    2019, 'Rojo',   62000,  'bencina', 'automovil'),
(2, 1, 'FFGG56', 'Hyundai', 'Tucson',   2021, 'Gris',   33000,  'diesel',  'suv'),
(3, 1, 'HHJJ78', 'Mercedes','Sprinter', 2018, 'Blanco', 120000, 'diesel',  'van'),
(3, 1, 'KKLL90', 'Hyundai', 'HD78',     2017, 'Blanco', 180000, 'diesel',  'camion'),
(4, 1, 'MMNN11', 'Kia',     'Morning',  2022, 'Azul',   18000,  'bencina', 'automovil'),
(5, 1, 'PPQQ22', 'Toyota',  'Hilux',    2020, 'Negro',  85000,  'diesel',  'camioneta'),
(5, 1, 'RRSS33', 'Ford',    'Ranger',   2019, 'Plata',  95000,  'diesel',  'camioneta')
ON CONFLICT DO NOTHING;
