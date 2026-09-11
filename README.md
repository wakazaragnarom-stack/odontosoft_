# OdontoSoft — Unificación funcional

Esta rama (`unificacion-funcional`) consolida las capacidades útiles de los dos proyectos de OdontoSoft. La fuente de verdad de datos es **PostgreSQL mediante el backend FastAPI**.

## Objetivo de la rama

Conservar del proyecto moderno la experiencia de usuario, seguridad de sesión, organización por módulos y mejoras de flujo, y llevarlas al proyecto odontológico existente sin duplicar la base de datos.

## Flujo clínico

`Paciente → Cita → Atención → Historia clínica → Odontograma → Tratamiento → Pago → Factura`

## Arquitectura

- `main.tsx` → entrada de la interfaz React.
- `App.tsx` → entrada estable del workspace unificado.
- `UnifiedApp.tsx` → interfaz operativa.
- `main.py` → API FastAPI.
- PostgreSQL → persistencia real y fuente de verdad.
- `database.py` → conexión y pool de PostgreSQL; no crea tablas al arrancar.
- `security.py` → JWT, sesiones y autorización base por rol.
- `auth.py` → autenticación contra la tabla `Usuario` y migración progresiva de hashes antiguos.
- `api.js` → cliente HTTP con Bearer token para los módulos frontend.
- Los archivos PHP/HTML/JS/Python heredados se conservan como referencia mientras se migran funcionalidades, no como una segunda aplicación de datos.

## Seguridad incorporada

- JWT firmado para las sesiones del backend.
- Contraseñas nuevas con bcrypt.
- Migración transparente de hashes SHA-256 heredados al iniciar sesión correctamente.
- CORS configurado por variable de entorno, sin `*` por defecto.
- No se crean ni modifican tablas automáticamente al iniciar la API.
- Errores de base de datos no exponen SQL interno al cliente.
- Variables sensibles fuera del código fuente mediante `.env`.

## Ejecutar frontend

```bash
npm install
npm run dev
```

## Ejecutar backend

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Configura `DATABASE_URL`, `JWT_SECRET` y `CORS_ORIGINS` mediante variables de entorno.

## Validación

```bash
npm run lint
npm run build
pip install -r requirements.txt
python -m compileall -q *.py
```
