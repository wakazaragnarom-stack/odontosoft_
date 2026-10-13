# Arquitectura de OdontoSoft

## Patrón

OdontoSoft se estructura como un **monolito modular por capas**. Frontend y backend se despliegan como procesos separados durante el desarrollo, pero el repositorio agrupa ambos. PostgreSQL es la fuente de verdad; el frontend mantiene solo estado de presentación.

## Backend

```text
backend/app/
├── main.py                 # Composición FastAPI, middleware y montaje de rutas
├── api/routes/             # Adaptadores HTTP por módulo de negocio
├── core/security.py        # JWT, roles y autorización por recurso
├── db/session.py           # Engine, Base, SessionLocal y get_db
├── models.py               # Entidades SQLAlchemy
├── schemas.py              # Contratos Pydantic de la API
├── auth_schemas.py         # Contratos de autenticación
├── services/notifications.py # Adaptador para correo
└── utils.py                # Funciones auxiliares compartidas
```

Reglas de dependencia:

1. Las rutas son la capa de entrada HTTP y usan los esquemas y servicios/modelos necesarios.
2. La sesión de base de datos se define una sola vez en `db/session.py`.
3. Los modelos ORM no abren sesiones ni dependen de las rutas.
4. La autenticación/autorización se concentra en `core/security.py`; no debe duplicarse por módulo.
5. La persistencia usa PostgreSQL. No se crean tablas implícitamente en el arranque; los cambios de esquema se gestionan mediante migraciones SQL revisadas.
6. Las fachadas Python de la raíz solo mantienen compatibilidad temporal con imports antiguos; el código nuevo debe importar desde `backend.app`.

## Frontend

```text
src/
├── app/                    # Sesión y composición de la aplicación
├── features/
│   ├── auth/               # Login, registro público y recuperación
│   ├── backoffice/         # Navegación por rol y composición de módulos
│   ├── dashboard/
│   ├── appointments/
│   ├── clinical/
│   ├── odontogram/
│   └── billing/
├── shared/
│   ├── api/                # Cliente HTTP y declaraciones TypeScript
│   ├── components/         # UI reusable (Panel, tabla, CRUD genérico)
│   ├── lib/                # Adaptadores y utilidades de dominio compartidas
│   └── types.ts            # Tipos comunes del frontend
├── styles/                 # CSS global
└── main.tsx                # Punto de entrada Vite
```

Reglas frontend:

- Las funcionalidades viven en `features/`; la composición de la aplicación vive en `app/`.
- El acceso HTTP debe pasar por el cliente de `shared/api/client.js`, que adjunta el JWT y normaliza errores.
- Los tipos y componentes visuales compartidos no deben duplicarse dentro de cada funcionalidad.
- Los estados clínicos persistentes se leen y escriben mediante la API, no mediante almacenamiento local como fuente de verdad.
- Cada componente de negocio debe mostrar los errores de API de forma visible y no suponer que una respuesta vacía significa que el registro existe.

## Base de datos y operaciones

- `database/migrations`: cambios explícitos sobre el esquema PostgreSQL.
- `database/verify_schema.sql`: validación posterior a la migración.
- `scripts/create_admin.py`: bootstrap de la primera cuenta administrativa.
- `docs/`: documentación técnica y de seguridad.
- `.env.example`: plantilla; `.env` es local y nunca debe versionarse.

## Guía para nuevos módulos

1. Añade un router en `backend/app/api/routes/`.
2. Define o reutiliza esquemas en `backend/app/schemas.py`.
3. Coloca integraciones externas en `backend/app/services/`, no dentro del componente React.
4. Registra el router en `backend/app/main.py` y revisa las políticas de roles en `backend/app/core/security.py`.
5. Si cambia el esquema, añade migración SQL y actualiza `database/verify_schema.sql`.
6. Añade los componentes del frontend bajo `src/features/<modulo>/` y registra la navegación desde `src/features/backoffice/BackOffice.tsx`.
7. Ejecuta typecheck, build y compilación Python antes de integrar el cambio.
