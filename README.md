# OdontoSoft

OdontoSoft es una aplicación odontológica con frontend React/TypeScript/Vite, API FastAPI y PostgreSQL como única fuente de verdad.

## Arquitectura

El proyecto está organizado como un **monolito modular por capas**:

- src/app: composición de la aplicación y sesión.
- src/features: autenticación, backoffice, agenda, historia clínica, odontograma, facturación y dashboard.
- src/shared: cliente HTTP, tipos, componentes y utilidades compartidas.
- backend/app/api/routes: endpoints HTTP agrupados por módulo.
- backend/app/core: seguridad, JWT y autorización.
- backend/app/db: conexión, motor y sesiones de PostgreSQL.
- backend/app/models.py: modelos SQLAlchemy.
- backend/app/schemas.py y auth_schemas.py: contratos Pydantic.
- backend/app/services: integraciones, como el envío de correos.
- database/migrations: cambios de esquema explícitos.
- scripts: tareas operativas, por ejemplo crear el primer administrador.
- docs/ARQUITECTURA.md: mapa, responsabilidades y reglas de dependencias.

La implementación Python canónica está dentro de backend/app. En la raíz se mantiene main.py como entrada de compatibilidad para que siga funcionando el comando uvicorn main:app; el resto de módulos se importa desde el paquete backend.app.

## Requisitos

- Node.js y npm.
- Python 3.12 o una versión compatible con las dependencias del proyecto.
- PostgreSQL iniciado, una base de datos existente y el esquema sincronizado.
- Un archivo .env local. No subas secretos a GitHub.

## Configurar el entorno

Desde la raíz del proyecto, crea tu configuración a partir de la plantilla:

    Copy-Item .env.example .env

Completa las variables PostgreSQL/JWT. Puedes usar DATABASE_URL o las variables DB_USER, DB_PASSWORD, DB_HOST, DB_PORT y DB_NAME. Para enviar correos reales, configura credenciales SMTP válidas; la configuración de ejemplo sólo permite inicializar el backend.

La API no crea tablas automáticamente al arrancar. Usa las migraciones SQL revisadas y realiza una copia de seguridad antes de cambiar una base de datos con datos reales.

## Iniciar el proyecto

Abre dos terminales desde la raíz.

**Terminal 1 — backend:**

    python -m pip install -r requirements.txt
    python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

También se conserva el comando compatible:

    python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

**Terminal 2 — frontend:**

    npm install
    npm run dev

Aplicación: http://localhost:5173

Documentación de la API: http://localhost:8000/docs

## Primer administrador

Con PostgreSQL configurado y accesible, ejecuta desde la raíz:

    python -m scripts.create_admin

Este comando sirve para crear la primera cuenta administrativa de la base de datos; no se repite cada vez que abres el sistema.

## Validar cambios

    npm run lint
    npm run build
    python -m compileall -q backend scripts main.py

GitHub Actions también comprueba el tipado, el build de frontend, la compilación Python y la importación de la aplicación.

## Seguridad de secretos

.env, contraseñas y claves privadas deben permanecer fuera del repositorio. .env.example es sólo una plantilla sin credenciales reales.
