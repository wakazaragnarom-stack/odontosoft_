# OdontoSoft

OdontoSoft es un monolito modular con frontend React/TypeScript/Vite, API FastAPI y PostgreSQL como fuente única de verdad.

## Arquitectura

- `src/app`: composición y sesión de la aplicación.
- `src/features`: funcionalidades de negocio del frontend (autenticación, agenda, historia clínica, odontograma, facturación y administración).
- `src/shared`: cliente HTTP, tipos, componentes reutilizables y utilidades compartidas.
- `backend/app/api/routes`: routers HTTP, validación de solicitudes y respuestas.
- `backend/app/core`: seguridad y componentes transversales.
- `backend/app/db`: motor SQLAlchemy y sesiones de PostgreSQL.
- `backend/app/models.py`: modelos ORM.
- `backend/app/schemas.py` y `auth_schemas.py`: contratos Pydantic.
- `backend/app/services`: integraciones y servicios (por ejemplo, correo).
- `database/migrations`: migraciones SQL explícitas; la API no crea tablas automáticamente.
- `scripts`: tareas operativas, como crear el primer administrador.
- `docs/ARQUITECTURA.md`: reglas, responsabilidades y flujo de dependencias.

Los módulos raíz `database.py`, `models.py`, `schemas.py`, `auth_schemas.py`, `security.py`, `utils.py` y `notifications.py` son fachadas de compatibilidad para importaciones heredadas. La implementación canónica está en `backend/app`.

## Requisitos

- Node.js y npm.
- Python 3.12 o una versión compatible con las dependencias.
- PostgreSQL iniciado, con la base de datos existente y el esquema alineado.
- Un archivo `.env` local en la raíz. No subas este archivo a GitHub.

## Configuración local

Copia la plantilla y completa las variables de PostgreSQL, JWT y, si se van a enviar correos, SMTP:

```powershell
Copy-Item .env.example .env
```

Usa `DATABASE_URL` o las variables `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` y `DB_NAME`. No incluyas credenciales reales en documentación ni en el repositorio.

## Iniciar en desarrollo

Terminal 1 — backend (desde la raíz):

```powershell
python -m pip install -r requirements.txt
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

También se conserva el comando legado `python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload`.

Terminal 2 — frontend:

```powershell
npm install
npm run dev
```

Abre `http://localhost:5173`; la documentación de la API está en `http://localhost:8000/docs`.

## Primer administrador

Con PostgreSQL configurado y el backend ya conectado a la base de datos:

```powershell
python -m scripts.create_admin
```

Este comando crea la cuenta inicial; no se necesita repetir para cada inicio del sistema. No uses el registro público para crear usuarios privilegiados.

## Validación local

```powershell
npm run lint
npm run build
python -m compileall -q backend scripts main.py
```
