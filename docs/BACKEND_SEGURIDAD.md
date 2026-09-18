# Backend y seguridad — fase PostgreSQL

## Decisiones

OdontoSoft usa PostgreSQL como única fuente de verdad. Firebase no participa en la persistencia de usuarios, pacientes, citas, historias, tratamientos, pagos ni facturas.

## Mejoras incorporadas

1. **JWT de acceso**
   - El login emite un Bearer token firmado.
   - El token contiene usuario, correo, rol, emisión, expiración y `jti`.
   - Las rutas protegidas requieren `Authorization: Bearer <token>`.

2. **Contraseñas**
   - Las contraseñas nuevas se almacenan con bcrypt.
   - Los hashes SHA-256 heredados siguen siendo verificables temporalmente.
   - Tras un login correcto, un hash heredado se convierte automáticamente a bcrypt.

3. **Autorización**
   - Los roles heredados (`Paciente`, `Odontologo`, `Administrador`, etc.) se normalizan al modelo de permisos actual.
   - El registro público sólo puede crear pacientes; nunca privilegios administrativos.

4. **PostgreSQL**
   - `DATABASE_URL` tiene prioridad sobre variables separadas.
   - Se elimina la contraseña por defecto del código.
   - Se desactiva `echo=True` para no volcar SQL al log.
   - La API no ejecuta `Base.metadata.create_all()` al arrancar.

5. **HTTP**
   - CORS se controla con `CORS_ORIGINS`.
   - `TrustedHostMiddleware` puede activarse mediante `ALLOWED_HOSTS`.
   - Los errores de SQLAlchemy no devuelven el detalle interno de la base de datos.

## Próxima capa

La siguiente implementación debe llevar el control de permisos desde nivel de ruta a nivel de recurso: un paciente sólo puede consultar sus propios registros, un odontólogo sólo sus pacientes/citas autorizados y un administrador sólo los recursos de su clínica.

También debe incorporarse auditoría persistente de acciones sensibles, bloqueo/rate limit de intentos de login y validación transaccional de operaciones clínicas y financieras.
