# OdontoSoft — Unificación funcional

## Objetivo

Convertir el repositorio híbrido en una sola aplicación clínica coherente. React/TypeScript será la interfaz y capa de aplicación; las reglas funcionales rescatadas del proyecto PHP/Python se expresan como módulos del dominio y API.

## Módulos funcionales definitivos

1. Autenticación y sesiones
2. Multi-clínica (tenant)
3. Usuarios y roles
4. Pacientes
5. Odontólogos
6. Consultorios
7. Agenda y citas
8. Atención de cita
9. Historia clínica
10. Preguntas/formularios de historia clínica
11. Diagnósticos y tratamientos
12. Servicios
13. Pagos y facturación
14. Recordatorios
15. Proveedores e inventario de insumos
16. Portal del paciente
17. Correo
18. Google Calendar
19. Seguridad/auditoría

## Roles

- `superadmin`: administra la plataforma y tenants.
- `clinic_admin`: administra una clínica, usuarios, agenda, catálogo y facturación.
- `dentist`: atiende pacientes, agenda, historia clínica y tratamientos.
- `patient`: consulta citas, historia autorizada, tratamientos y pagos.
- `proveedores`: gestión de proveedores/catálogo/pedidos.

## Regla de unificación

No se incorporará PHP como segunda aplicación. Las pantallas HTML/CSS/JS antiguas se consideran referencia funcional. Las implementaciones definitivas viven en React/TypeScript y consumen una única capa API.

## Mapa de rescate del sistema anterior

| Legado | Destino |
|---|---|
| usuarios/login | auth + users |
| tratamientos | treatments |
| citas + atender cita | appointments + encounters |
| historial clínico | clinical records |
| preguntas de historia | clinical form templates |
| consultorios | clinics/offices |
| facturas | billing |
| pagos | billing/payments |
| recordatorios | reminders |
| proveedores | suppliers/inventory |
| servicios | services |

## Reglas críticas

- Toda entidad clínica debe estar asociada a `tenantId`.
- El frontend no decide permisos: debe consumir permisos derivados de la sesión.
- No se deben generar usuarios ficticios para simular autenticación en producción.
- La contraseña nunca se almacena en el frontend ni en texto plano.
- Historia clínica y facturación requieren auditoría.
- Los estados de citas deben tener transiciones controladas.
- Las integraciones externas son adaptadores, no la fuente de verdad clínica.

## Orden de implementación

### Fase 1 — núcleo
Auth, tenants, usuarios, roles, pacientes, odontólogos y consultorios.

### Fase 2 — operación clínica
Citas, agenda, atención de cita, historia clínica, preguntas y tratamientos.

### Fase 3 — dinero
Servicios, pagos, facturas y estados de cuenta.

### Fase 4 — abastecimiento
Proveedores, productos/insumos, inventario y pedidos.

### Fase 5 — integraciones
Correo, Google Calendar, recordatorios y eventos.

### Fase 6 — endurecimiento
Auditoría, validación, pruebas, eliminación del legado y documentación.
