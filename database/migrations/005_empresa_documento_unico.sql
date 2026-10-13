-- 005: unicidad de documentos dentro de cada empresa, no a nivel global.
-- Permite que dos clínicas distintas registren al mismo paciente/odontólogo.
-- Los registros heredados sin empresa quedan fuera del índice hasta su asignación.
BEGIN;

DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname, conrelid::regclass AS table_name
    FROM pg_constraint
    WHERE contype = 'u'
      AND conrelid IN ('paciente'::regclass, 'odontologo'::regclass)
      AND pg_get_constraintdef(oid) ~ '^UNIQUE \(documento\)$'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.table_name, c.conname);
  END LOOP;
END $$;

DROP INDEX IF EXISTS ix_paciente_empresa_documento;
DROP INDEX IF EXISTS ix_odontologo_empresa_documento;

CREATE UNIQUE INDEX IF NOT EXISTS uq_paciente_empresa_documento
    ON paciente (id_empresa, documento)
    WHERE id_empresa IS NOT NULL AND documento IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_odontologo_empresa_documento
    ON odontologo (id_empresa, documento)
    WHERE id_empresa IS NOT NULL AND documento IS NOT NULL;

COMMIT;
