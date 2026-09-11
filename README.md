# OdontoSoft — Unificación funcional

Esta rama (`unificacion-funcional`) consolida las capacidades útiles de los dos proyectos de OdontoSoft en una sola aplicación React + TypeScript.

## Flujo clínico unificado

`Paciente → Cita → Atención → Historia clínica → Odontograma → Tratamiento → Pago → Factura`

El módulo administrativo comparte el mismo contexto de clínica (`tenantId`) e incorpora proveedores e insumos.

## Arquitectura actual

- `main.tsx` es el único punto de entrada de la interfaz.
- `UnifiedApp.tsx` contiene el workspace unificado y los módulos operativos.
- `lib/store.ts` es la fachada de datos actual y mantiene compatibilidad con los modelos heredados.
- `lib/unifiedDomain.ts` define el contrato canónico para futuras migraciones de persistencia.
- `lib/unificationAdapters.ts` traduce entidades heredadas al dominio canónico.
- Los componentes heredados y archivos PHP/Python permanecen en la rama como referencia de funcionalidades pendientes de migración completa.

## Ejecutar

```bash
npm install
npm run dev
```

Para validar tipos:

```bash
npm run lint
```

## Estado

La rama ya tiene una experiencia React unificada y funcional para agenda, pacientes, historia clínica/odontograma, tratamientos, pagos/facturación y proveedores. La persistencia definitiva en Firebase/API y la retirada progresiva del legado son la siguiente etapa de consolidación.
