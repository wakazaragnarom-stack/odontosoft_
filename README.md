# OdontoSoft — Unificación funcional

Esta rama consolida la interfaz React/TypeScript con el backend FastAPI existente y mantiene **PostgreSQL como única fuente de verdad y persistencia**.

## Estructura

- `src/`: aplicación React, cliente HTTP y capa de estado/cache.
- `docs/`: documentación técnica y de unificación.
- `main.py` y módulos `.py`: backend FastAPI/SQLAlchemy sobre PostgreSQL.
- `.github/workflows/`: validación automática de frontend y backend.

## Arquitectura

- Frontend: React + TypeScript + Vite.
- Backend: FastAPI + SQLAlchemy.
- Persistencia: PostgreSQL existente.
- Autenticación: JWT + bcrypt, con migración transparente de hashes SHA-256 heredados al iniciar sesión.
- Seguridad: CORS configurable, hosts permitidos opcionales, autorización por módulo y controles de acceso para recursos sensibles.

## Flujo clínico unificado

`Paciente → Cita → Atención → Historia clínica → Odontograma → Tratamiento → Pago → Factura`

Las operaciones definitivas pasan por la API FastAPI y persisten en PostgreSQL. El estado del frontend es representación/cache de la API, no una base de datos.

## Desarrollo local

### Frontend

```bash
npm install
npm run dev
```

### Backend

Configura las variables de entorno para PostgreSQL y JWT y ejecuta:

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

## Seguridad

Nunca subas `.env`, credenciales SMTP, contraseñas de PostgreSQL, claves JWT ni secretos de terceros. Usa `.env.example` como plantilla.
