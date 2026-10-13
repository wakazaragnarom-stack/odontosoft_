-- 004: aislamiento multiempresa para los datos clínicos y operativos.
-- Backup obligatorio. Los registros existentes quedan con id_empresa NULL deliberadamente;
-- deben asignarse a su clínica real tras verificar su procedencia.
BEGIN;
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'paciente','consultorio','odontologo','historia_clinica','odontograma',
    'historia_clinica_detallada','cita','tratamiento','recordatorio','pago',
    'factura','rol','proveedor','servicio'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS id_empresa INTEGER REFERENCES empresa_odontosoft(id_empresa) ON DELETE RESTRICT', tbl);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (id_empresa)', 'ix_' || tbl || '_id_empresa', tbl);
  END LOOP;
END $$;
CREATE INDEX IF NOT EXISTS ix_paciente_empresa_documento ON paciente(id_empresa, documento);
CREATE INDEX IF NOT EXISTS ix_odontologo_empresa_documento ON odontologo(id_empresa, documento);
COMMIT;
