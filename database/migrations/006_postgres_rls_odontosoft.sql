-- 006: defensa en profundidad con PostgreSQL RLS y registro de OdontoSoft.
-- Ejecutar tras 003, 004 y 005. Hacer backup antes.
BEGIN;

-- OdontoSoft es la empresa operadora/plataforma. No se vincula al usuario SuperAdmin
-- ni se le asignan automáticamente datos clínicos de clientes.
INSERT INTO empresa_odontosoft
  (nombre, correo_contacto, cuota_mensual, estado_pago, estado_servicio)
SELECT 'OdontoSoft', 'admin@odontosoft.co', 0, 'al_dia', 'activo'
WHERE NOT EXISTS (
  SELECT 1 FROM empresa_odontosoft WHERE lower(trim(nombre)) = 'odontosoft'
);

-- Quitar unicidad global heredada: documento/nombre se hacen únicos dentro del tenant.
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname, conrelid::regclass AS table_name
    FROM pg_constraint
    WHERE contype = 'u'
      AND (
        (conrelid = 'paciente'::regclass AND pg_get_constraintdef(oid) ~ '^UNIQUE \(documento\)$')
        OR (conrelid = 'odontologo'::regclass AND pg_get_constraintdef(oid) ~ '^UNIQUE \(documento\)$')
        OR (conrelid = 'rol'::regclass AND pg_get_constraintdef(oid) ~ '^UNIQUE \(nombre\)$')
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.table_name, c.conname);
  END LOOP;
END $$;

DROP INDEX IF EXISTS uq_paciente_empresa_documento;
DROP INDEX IF EXISTS uq_odontologo_empresa_documento;
CREATE UNIQUE INDEX IF NOT EXISTS uq_paciente_empresa_documento
  ON paciente(id_empresa, documento)
  WHERE id_empresa IS NOT NULL AND documento IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_odontologo_empresa_documento
  ON odontologo(id_empresa, documento)
  WHERE id_empresa IS NOT NULL AND documento IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_rol_empresa_nombre
  ON rol(id_empresa, nombre)
  WHERE id_empresa IS NOT NULL AND nombre IS NOT NULL;

-- Políticas de tenant: sin app.tenant_id, las tablas clínicas no devuelven ni aceptan filas.
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'paciente','consultorio','odontologo','historia_clinica','odontograma',
    'historia_clinica_detallada','cita','tratamiento','recordatorio',
    'pago','factura','rol','proveedor','servicio'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (id_empresa = NULLIF(current_setting(''app.tenant_id'', true), '''')::integer) WITH CHECK (id_empresa = NULLIF(current_setting(''app.tenant_id'', true), '''')::integer)',
      tbl
    );
  END LOOP;
END $$;

-- Tablas de asociación: solo permiten enlaces cuyos dos extremos pertenecen al tenant.
ALTER TABLE usuario_paciente ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_paciente FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON usuario_paciente;
CREATE POLICY tenant_isolation ON usuario_paciente
USING (
  EXISTS (SELECT 1 FROM usuario u WHERE u.id_usuario = usuario_paciente.id_usuario
    AND u.id_empresa = NULLIF(current_setting('app.tenant_id', true), '')::integer)
  AND EXISTS (SELECT 1 FROM paciente p WHERE p.id_paciente = usuario_paciente.id_paciente
    AND p.id_empresa = NULLIF(current_setting('app.tenant_id', true), '')::integer)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM usuario u WHERE u.id_usuario = usuario_paciente.id_usuario
    AND u.id_empresa = NULLIF(current_setting('app.tenant_id', true), '')::integer)
  AND EXISTS (SELECT 1 FROM paciente p WHERE p.id_paciente = usuario_paciente.id_paciente
    AND p.id_empresa = NULLIF(current_setting('app.tenant_id', true), '')::integer)
);

ALTER TABLE usuario_tratamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_tratamiento FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON usuario_tratamiento;
CREATE POLICY tenant_isolation ON usuario_tratamiento
USING (
  EXISTS (SELECT 1 FROM usuario u WHERE u.id_usuario = usuario_tratamiento.id_usuario
    AND u.id_empresa = NULLIF(current_setting('app.tenant_id', true), '')::integer)
  AND EXISTS (SELECT 1 FROM tratamiento t WHERE t.id_tratamiento = usuario_tratamiento.id_tratamiento
    AND t.id_empresa = NULLIF(current_setting('app.tenant_id', true), '')::integer)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM usuario u WHERE u.id_usuario = usuario_tratamiento.id_usuario
    AND u.id_empresa = NULLIF(current_setting('app.tenant_id', true), '')::integer)
  AND EXISTS (SELECT 1 FROM tratamiento t WHERE t.id_tratamiento = usuario_tratamiento.id_tratamiento
    AND t.id_empresa = NULLIF(current_setting('app.tenant_id', true), '')::integer)
);

ALTER TABLE cita_tratamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE cita_tratamiento FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON cita_tratamiento;
CREATE POLICY tenant_isolation ON cita_tratamiento
USING (
  EXISTS (SELECT 1 FROM cita c WHERE c.id_cita = cita_tratamiento.id_cita
    AND c.id_empresa = NULLIF(current_setting('app.tenant_id', true), '')::integer)
  AND EXISTS (SELECT 1 FROM tratamiento t WHERE t.id_tratamiento = cita_tratamiento.id_tratamiento
    AND t.id_empresa = NULLIF(current_setting('app.tenant_id', true), '')::integer)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM cita c WHERE c.id_cita = cita_tratamiento.id_cita
    AND c.id_empresa = NULLIF(current_setting('app.tenant_id', true), '')::integer)
  AND EXISTS (SELECT 1 FROM tratamiento t WHERE t.id_tratamiento = cita_tratamiento.id_tratamiento
    AND t.id_empresa = NULLIF(current_setting('app.tenant_id', true), '')::integer)
);

COMMIT;
