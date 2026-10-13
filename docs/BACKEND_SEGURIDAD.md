# Backend y seguridad de OdontoSoft

## Decisiones vigentes

- PostgreSQL es la fuente de verdad para usuarios, pacientes, citas, historias clínicas, odontogramas, tratamientos, pagos y facturas.
- El login emite JWT Bearer tokens.
- Las contraseñas nuevas usan bcrypt; los hashes SHA-256 heredados pueden verificarse y migrarse tras un login válido.
- El registro público crea pacientes y no permite otorgar roles privilegiados.
- DATABASE_URL tiene prioridad sobre variables PostgreSQL separadas.
- CORS se configura con CORS_ORIGINS; TrustedHost puede activarse con ALLOWED_HOSTS.
- La API no ejecuta Base.metadata.create_all() en el arranque.
- Los routers usan dependencias centrales de backend/app/core/security.py para autorización por módulo y control de acceso a recursos clínicos.

## Capas de código

- backend/app/api/routes: endpoints.
- backend/app/core/security.py: JWT, roles y permisos.
- backend/app/db/session.py: SQLAlchemy y sesiones.
- backend/app/models.py y schemas.py: persistencia y contratos de API.
- backend/app/services/notifications.py: envío de correo.

## Mejoras de seguridad pendientes

- Auditoría persistente de cambios sensibles.
- Limitación de intentos y protección contra fuerza bruta en login y recuperación.
- Revisión recurso por recurso de las operaciones de lectura/escritura, especialmente cuando hay asociaciones entre pacientes, odontólogos y citas.
- Pruebas automatizadas de autorización para asegurar que un paciente no acceda a datos de otra persona y un odontólogo no acceda a pacientes no asignados.
- Validación transaccional de operaciones clínicas y financieras.

Los cambios en permisos deben acompañarse de pruebas de regresión; no se debe depender exclusivamente de ocultar botones en el frontend.
