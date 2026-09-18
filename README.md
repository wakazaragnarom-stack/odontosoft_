# OdontoSoft — Unificación funcional

OdontoSoft integra un frontend React/TypeScript con un backend FastAPI existente y mantiene **PostgreSQL como única fuente de verdad y persistencia**.

## Estructura

- `src/`: aplicación React, cliente HTTP y estado de presentación.
- `docs/`: documentación técnica.
- `main.py` y módulos `.py`: backend FastAPI/SQLAlchemy.
- `.github/workflows/`: CI de frontend y backend.

## Arquitectura

Frontend: React + TypeScript + Vite.

Backend: FastAPI + SQLAlchemy.

Persistencia: PostgreSQL existente.

Autenticación: JWT + bcrypt, incluyendo migración transparente de hashes SHA-256 heredados.

Seguridad: CORS configurable, Trusted Host opcional, autorización por módulo y controles de acceso a recursos clínicos y administrativos.

## Flujo clínico

`Paciente → Cita → Atención → Historia clínica → Odontograma → Tratamiento → Pago → Factura`

Las operaciones definitivas pasan por FastAPI y persisten en PostgreSQL. El estado React es una representación/cache y no reemplaza la base de datos.

## Desarrollo

### Frontend

```bash
npm install
npm run dev
```

### Backend

Configura las variables de entorno de PostgreSQL y JWT y ejecuta:

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

La aplicación no crea tablas automáticamente al arrancar.

## Validación

```bash
npm install
npm run lint
npm run build
pip install -r requirements.txt
python -m compileall -q *.py
```

## Seguridad de secretos

`.env` no forma parte del repositorio. Usa `.env.example` como plantilla y configura los secretos mediante variables de entorno o el proveedor de despliegue.

## Acceso web

La aplicación inicia con una pantalla de autenticación JWT. Los pacientes pueden registrarse desde la propia interfaz; los administradores pueden crear usuarios desde el panel y también existe un bootstrap local para el primer administrador:

```bash
python scripts/create_admin.py
```

Después de autenticar, el menú se adapta al rol y expone los módulos que el backend autoriza. Los perfiles de paciente y odontólogo reciben su identificador asociado desde `/auth/me` para poder consultar sus recursos sin saltarse las reglas de acceso.

Frontend:
```bash
npm install
npm run dev
```

Backend:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Swagger:
```
http://localhost:8000/docs
```
