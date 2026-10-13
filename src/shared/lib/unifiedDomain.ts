export type UserRole = 'superadmin' | 'clinic_admin' | 'dentist' | 'patient' | 'proveedores';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type ClinicalRecordStatus = 'draft' | 'active' | 'closed';

export interface Tenant {
  id: string;
  name: string;
  subdomain?: string;
  status: 'active' | 'suspended' | 'inactive';
}

export interface User {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface Patient {
  id: string;
  tenantId: string;
  userId?: string;
  documentType?: string;
  documentNumber?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  emergencyContact?: string;
  notes?: string;
  active: boolean;
}

export interface Dentist {
  id: string;
  tenantId: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  specialty?: string;
  licenseNumber?: string;
  active: boolean;
}

export interface Office {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  phone?: string;
  active: boolean;
}

export interface Appointment {
  id: string;
  tenantId: string;
  patientId: string;
  dentistId: string;
  officeId?: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  clinicalRecordId?: string;
}

export interface ClinicalQuestion {
  id: string;
  tenantId: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  order: number;
  active: boolean;
}

export interface ClinicalAnswer {
  questionId: string;
  value: string | number | boolean | string[] | null;
}

export interface ClinicalRecord {
  id: string;
  tenantId: string;
  patientId: string;
  dentistId: string;
  appointmentId?: string;
  status: ClinicalRecordStatus;
  reason?: string;
  diagnosis?: string;
  examination?: string;
  plan?: string;
  observations?: string;
  answers: ClinicalAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  id: string;
  tenantId: string;
  patientId?: string;
  clinicalRecordId?: string;
  name: string;
  description?: string;
  price: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  active: boolean;
}

export interface Payment {
  id: string;
  tenantId: string;
  patientId?: string;
  appointmentId?: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'other';
  status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  paidAt?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  patientId?: string;
  number: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  issuedAt?: string;
}

export interface Supplier {
  id: string;
  tenantId?: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  active: boolean;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  supplierId?: string;
  name: string;
  sku?: string;
  quantity: number;
  minimumQuantity: number;
  unitCost: number;
  active: boolean;
}

export interface AuditEvent {
  id: string;
  tenantId?: string;
  actorUserId?: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['confirmed', 'cancelled', 'no_show'],
  confirmed: ['arrived', 'cancelled', 'no_show'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function canTransitionAppointment(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  return APPOINTMENT_TRANSITIONS[from].includes(to);
}
