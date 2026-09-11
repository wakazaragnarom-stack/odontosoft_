# OdontoSoft — Unificación funcional

Esta rama consolida la interfaz React/TypeScript con el backend FastAPI existente y mantiene **PostgreSQL como única fuente de verdad y persistencia**.

## Arquitectura

- Frontend: React + TypeScript + Vite.
- Backend: FastAPI + SQLAlchemy.
- Persistencia: PostgreSQL existente.
- Autenticación: JWT + bcrypt, con migración transparente de hashes SHA-256 heredados al iniciar sesión.
- Seguridad: CORS configurable, hosts permitidos opcionales, autorización por módulo y controles de acceso para recursos sensibles.
- CI: validación separada de frontend y backend.

## Flujo clínico unificado

`Paciente → Cita → Atención → Historia clínica → Odontograma → Tratamiento → Pago → Factura`

Las operaciones definitivas deben pasar por la API FastAPI y persistir en PostgreSQL. El estado del frontend se usa solo como representación/cache de la API, no como base de datos.

## Autenticación

El frontend utiliza el token Bearer emitido por `/auth/login` y `/auth/me` para recuperar la identidad actual. El registro público está limitado al flujo de paciente; la creación de usuarios privilegiados debe hacerse desde endpoints protegidos.

## Desarrollo local

### Frontend

```bash
npm install
npm run dev
```

### Backend

Configura las variables de entorno para PostgreSQL y JWT, instala dependencias y ejecuta:

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

No se crean tablas automáticamente al arrancar la aplicación; la base PostgreSQL existente permanece bajo control de su esquema y migraciones.

## Validación

```bash
npm run lint
npm run build
pip install -r requirements.txt
python -m compileall -q *.py
```
