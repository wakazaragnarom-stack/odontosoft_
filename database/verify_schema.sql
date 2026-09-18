-- OdontoSoft - verificación del esquema requerido por el backend.
-- Ejecutar después de aplicar database/migrations/001_sync_legacy_postgresql.sql.

WITH required_columns(table_name, column_name) AS (
    VALUES
        ('usuario','id_usuario'),
        ('usuario','correo'),
        ('usuario','contrasena'),
        ('usuario','rol'),
        ('usuario','estado'),
        ('usuario','fecha_registro'),
        ('usuario','ultimo_acceso'),
        ('paciente','id_paciente'),
        ('odontologo','id_odontologo'),
        ('odontologo','id_consultorio'),
        ('consultorio','id_consultorio'),
        ('historia_clinica','id_historia'),
        ('historia_clinica','id_paciente'),
        ('historia_clinica_detallada','id_historia_detallada'),
        ('historia_clinica_detallada','id_paciente'),
        ('odontograma','id_odontograma'),
        ('odontograma','id_paciente'),
        ('cita','id_cita'),
        ('cita','id_paciente'),
        ('cita','id_odontologo'),
        ('cita','id_consultorio'),
        ('tratamiento','id_tratamiento'),
        ('cita_tratamiento','id_cita'),
        ('cita_tratamiento','id_tratamiento'),
        ('pago','id_pago'),
        ('pago','id_cita'),
        ('factura','id_factura'),
        ('factura','id_pago'),
        ('recordatorio','id_recordatorio'),
        ('recordatorio','id_cita'),
        ('rol','id'),
        ('proveedor','id'),
        ('servicio','id'),
        ('servicio','paciente_id'),
        ('password_reset_token','id_token'),
        ('password_reset_token','id_usuario')
),
actual AS (
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
)
SELECT rc.table_name, rc.column_name,
       CASE WHEN a.column_name IS NULL THEN 'FALTA' ELSE 'OK' END AS estado
FROM required_columns rc
LEFT JOIN actual a
  ON a.table_name = rc.table_name
 AND a.column_name = rc.column_name
ORDER BY CASE WHEN a.column_name IS NULL THEN 0 ELSE 1 END,
         rc.table_name,
         rc.column_name;

-- Columnas legacy que el backend actual NO utiliza y que deben haber sido
-- removidas en una migración completada.
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
      (table_name = 'servicio' AND column_name IN ('id_paciente', 'id_tratamiento'))
      OR (table_name = 'tratamiento' AND column_name = 'id_cita')
  )
ORDER BY table_name, column_name;

-- Relaciones esenciales del dominio.
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON tc.constraint_name = ccu.constraint_name
 AND tc.table_schema = ccu.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
 AND tc.constraint_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
