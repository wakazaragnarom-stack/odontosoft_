-- Registro de empresas SaaS para la consola SuperAdmin.
-- Ejecutar una sola vez en PostgreSQL y hacer copia de seguridad antes.
CREATE TABLE IF NOT EXISTS empresa_odontosoft (
    id_empresa SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    correo_contacto VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    cuota_mensual NUMERIC(12,2) NOT NULL DEFAULT 0,
    fecha_vencimiento DATE,
    fecha_ultimo_pago DATE,
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado_pago IN ('al_dia', 'pendiente', 'vencido')),
    estado_servicio VARCHAR(20) NOT NULL DEFAULT 'activo'
        CHECK (estado_servicio IN ('activo', 'suspendido')),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS id_empresa INTEGER
    REFERENCES empresa_odontosoft(id_empresa) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS ix_usuario_id_empresa ON usuario(id_empresa);
