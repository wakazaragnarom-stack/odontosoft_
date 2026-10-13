# Arquitectura de OdontoSoft

## Patrón arquitectónico

OdontoSoft sigue un **monolito modular por capas**. El frontend y el backend funcionan como procesos separados en desarrollo; el backend expone una API HTTP y PostgreSQL es la fuente única de persistencia.

## Estructura

    odontosoft_/
    ├── backend/
    │   └── app/
    │       ├── main.py
    │       ├── api/routes/
    │       ├── core/security.py
    │       ├── db/session.py
    │       ├── models.py
    │       ├── schemas.py
    │       ├── auth_schemas.py
    │       ├── services/notifications.py
    │       └── utils.py
    ├── src/
    │   ├── app/
    │   ├── features/
    │   │   ├── auth/
    │   │   ├── backoffice/
    │   │   ├── dashboard/
    │   │   ├── appointments/
    │   │   ├── clinical/
    │   │   ├── odontogram/
    │   │   └── billing/
    │   ├── shared/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── lib/
    │   │   └── types.ts
    │   ├── styles/
    │   └── main.tsx
    ├── database/
    │   ├── migrations/
    │   └── verify_schema.sql
    ├── scripts/
    ├── docs/
    └── .github/workflows/

## Responsabilidades del backend

- **API/routes:** adaptan las solicitudes HTTP, validan entradas mediante esquemas, aplican dependencias de autorización y coordinan operaciones de datos.
- **Core:** autenticación JWT, normalización de roles y políticas de acceso.
- **DB:** configuración de SQLAlchemy, motor, sesiones y dependencia get_db.
- **Models:** mapeo ORM del esquema PostgreSQL existente.
- **Schemas:** contratos de entrada/salida; no deben mezclar detalles de UI.
- **Services:** integraciones externas, como SMTP, y lógica reutilizable que no pertenece al protocolo HTTP.
- **Utils:** utilidades comunes. La lógica nueva debe colocarse en el módulo de negocio adecuado cuando deje de ser una utilidad general.

Los routers actuales conservan consultas SQLAlchemy dentro de algunos endpoints. Para nuevas funcionalidades complejas, extrae la lógica de negocio a servicios y la consulta/reutilización de datos a repositorios; no copies consultas entre routers.

## Responsabilidades del frontend

- **App:** composición, sesión y punto de entrada de la aplicación.
- **Features:** componentes propios de cada módulo funcional.
- **Shared API:** único cliente HTTP, adjunta el JWT y normaliza errores.
- **Shared components:** tabla, formularios genéricos y piezas visuales reutilizables.
- **Shared types/lib:** contratos y adaptadores compartidos; la memoria del navegador no reemplaza PostgreSQL.

## Reglas para contribuir

1. Importa backend desde backend.app...; no vuelvas a crear módulos Python planos en la raíz.
2. Registra cada router nuevo en backend/app/main.py.
3. Centraliza los permisos en backend/app/core/security.py y aplica controles por recurso cuando una ruta recibe un identificador de paciente/cita.
4. No crees tablas al iniciar. Incluye cambios de esquema en database/migrations y actualiza database/verify_schema.sql cuando corresponda.
5. En frontend, coloca cada módulo nuevo en src/features/<modulo>/ y comparte API/tipos/UI mediante src/shared/.
6. Añade validaciones de CI para importación, tipado y build.
7. Mantén .env fuera de GitHub; modifica sólo .env.example con variables de ejemplo sin secretos.
8. El punto de entrada main.py de la raíz se conserva sólo para compatibilidad de ejecución.

## Comandos principales

    python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
    npm run dev
    python -m scripts.create_admin
