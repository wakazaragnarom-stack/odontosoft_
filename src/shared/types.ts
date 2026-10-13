export type UserRole = 'superadmin' | 'clinic_admin' | 'dentist' | 'patient';

export type TenantStatus = 'active' | 'suspended' | 'trial';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  adminName: string;
  adminEmail: string;
  phone: string;
  status: TenantStatus;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  monthlyFee: number;
  lastPaymentDate: string;
  nextDueDate: string;
  dentistLimit: number;
  licenseToken: string;
  createdAt: string;
  address?: string;
  logoUrl?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  documento?: string;
  specialty?: string;
  licenseNumber?: string;
  id_consultorio?: string;
  googleCalendarLinked?: boolean;
  googleEmail?: string;
  notifyByEmail?: boolean;
}

export interface Consultorio {
  id_consultorio: string;
  tenantId: string;
  nombre: string;
  ubicacion: string;
  numero_sala: string;
}

export interface Tratamiento {
  id_tratamiento: string;
  tenantId: string;
  nombre: string;
  descripcion: string;
  costo: number;
  duracion_estimada: string;
}

export interface DentistProfile {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  id_consultorio?: string;
  consultorioNombre?: string;
  workingDays: number[];
  workingHours: { start: string; end: string };
  googleCalendarLinked: boolean;
  googleEmail?: string;
  notifyByEmail: boolean;
  avatarUrl?: string;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface ToothCondition {
  toothNumber: number;
  status: 'healthy' | 'caries' | 'filled' | 'crown' | 'missing' | 'implant' | 'root_canal';
  notes?: string;
}

export interface HistoriaClinicaDetallada {
  id_historia_detallada: string;
  id_paciente: string;
  datos_clinicos: {
    motivo_consulta?: string;
    antecedentes_medicos?: string;
    alergias_especificas?: string;
    presion_arterial?: string;
    enfermedades_sistemicas?: string;
    medicacion_actual?: string;
    habitos?: string;
    diagnostico_periodontal?: string;
    observaciones_generales?: string;
  };
  fecha_actualizacion: string;
}

export interface PatientRecord {
  id: string;
  tenantId: string;
  nombre: string;
  apellido: string;
  name: string;
  email: string;
  phone: string;
  documento: string;
  birthDate?: string;
  fecha_nacimiento?: string;
  genero?: string;
  direccion?: string;
  eps?: string;
  alergias?: string;
  notes?: string;
  odontogram: ToothCondition[];
  historiaDetallada?: HistoriaClinicaDetallada;
  clinicalEvolution: {
    id: string;
    date: string;
    dentistName: string;
    treatment: string;
    notes: string;
  }[];
  driveFiles?: {
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
    size?: string;
  }[];
}

export interface Pago {
  id_pago: string;
  id_cita: string;
  fecha_pago: string;
  monto: number;
  metodo_pago: 'Efectivo' | 'Tarjeta de Crédito/Débito' | 'Transferencia Bancaria' | 'MercadoPago / PSE';
  estado_pago: 'Completado' | 'Pendiente' | 'Anulado';
  referencia: string;
}

export interface Factura {
  id_factura: string;
  id_pago: string;
  fecha_emision: string;
  subtotal: number;
  impuesto: number;
  total: number;
}

export interface Recordatorio24h {
  id_recordatorio: string;
  id_cita: string;
  tipo: 'Email 24h' | 'WhatsApp / SMS';
  fecha_envio: string;
  estado: 'Enviado' | 'Programado' | 'Fallido';
  destinatario: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  dentistId: string;
  dentistName: string;
  dentistEmail: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientDocumento?: string;
  id_consultorio?: string;
  consultorioNombre?: string;
  treatment: string;
  tratamientosIds?: string[];
  date: string;
  time: string;
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  googleCalendarEventId?: string;
  googleCalendarSynced: boolean;
  emailNotificationSent: boolean;
  price: number;
  pago?: Pago;
  factura?: Factura;
  recordatorio24h?: Recordatorio24h;
  createdAt: string;
}

export interface TokenPayload {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  tenantStatus?: TenantStatus;
  issuedAt: number;
  expiresAt: number;
}

export interface Proveedor {
  id: string;
  tenantId?: string;
  empresa: string;
  contacto_asesor: string;
  telefono: string;
  suministro: string;
  estado_convenio: 'Vigente' | 'Vencido' | 'Suspendido';
  fecha_registro?: string;
  correo?: string;
  direccion?: string;
  notas?: string;
}

export interface EmailLog {
  id: string;
  tipo: 'Confirmación de Cita' | 'Recordatorio 24h' | 'Restablecimiento de Contraseña' | 'Comprobante de Pago' | 'Aviso Administrativo';
  destinatario: string;
  asunto: string;
  contenido: string;
  fecha_envio: string;
  estado: 'Enviado con éxito' | 'Simulado (Sin credenciales)' | 'Pendiente' | 'Fallido';
  mensajeId?: string;
  metadata?: Record<string, unknown>;
}

export interface SaaSMetrics {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalDentists: number;
  totalAppointments: number;
  monthlyRecurringRevenue: number;
}
