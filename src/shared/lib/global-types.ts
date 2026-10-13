import type { Pago as PagoType, PatientRecord as PatientRecordType } from '../types';

/**
 * Compatibilidad para módulos heredados que referencian estos tipos
 * sin importarlos explícitamente. No crea estado ni persistencia.
 */
declare global {
  type Pago = PagoType;
  type PatientRecord = PatientRecordType;
}

export {};