import type {
  Appointment,
  AppointmentStatus,
  Consultorio,
  DentistProfile,
  EmailLog,
  Factura,
  HistoriaClinicaDetallada,
  Pago,
  PatientRecord,
  Proveedor,
  SaaSMetrics,
  Tenant,
  Tratamiento,
} from '../types';
import { updateEstadoCita, updateOdontograma } from '../api.js';

export interface StoreState {
  tenants: Tenant[];
  dentists: DentistProfile[];
  appointments: Appointment[];
  patients: PatientRecord[];
  consultorios: Consultorio[];
  tratamientos: Tratamiento[];
  proveedores: Proveedor[];
  emailLogs: EmailLog[];
}

const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const seedTenant: Tenant = {
  id: 'tenant-1', name: 'Clínica Dental OdontoSoft', subdomain: 'odontosoft',
  adminName: 'Administrador', adminEmail: 'admin@odontosoft.io', phone: '+57 300 000 0000',
  status: 'active', plan: 'Pro', monthlyFee: 149, lastPaymentDate: '2026-09-01',
  nextDueDate: '2026-10-01', dentistLimit: 8, licenseToken: 'OS-DEMO-2026', createdAt: now(),
  address: 'Bogotá, Colombia'
};

const state: StoreState = {
  tenants: [seedTenant],
  dentists: [],
  appointments: [],
  patients: [],
  consultorios: [],
  tratamientos: [],
  proveedores: [],
  emailLogs: []
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const getStoreState = (): StoreState => clone(state);
export const subscribeToStore = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export function applyBackendState(data: Partial<StoreState>) {
  if (data.patients) state.patients = clone(data.patients);
  if (data.dentists) state.dentists = clone(data.dentists);
  if (data.appointments) state.appointments = clone(data.appointments);
  if (data.tratamientos) state.tratamientos = clone(data.tratamientos);
  if (data.proveedores) state.proveedores = clone(data.proveedores);
  emit();
}

export async function hydrateFromBackend(loader: () => Promise<Partial<StoreState>>) {
  const data = await loader();
  applyBackendState(data);
  return getStoreState();
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus): Appointment {
  const appointment = state.appointments.find((item) => item.id === id);
  if (!appointment) throw new Error('Cita no encontrada');
  appointment.status = status;
  emit();
  const backendId = Number(id);
  const backendStatusMap: Record<AppointmentStatus, string> = {
    scheduled: 'Pendiente', confirmed: 'Confirmada', arrived: 'Llegó', in_progress: 'En curso', completed: 'Completada', cancelled: 'Cancelada', no_show: 'No asistió'
  };
  if (Number.isInteger(backendId) && backendId > 0) {
    void updateEstadoCita(backendId, backendStatusMap[status]).catch(() => emit());
  }
  return clone(appointment);
}

export function bookAppointment(input: Omit<Appointment, 'id' | 'createdAt' | 'status' | 'googleCalendarSynced' | 'emailNotificationSent'> & Partial<Pick<Appointment, 'status' | 'googleCalendarSynced' | 'emailNotificationSent'>>): Appointment {
  const appointment: Appointment = { ...input, id: uid('apt'), createdAt: now(), status: input.status ?? 'scheduled', googleCalendarSynced: input.googleCalendarSynced ?? false, emailNotificationSent: input.emailNotificationSent ?? false };
  state.appointments.push(appointment); emit(); return clone(appointment);
}

export function updateToothStatus(patientId: string, toothNumber: number, status: PatientRecord['odontogram'][number]['status'], notes?: string) {
  const patient = state.patients.find((item) => item.id === patientId);
  if (!patient) throw new Error('Paciente no encontrado');
  const tooth = patient.odontogram.find((item) => item.toothNumber === toothNumber);
  if (tooth) { tooth.status = status; tooth.notes = notes; }
  else patient.odontogram.push({ toothNumber, status, notes });
  emit();
  const backendId = Number(patientId);
  if (Number.isInteger(backendId) && backendId > 0) {
    const dientes = Object.fromEntries(patient.odontogram.map((item) => [String(item.toothNumber), { status: item.status, notes: item.notes }]));
    void updateOdontograma(backendId, { id_paciente: backendId, dientes }).catch(() => emit());
  }
  return clone(patient);
}

export function addClinicalEvolutionNote(patientId: string, entry: PatientRecord['clinicalEvolution'][number]) {
  const patient = state.patients.find((item) => item.id === patientId);
  if (!patient) throw new Error('Paciente no encontrado');
  patient.clinicalEvolution.unshift({ ...entry, id: entry.id || uid('evo') }); emit(); return clone(patient);
}

export function guardarHistoriaClinicaDetallada(patientId: string, datos: HistoriaClinicaDetallada['datos_clinicos']) {
  const patient = state.patients.find((item) => item.id === patientId);
  if (!patient) throw new Error('Paciente no encontrado');
  patient.historiaDetallada = { id_historia_detallada: patient.historiaDetallada?.id_historia_detallada || uid('hist'), id_paciente: patientId, datos_clinicos: datos, fecha_actualizacion: now() };
  emit(); return clone(patient.historiaDetallada);
}

export function updateDentistGoogleStatus(dentistId: string, linked: boolean, googleEmail?: string) {
  const dentist = state.dentists.find((item) => item.id === dentistId);
  if (!dentist) throw new Error('Odontólogo no encontrado');
  dentist.googleCalendarLinked = linked; dentist.googleEmail = googleEmail; emit(); return clone(dentist);
}

export function registerDentist(input: Omit<DentistProfile, 'id' | 'userId' | 'tenantId' | 'workingDays' | 'workingHours' | 'googleCalendarLinked' | 'notifyByEmail'> & { tenantId: string }) {
  const dentist: DentistProfile = { ...input, id: uid('dent'), userId: uid('usr'), tenantId: input.tenantId, workingDays: [1,2,3,4,5], workingHours: { start: '08:00', end: '18:00' }, googleCalendarLinked: false, notifyByEmail: true };
  state.dentists.push(dentist); emit(); return clone(dentist);
}

export function createConsultorio(input: Omit<Consultorio, 'id_consultorio'>) { const item = { ...input, id_consultorio: uid('cons') }; state.consultorios.push(item); emit(); return clone(item); }
export function createTratamiento(input: Omit<Tratamiento, 'id_tratamiento'>) { const item = { ...input, id_tratamiento: uid('trat') }; state.tratamientos.push(item); emit(); return clone(item); }
export function deleteTratamiento(id: string) { state.tratamientos = state.tratamientos.filter((item) => item.id_tratamiento !== id); emit(); }

export function registrarPagoCita(appointmentId: string, metodo_pago: Pago['metodo_pago'], referencia: string): Pago {
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  if (!appointment) throw new Error('Cita no encontrada');
  const pago: Pago = { id_pago: uid('pago'), id_cita: appointmentId, fecha_pago: now().slice(0,10), monto: appointment.price, metodo_pago, estado_pago: 'Completado', referencia };
  const factura: Factura = { id_factura: uid('fac'), id_pago: pago.id_pago, fecha_emision: now().slice(0,10), subtotal: pago.monto / 1.19, impuesto: pago.monto - (pago.monto / 1.19), total: pago.monto };
  appointment.pago = pago; appointment.factura = factura; emit(); return clone(pago);
}

export function dispararRecordatorios24h(tenantId?: string) {
  const candidates = state.appointments.filter((a) => (!tenantId || a.tenantId === tenantId) && ['scheduled','confirmed'].includes(a.status));
  const destinatarios = candidates.map((a) => a.patientEmail).filter(Boolean);
  candidates.forEach((a) => { a.recordatorio24h = { id_recordatorio: uid('rem'), id_cita: a.id, tipo: 'Email 24h', fecha_envio: now(), estado: 'Programado', destinatario: a.patientEmail }; });
  emit(); return { enviados: candidates.length, destinatarios };
}

export function toggleTenantStatus(id: string) { const tenant = state.tenants.find((t) => t.id === id); if (!tenant) throw new Error('Clínica no encontrada'); tenant.status = tenant.status === 'suspended' ? 'active' : 'suspended'; emit(); return clone(tenant); }
export function createTenant(input: Omit<Tenant, 'id' | 'licenseToken' | 'createdAt'>) { const tenant: Tenant = { ...input, id: uid('tenant'), licenseToken: `OS-${Math.random().toString(36).slice(2,10).toUpperCase()}`, createdAt: now() }; state.tenants.push(tenant); emit(); return clone(tenant); }
export function getSaaSMetrics(): SaaSMetrics { return { totalTenants: state.tenants.length, activeTenants: state.tenants.filter((t) => t.status === 'active').length, suspendedTenants: state.tenants.filter((t) => t.status === 'suspended').length, totalDentists: state.dentists.length, totalAppointments: state.appointments.length, monthlyRecurringRevenue: state.tenants.reduce((sum,t) => sum+t.monthlyFee,0) }; }
export function createProveedor(input: Omit<Proveedor, 'id'>) { const item = { ...input, id: uid('prov') }; state.proveedores.push(item); emit(); return clone(item); }
export function updateProveedor(id: string, patch: Partial<Proveedor>) { const item = state.proveedores.find((p) => p.id === id); if (!item) throw new Error('Proveedor no encontrado'); Object.assign(item, patch); emit(); return clone(item); }
export function deleteProveedor(id: string) { state.proveedores = state.proveedores.filter((p) => p.id !== id); emit(); }
