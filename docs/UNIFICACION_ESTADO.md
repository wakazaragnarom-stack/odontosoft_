# OdontoSoft — Estado de unificación funcional

## Rama
`unificacion-funcional`

## Objetivo
Consolidar el dominio clínico y administrativo de los dos proyectos en una única aplicación moderna.

## Primera fase completada
- Contratos de dominio unificados en `lib/unifiedDomain.ts`.
- Roles: superadmin, clinic_admin, dentist, patient y proveedores.
- Entidades base: tenants, usuarios, pacientes, odontólogos, consultorios, citas, historia clínica, tratamientos, servicios, pagos, facturas, proveedores, inventario y auditoría.
- Estados de citas con transiciones explícitas para impedir cambios inválidos.

## Reglas de integración
1. React/TypeScript será la interfaz principal.
2. La funcionalidad PHP/HTML/JS/Python del proyecto anterior se migra por comportamiento, no por copia de código.
3. `tenantId` debe mantenerse en todas las entidades clínicas y administrativas que pertenezcan a una clínica.
4. La historia clínica pertenece al paciente y puede asociarse a una cita y odontólogo.
5. Citas, tratamientos, pagos y facturas deben poder relacionarse sin duplicar información.
6. Proveedores e inventario quedan como módulo administrativo separado del expediente clínico.
7. El legado se conserva temporalmente solo como referencia hasta completar la migración.

## Próximos módulos
- Reemplazar modelos duplicados por adaptadores del dominio unificado.
- Conectar los dashboards con una única capa de datos.
- Integrar citas y atención de cita.
- Integrar historia clínica detallada y odontograma.
- Integrar tratamientos, pagos y facturación.
- Integrar proveedores e inventario.
- Ejecutar validación TypeScript/build y corregir regresiones.
- Retirar archivos legacy cuando ya no tengan consumidores.
