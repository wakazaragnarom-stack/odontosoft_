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


## Google Calendar compartido y avisos a odontólogos

1. En Google Cloud activa Google Calendar API y crea una cuenta de servicio.
2. Descarga el JSON de credenciales y guárdalo fuera del repositorio.
3. Crea el calendario de la clínica y compártelo con el correo de la cuenta de servicio, con permiso para modificar eventos.
4. Configura GOOGLE_CALENDAR_ID y GOOGLE_CALENDAR_CREDENTIALS_FILE en .env. La ruta al JSON debe ser accesible desde el backend.
5. Configura SMTP real (MAIL_USERNAME, MAIL_PASSWORD y MAIL_FROM) para enviar correos.

Ejecuta una sola vez database/migrations/002_google_calendar.sql sobre la base de datos correcta. La API no aplica migraciones automáticamente. PostgreSQL sigue siendo la fuente principal; si Google no está configurado o no responde, la operación de cita continúa y el error queda en los logs. Se usa America/Bogota y se minimizan los datos visibles en el calendario compartido.

No subas el JSON de credenciales ni secretos SMTP a GitHub.


## Consola SuperAdmin SaaS

La consola SuperAdmin registra empresas cliente, consulta cuotas y vencimientos, y marca pagos o suspensiones. Ejecuta `database/migrations/003_superadmin_empresas.sql` una sola vez sobre PostgreSQL antes de iniciar la API. Para crear el único SuperAdmin, ejecuta `python -m scripts.create_superadmin` desde la raíz y escribe el correo reservado `darekpumajoseph@gmail.com` y la contraseña en la terminal (la entrada queda oculta). No se incluye ninguna contraseña en Git.

**Importante:** esta entrega separa la consola y deniega al SuperAdmin los endpoints de operación clínica. El aislamiento de datos entre múltiples empresas aún requiere migrar las tablas clínicas existentes y aplicar filtros por `id_empresa` en todas las rutas; no debe usarse todavía como una plataforma multiempresa con datos reales de varias clínicas en una misma base compartida.
