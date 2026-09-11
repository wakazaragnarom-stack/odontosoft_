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
import {
  createCita as apiCreateCita,
  createFactura as apiCreateFactura,
  createPago as apiCreatePago,
  createProveedor as apiCreateProveedor,
  createTratamiento as apiCreateTratamiento,
  updateEstadoCita,
  updateOdontograma,
} from '../api.js';

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

const backendStatusMap: Record<AppointmentStatus, string> = {
  scheduled: 'Pendiente',
  confirmed: 'Confirmada',
  arrived: 'Llegó',
  in_progress: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió'
};

export function updateAppointmentStatus(id: string, status: AppointmentStatus): Appointment {
  const appointment = state.appointments.find((item) => item.id === id);
  if (!appointment) throw new Error('Cita no encontrada');
  const previous = appointment.status;
  appointment.status = status;
  emit();
  const backendId = Number(id);
  if (Number.isInteger(backendId) && backendId > 0) {
    void updateEstadoCita(backendId, backendStatusMap[status]).catch(() => {
      appointment.status = previous;
      emit();
    });
  }
  return clone(appointment);
}

export async function bookAppointment(
  input: Omit<Appointment, 'id' | 'createdAt' | 'status' | 'googleCalendarSynced' | 'emailNotificationSent'> & Partial<Pick<Appointment, 'status' | 'googleCalendarSynced' | 'emailNotificationSent'>>
): Promise<Appointment | null> {
  const patientId = Number(input.patientId);
  const dentistId = Number(input.dentistId);
  const consultorioId = input.id_consultorio ? Number(input.id_consultorio) : NaN;
  if (!Number.isInteger(patientId) || patientId <= 0 || !Number.isInteger(dentistId) || dentistId <= 0 || !Number.isInteger(consultorioId) || consultorioId <= 0) {
    console.error('No se pudo persistir la cita: faltan identificadores válidos de paciente, odontólogo o consultorio.');
    return null;
  }
  try {
    const created = await apiCreateCita({
      fecha: input.date,
      hora: input.time,
      estado: backendStatusMap[input.status ?? 'scheduled'],
      motivo_consulta: input.treatment || 'Consulta',
      observaciones: input.notes ?? null,
      id_paciente: patientId,
      id_odontologo: dentistId,
      id_consultorio: consultorioId,
    });
    const appointment: Appointment = {
      ...input,
      id: String(created.id_cita),
      createdAt: now(),
      status: input.status ?? 'scheduled',
      googleCalendarSynced: input.googleCalendarSynced ?? false,
      emailNotificationSent: input.emailNotificationSent ?? false,
    };
    state.appointments.push(appointment);
    emit();
    return clone(appointment);
  } catch (error) {
    console.error('No se pudo crear la cita en PostgreSQL.', error);
    return null;
  }
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
  patient.clinicalEvolution.unshift({ ...entry, id: entry.id || `${patientId}-${Date.now()}` }); emit(); return clone(patient);
}

export function guardarHistoriaClinicaDetallada(patientId: string, datos: HistoriaClinicaDetallada['datos_clinicos']) {
  const patient = state.patients.find((item) => item.id === patientId);
  if (!patient) throw new Error('Paciente no encontrado');
  patient.historiaDetallada = { id_historia_detallada: patient.historiaDetallada?.id_historia_detallada || 'pending', id_paciente: patientId, datos_clinicos: datos, fecha_actualizacion: now() };
  emit(); return clone(patient.historiaDetallada);
}

export function updateDentistGoogleStatus(dentistId: string, linked: boolean, googleEmail?: string) {
  const dentist = state.dentists.find((item) => item.id === dentistId);
  if (!dentist) throw new Error('Odontólogo no encontrado');
  dentist.googleCalendarLinked = linked; dentist.googleEmail = googleEmail; emit(); return clone(dentist);
}

export function registerDentist(input: Omit<DentistProfile, 'id' | 'userId' | 'tenantId' | 'workingDays' | 'workingHours' | 'googleCalendarLinked' | 'notifyByEmail'> & { tenantId: string }) {
  const dentist: DentistProfile = { ...input, id: `${Date.now()}`, userId: `${Date.now()}`, tenantId: input.tenantId, workingDays: [1,2,3,4,5], workingHours: { start: '08:00', end: '18:00' }, googleCalendarLinked: false, notifyByEmail: true };
  state.dentists.push(dentist); emit(); return clone(dentist);
}

export function createConsultorio(input: Omit<Consultorio, 'id_consultorio'>) { const item = { ...input, id_consultorio: `${Date.now()}` }; state.consultorios.push(item); emit(); return clone(item); }

export async function createTratamiento(input: Omit<Tratamiento, 'id_tratamiento'>): Promise<Tratamiento | null> {
  try {
    const created = await apiCreateTratamiento({
      nombre: input.nombre,
      descripcion: input.descripcion || null,
      costo: Number(input.costo),
      duracion_estimada: input.duracion_estimada || null,
    });
    const item: Tratamiento = {
      ...input,
      id_tratamiento: String(created.id_tratamiento),
      costo: Number(created.costo || input.costo || 0),
    };
    state.tratamientos.push(item);
    emit();
    return clone(item);
  } catch (error) {
    console.error('No se pudo crear el tratamiento en PostgreSQL.', error);
    return null;
  }
}

export function deleteTratamiento(id: string) { state.tratamientos = state.tratamientos.filter((item) => item.id_tratamiento !== id); emit(); }

export async function registrarPagoCita(appointmentId: string, metodo_pago: Pago['metodo_pago'], referencia: string): Promise<Pago | null> {
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  if (!appointment) throw new Error('Cita no encontrada');
  const backendAppointmentId = Number(appointmentId);
  if (!Number.isInteger(backendAppointmentId) || backendAppointmentId <= 0 || !appointment.price || appointment.price <= 0) {
    console.error('No se pudo registrar el pago: cita o monto inválido para el backend.');
    return null;
  }
  try {
    const pago = await apiCreatePago({
      fecha_pago: new Date().toISOString().slice(0, 10),
      monto: appointment.price,
      metodo_pago,
      estado_pago: 'Completado',
      referencia: referencia || null,
      id_cita: backendAppointmentId,
    });
    const monto = Number(pago.monto);
    const subtotal = Number((monto / 1.19).toFixed(2));
    const impuesto = Number((monto - subtotal).toFixed(2));
    try {
      const factura = await apiCreateFactura({
        fecha_emision: new Date().toISOString().slice(0, 10),
        subtotal,
        impuesto,
        total: monto,
        id_pago: Number(pago.id_pago),
      });
      appointment.pago = {
        id_pago: String(pago.id_pago),
        id_cita: String(pago.id_cita),
        fecha_pago: String(pago.fecha_pago),
        monto,
        metodo_pago: pago.metodo_pago as Pago['metodo_pago'],
        estado_pago: pago.estado_pago as Pago['estado_pago'],
        referencia: pago.referencia || undefined,
      };
      appointment.factura = {
        id_factura: String(factura.id_factura),
        id_pago: String(factura.id_pago),
        fecha_emision: String(factura.fecha_emision),
        subtotal: Number(factura.subtotal || subtotal),
        impuesto: Number(factura.impuesto || impuesto),
        total: Number(factura.total || monto),
      };
      emit();
    } catch (invoiceError) {
      console.error('Pago creado, pero la factura no pudo persistirse.', invoiceError);
      emit();
    }
    return clone(appointment.pago!);
  } catch (error) {
    console.error('No se pudo registrar el pago en PostgreSQL.', error);
    return null;
  }
}

export function dispararRecordatorios24h(tenantId?: string) {
  const candidates = state.appointments.filter((a) => (!tenantId || a.tenantId === tenantId) && ['scheduled','confirmed'].includes(a.status));
  const destinatarios = candidates.map((a) => a.patientEmail).filter(Boolean);
  candidates.forEach((a) => { a.recordatorio24h = { id_recordatorio: `${Date.now()}`, id_cita: a.id, tipo: 'Email 24h', fecha_envio: now(), estado: 'Programado', destinatario: a.patientEmail }; });
  emit(); return { enviados: candidates.length, destinatarios };
}

export function toggleTenantStatus(id: string) { const tenant = state.tenants.find((t) => t.id === id); if (!tenant) throw new Error('Clínica no encontrada'); tenant.status = tenant.status === 'suspended' ? 'active' : 'suspended'; emit(); return clone(tenant); }
export function createTenant(input: Omit<Tenant, 'id' | 'licenseToken' | 'createdAt'>) { const tenant: Tenant = { ...input, id: `${Date.now()}`, licenseToken: `OS-${Date.now()}`, createdAt: now() }; state.tenants.push(tenant); emit(); return clone(tenant); }
export function getSaaSMetrics(): SaaSMetrics { return { totalTenants: state.tenants.length, activeTenants: state.tenants.filter((t) => t.status === 'active').length, suspendedTenants: state.tenants.filter((t) => t.status === 'suspended').length, totalDentists: state.dentists.length, totalAppointments: state.appointments.length, monthlyRecurringRevenue: state.tenants.reduce((sum,t) => sum+t.monthlyFee,0) }; }

export async function createProveedor(input: Omit<Proveedor, 'id'>): Promise<Proveedor | null> {
  try {
    const created = await apiCreateProveedor({
      empresa: input.empresa,
      contacto_asesor: input.contacto_asesor || null,
      telefono: input.telefono || null,
      suministro: input.suministro || null,
      estado_convenio: input.estado_convenio || 'Vigente',
    });
    const item: Proveedor = {
      ...input,
      id: String(created.id),
    };
    state.proveedores.push(item);
    emit();
    return clone(item);
  } catch (error) {
    console.error('No se pudo crear el proveedor en PostgreSQL.', error);
    return null;
  }
}

export function updateProveedor(id: string, patch: Partial<Proveedor>) { const item = state.proveedores.find((p) => p.id === id); if (!item) throw new Error('Proveedor no encontrado'); Object.assign(item, patch); emit(); return clone(item); }
export function deleteProveedor(id: string) { state.proveedores = state.proveedores.filter((p) => p.id !== id); emit(); }
