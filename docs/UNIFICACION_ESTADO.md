# OdontoSoft — estado de la unificación

## Rama activa

unificacion-funcional

## Arquitectura actual

El repositorio está organizado como monolito modular:
- Frontend React/TypeScript/Vite en src/, agrupado por funcionalidad en src/features/.
- Backend FastAPI en backend/app/, organizado por rutas, seguridad, persistencia, modelos, esquemas y servicios.
- PostgreSQL como única fuente de datos persistente.
- Migraciones SQL explícitas en database/migrations/.
- Documentación técnica y flujo de CI bajo docs/ y .github/workflows/.

## Módulos frontend

- Autenticación, registro de paciente y recuperación de contraseña.
- Backoffice y dashboard según rol.
- Agenda de citas.
- Historia clínica detallada.
- Odontograma visual independiente con dentición permanente y temporal, estados por color, observaciones y guardado por paciente.
- Pagos y facturación.

## Módulos API

Autenticación y usuarios; pacientes y odontólogos; consultorios y citas; historias clínicas y odontogramas; tratamientos, servicios, pagos, facturas, proveedores, roles y recordatorios.

## Flujo clínico

Paciente → Cita → Atención → Historia clínica → Odontograma → Tratamiento → Pago → Factura

Las operaciones persistentes deben pasar por FastAPI hacia PostgreSQL. El frontend puede mantener estado de presentación, pero no debe ser fuente de verdad para datos clínicos o financieros.

## Reglas para cambios futuros

1. Nuevas rutas dentro de backend/app/api/routes/.
2. Política de seguridad central en backend/app/core/security.py.
3. Cambios de esquema mediante migración SQL revisada; no crear tablas automáticamente al arrancar.
4. Nuevos componentes bajo src/features/<modulo>/.
5. Cliente HTTP, tipos y componentes comunes en src/shared/.
6. Ejecutar el tipado, build y comprobación de importación en CI.
7. Tratar como deuda técnica la extracción gradual de servicios/repositorios desde endpoints que todavía contienen consultas SQLAlchemy.
