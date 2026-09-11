import {
  getCitas,
  getPacientes,
  getOdontologos,
  getTratamientos,
  getProveedores,
  getOdontograma,
  updateOdontograma,
  getHistoriaDetallada,
  updateHistoriaDetallada,
} from '../api.js';
import type { Appointment, DentistProfile, PatientRecord, Proveedor, Tratamiento } from '../types';

const apiNumber = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('Identificador de backend inválido');
  return parsed;
};

const mapPatient = (p: any): PatientRecord => ({
  id: String(p.id_paciente),
  tenantId: 'legacy',
  nombre: p.nombre || '',
  apellido: p.apellido || '',
  name: `${p.nombre || ''} ${p.apellido || ''}`.trim(),
  email: p.correo || '',
  phone: p.telefono || '',
  documento: p.documento || '',
  birthDate: p.fecha_nacimiento || undefined,
  fecha_nacimiento: p.fecha_nacimiento || undefined,
  genero: p.genero || undefined,
  direccion: p.direccion || undefined,
  eps: p.eps || undefined,
  alergias: p.alergias || undefined,
  odontogram: [],
  clinicalEvolution: [],
});

const mapDentist = (d: any): DentistProfile => ({
  id: String(d.id_odontologo),
  userId: String(d.id_odontologo),
  tenantId: 'legacy',
  name: `${d.nombre || ''} ${d.apellido || ''}`.trim(),
  email: d.correo || '',
  phone: d.telefono || '',
  specialty: d.especialidad || '',
  licenseNumber: d.registro_profesional || '',
  id_consultorio: d.id_consultorio != null ? String(d.id_consultorio) : undefined,
  workingDays: [1, 2, 3, 4, 5],
  workingHours: { start: '08:00', end: '18:00' },
  googleCalendarLinked: false,
  notifyByEmail: true,
});

const mapTreatment = (t: any): Tratamiento => ({
  id_tratamiento: String(t.id_tratamiento),
  tenantId: 'legacy',
  nombre: t.nombre || '',
  descripcion: t.descripcion || '',
  costo: Number(t.costo || 0),
  duracion_estimada: t.duracion_estimada || '',
});

const mapAppointmentStatus = (status: unknown): Appointment['status'] => {
  const raw = String(status || '').toLowerCase();
  if (['confirmed', 'confirmada', 'confirmado'].includes(raw)) return 'confirmed';
  if (['arrived', 'llego', 'llegó'].includes(raw)) return 'arrived' as Appointment['status'];
  if (['in_progress', 'en curso', 'atendiendo'].includes(raw)) return 'in_progress';
  if (['completed', 'completada', 'completado'].includes(raw)) return 'completed';
  if (['cancelled', 'cancelada', 'cancelado'].includes(raw)) return 'cancelled';
  if (['no_show', 'no asistio', 'no asistió'].includes(raw)) return 'no_show' as Appointment['status'];
  return 'scheduled';
};

const mapAppointment = (a: any): Appointment => {
  const treatment = a.tratamientos?.[0];
  return {
    id: String(a.id_cita),
    tenantId: 'legacy',
    dentistId: String(a.id_odontologo),
    dentistName: a.odontologo ? `${a.odontologo.nombre || ''} ${a.odontologo.apellido || ''}`.trim() : '',
    dentistEmail: '',
    patientId: String(a.id_paciente),
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    patientDocumento: undefined,
    id_consultorio: a.id_consultorio != null ? String(a.id_consultorio) : undefined,
    consultorioNombre: '',
    treatment: treatment?.nombre || a.motivo_consulta || 'Consulta',
    tratamientosIds: a.tratamientos?.map((x: any) => String(x.id_tratamiento)) || [],
    date: String(a.fecha || ''),
    time: String(a.hora || '').slice(0, 5),
    durationMinutes: 30,
    status: mapAppointmentStatus(a.estado),
    notes: a.observaciones || undefined,
    googleCalendarSynced: false,
    emailNotificationSent: false,
    price: Number(treatment?.costo || 0),
    createdAt: String(a.fecha || ''),
  };
};

const mapSupplier = (p: any): Proveedor => ({
  id: String(p.id),
  tenantId: 'legacy',
  empresa: p.empresa || '',
  contacto_asesor: p.contacto_asesor || '',
  telefono: p.telefono || '',
  suministro: p.suministro || '',
  estado_convenio: p.estado_convenio || 'Vigente',
  correo: p.correo || undefined,
  direccion: p.direccion || undefined,
  notas: p.notas || undefined,
});

export async function loadBackendState() {
  const [patientsRaw, dentistsRaw, treatmentsRaw, suppliersRaw, appointmentsRaw] = await Promise.all([
    getPacientes(), getOdontologos(), getTratamientos(), getProveedores(), getCitas(),
  ]);
  const patients = (patientsRaw || []).map(mapPatient);
  const dentists = (dentistsRaw || []).map(mapDentist);
  const treatments = (treatmentsRaw || []).map(mapTreatment);
  const proveedores = (suppliersRaw || []).map(mapSupplier);
  const appointments = (appointmentsRaw || []).map(mapAppointment);

  const withClinical = await Promise.all(patients.map(async (patient) => {
    try {
      const [odontograma, historia] = await Promise.all([
        getOdontograma(apiNumber(patient.id)),
        getHistoriaDetallada(apiNumber(patient.id)),
      ]);
      patient.odontogram = Object.entries(odontograma?.dientes || {}).map(([toothNumber, tooth]: [string, any]) => ({
        toothNumber: Number(toothNumber),
        status: tooth?.status || tooth?.estado || 'healthy',
        notes: tooth?.notes || tooth?.observaciones,
      }));
      if (historia) patient.historiaDetallada = { ...historia, id_historia_detallada: String(historia.id_historia_detallada), id_paciente: String(historia.id_paciente) };
    } catch {
      // Un expediente no disponible no bloquea la carga del resto de la clínica.
    }
    return patient;
  }));

  return { patients: withClinical, dentists, tratamientos: treatments, proveedores, appointments };
}

export async function persistOdontogram(patientId: string, dientes: Record<string, unknown>) {
  return updateOdontograma(apiNumber(patientId), { id_paciente: apiNumber(patientId), dientes });
}

export async function persistClinicalDetail(patientId: string, datos_clinicos: Record<string, unknown>) {
  return updateHistoriaDetallada(apiNumber(patientId), { id_paciente: apiNumber(patientId), datos_clinicos });
}
