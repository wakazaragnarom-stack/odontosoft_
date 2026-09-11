import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Mail,
  Phone,
  Award,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  TrendingUp,
  Building2,
  FileText,
  DollarSign,
  BellRing,
  Plus,
  Receipt,
  CreditCard,
  Trash2,
  Edit,
  Play,
  Check,
  Truck,
} from 'lucide-react';
import type { Tenant, DentistProfile, Appointment, Consultorio, Tratamiento, Pago } from '../../types';
import { ProveedorDashboard } from '../proveedor/ProveedorDashboard';
import {
  getStoreState,
  registerDentist,
  updateAppointmentStatus,
  createConsultorio,
  createTratamiento,
  deleteTratamiento,
  registrarPagoCita,
  dispararRecordatorios24h,
} from '../../lib/store';

interface ClinicAdminDashboardProps {
  tenantId: string;
}

export const ClinicAdminDashboard: React.FC<ClinicAdminDashboardProps> = ({ tenantId }) => {
  const store = getStoreState();
  const currentTenant = store.tenants.find((t) => t.id === tenantId);
  const isSuspended = currentTenant?.status === 'suspended';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dentists' | 'appointments' | 'consultorios' | 'tratamientos' | 'billing' | 'reminders' | 'proveedores'>('dentists');

  // Modals
  const [showAddDentistModal, setShowAddDentistModal] = useState(false);
  const [showAddConsultorioModal, setShowAddConsultorioModal] = useState(false);
  const [showAddTratamientoModal, setShowAddTratamientoModal] = useState(false);
  const [paymentModalAppointment, setPaymentModalAppointment] = useState<Appointment | null>(null);

  // Filter state
  const [selectedDentistFilter, setSelectedDentistFilter] = useState<string>('all');

  // Forms
  const [dentistForm, setDentistForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: 'Odontología General',
    licenseNumber: '',
    id_consultorio: store.consultorios.filter((c) => c.tenantId === tenantId)[0]?.id_consultorio || '',
  });

  const [consultorioForm, setConsultorioForm] = useState({
    nombre: '',
    ubicacion: '',
    numero_sala: '',
  });

  const [tratamientoForm, setTratamientoForm] = useState({
    nombre: '',
    descripcion: '',
    costo: 50,
    duracion_estimada: '45 minutos',
  });

  const [paymentMethod, setPaymentMethod] = useState<Pago['metodo_pago']>('Tarjeta de Crédito/Débito');
  const [paymentRef, setPaymentRef] = useState('');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [remindersRunning, setRemindersRunning] = useState(false);
  const [remindersResult, setRemindersResult] = useState<{ enviados: number; destinatarios: string[] } | null>(null);

  const clinicDentists = store.dentists.filter((d) => d.tenantId === tenantId);
  const clinicAppointments = store.appointments.filter((a) => a.tenantId === tenantId);
  const clinicConsultorios = store.consultorios.filter((c) => c.tenantId === tenantId);
  const clinicTratamientos = store.tratamientos.filter((t) => t.tenantId === tenantId);

  const filteredAppointments = clinicAppointments.filter((apt) => {
    if (selectedDentistFilter === 'all') return true;
    return apt.dentistId === selectedDentistFilter;
  });

  // Handle Add Dentist
  const handleRegisterDentist = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!dentistForm.name || !dentistForm.email) {
      setErrorMsg('Por favor complete todos los campos obligatorios.');
      return;
    }

    try {
      await registerDentist({
        name: dentistForm.name,
        email: dentistForm.email,
        phone: dentistForm.phone,
        specialty: dentistForm.specialty,
        licenseNumber: dentistForm.licenseNumber,
        tenantId,
        id_consultorio: dentistForm.id_consultorio,
      });

      setSuccessMsg(`Odontólogo Dr(a). ${dentistForm.name} registrado con éxito.`);
      setDentistForm({
        name: '',
        email: '',
        phone: '',
        specialty: 'Odontología General',
        licenseNumber: '',
        id_consultorio: clinicConsultorios[0]?.id_consultorio || '',
      });
      setTimeout(() => {
        setShowAddDentistModal(false);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar odontólogo');
    }
  };

  // Handle Add Consultorio
  const handleCreateConsultorio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultorioForm.nombre || !consultorioForm.numero_sala) {
      setErrorMsg('Nombre y número de sala son obligatorios.');
      return;
    }
    createConsultorio({
      tenantId,
      nombre: consultorioForm.nombre,
      ubicacion: consultorioForm.ubicacion || 'Sede Principal',
      numero_sala: consultorioForm.numero_sala,
    });
    setConsultorioForm({ nombre: '', ubicacion: '', numero_sala: '' });
    setShowAddConsultorioModal(false);
    setSuccessMsg('Consultorio registrado con éxito en la base de datos.');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  // Handle Add Tratamiento
  const handleCreateTratamiento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tratamientoForm.nombre || tratamientoForm.costo <= 0) {
      setErrorMsg('Nombre y costo positivo son requeridos.');
      return;
    }
    createTratamiento(
      {
        tenantId,
        nombre: tratamientoForm.nombre,
        descripcion: tratamientoForm.descripcion,
        costo: Number(tratamientoForm.costo),
        duracion_estimada: tratamientoForm.duracion_estimada,
      },
      'clinic_admin'
    );
    setTratamientoForm({ nombre: '', descripcion: '', costo: 50, duracion_estimada: '45 minutos' });
    setShowAddTratamientoModal(false);
    setSuccessMsg('Tratamiento añadido al catálogo institucional.');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  // Handle Process Payment
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalAppointment) return;

    registrarPagoCita(
      paymentModalAppointment.id,
      paymentModalAppointment.price,
      paymentMethod,
      paymentRef || undefined
    );

    setPaymentModalAppointment(null);
    setPaymentRef('');
    setSuccessMsg('Pago asentado y Factura Fiscal generada con desglose de IVA.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Trigger 24h reminders simulation
  const handleRunReminders = async () => {
    setRemindersRunning(true);
    try {
      const res = await dispararRecordatorios24h();
      setRemindersResult(res);
      setSuccessMsg(`Simulador APScheduler: Se enviaron ${res.enviados} recordatorios de 24h vía Gmail SMTP.`);
    } catch (err: any) {
      setErrorMsg('Error en ejecución de recordatorios');
    } finally {
      setRemindersRunning(false);
    }
  };

  // Paid appointments calculation
  const paidAppointments = clinicAppointments.filter((a) => a.pago);
  const totalFacturado = paidAppointments.reduce((sum, a) => sum + (a.pago?.monto || 0), 0);

  return (
    <div className="space-y-6">
      {/* Banner if Suspended by SaaS Super Admin */}
      {isSuspended && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-6 text-rose-900 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-200 text-rose-800 rounded-xl shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-block bg-rose-600 text-white text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full mb-1">
                Servicio Bloqueado por Mora
              </span>
              <h2 className="text-xl font-black text-rose-900">
                Acceso Suspendido por Falta de Pago Acordado
              </h2>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed max-w-3xl">
                El Administrador General de la Plataforma SaaS (Super Admin) ha desactivado el
                servicio para la clínica <strong>{currentTenant?.name}</strong>. Todas las reservas
                nuevas y las llamadas a la API mediante token están restringidas hasta que se
                regularice la cuota mensual pendiente (${currentTenant?.monthlyFee} USD).
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
                <span className="bg-white/80 border border-rose-300 px-3 py-1.5 rounded-lg text-rose-800">
                  Fecha de corte vencida: {currentTenant?.nextDueDate}
                </span>
                <span className="text-rose-700 italic">
                  Para reactivar: Notifique el pago al Super Administrador.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success / Error alert popups */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Clinic Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">{currentTenant?.name}</h1>
            {isSuspended ? (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                ⛔ Suspendida
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                🟢 Servicio Activo
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Director(a): {currentTenant?.adminName} • {currentTenant?.adminEmail} • {currentTenant?.address}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Plan SaaS Contratado
            </span>
            <span className="text-xs font-bold text-slate-800">
              {currentTenant?.plan} (${currentTenant?.monthlyFee} USD/mes)
            </span>
          </div>

          <button
            id="open-add-dentist-modal-btn"
            disabled={isSuspended}
            onClick={() => setShowAddDentistModal(true)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs ${
              isSuspended
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Incorporar Odontólogo</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Synchronized with FastAPI Architecture) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('dentists')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'dentists' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-sky-600" />
          <span>Equipo Odontológico ({clinicDentists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'appointments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Agenda & Citas ({clinicAppointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('consultorios')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'consultorios' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Consultorios & Salas ({clinicConsultorios.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tratamientos')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'tratamientos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-600" />
          <span>Catálogo Tratamientos ({clinicTratamientos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'billing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4 text-amber-600" />
          <span>Facturación & Pagos (${totalFacturado})</span>
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'reminders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BellRing className="w-4 h-4 text-rose-600" />
          <span>Recordatorios 24h</span>
        </button>

        <button
          onClick={() => setActiveTab('proveedores')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'proveedores' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4 text-sky-600" />
          <span>Proveedores & Insumos</span>
        </button>
      </div>

      {/* TAB 1: DENTISTS */}
      {activeTab === 'dentists' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Odontólogos Registrados en la Clínica
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cada odontólogo cuenta con su sala/consultorio asignado y sincronización directa con Google Calendar.
              </p>
            </div>
            <button
              onClick={() => setShowAddDentistModal(true)}
              disabled={isSuspended}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Odontólogo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {clinicDentists.map((dentist) => (
              <div
                key={dentist.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {dentist.name.charAt(3) || 'D'}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{dentist.name}</h3>
                      <span className="text-[11px] text-teal-700 font-semibold block">
                        {dentist.specialty}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {dentist.licenseNumber}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{dentist.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dentist.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{dentist.consultorioNombre || 'Consultorio General'}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-500">Google Calendar:</span>
                  {dentist.googleCalendarLinked ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Vinculado
                    </span>
                  ) : (
                    <span className="text-amber-600 font-semibold">Pendiente</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Agenda Maestra de Citas</h2>
              <p className="text-xs text-slate-500">
                Sincronizadas con Google Calendar, notificación por email y emisión de factura.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Filtrar Odontólogo:</label>
              <select
                value={selectedDentistFilter}
                onChange={(e) => setSelectedDentistFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">Todos los Odontólogos ({clinicAppointments.length})</option>
                {clinicDentists.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Fecha & Hora</th>
                  <th className="px-5 py-3">Paciente</th>
                  <th className="px-5 py-3">Odontólogo & Sala</th>
                  <th className="px-5 py-3">Tratamiento</th>
                  <th className="px-5 py-3">Estado Cita</th>
                  <th className="px-5 py-3">Google Calendar</th>
                  <th className="px-5 py-3">Pago / Factura</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                      No hay citas registradas para este criterio.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{apt.date}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {apt.time} ({apt.durationMinutes}m)
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-900">{apt.patientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {apt.patientDocumento || 'CC10293847'}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-teal-800">{apt.dentistName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-indigo-400" />
                          {apt.consultorioNombre || 'Sala 101'}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-700">
                        {apt.treatment}
                        <div className="text-[11px] text-slate-400">${apt.price} USD</div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            apt.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.status === 'completed'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {apt.status === 'confirmed'
                            ? 'Confirmada'
                            : apt.status === 'completed'
                            ? 'Completada'
                            : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {apt.googleCalendarSynced ? (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" /> Sincronizado
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Sin vincular</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {apt.pago ? (
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Pagado • Fac #{apt.factura?.id_factura.slice(-5)}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {apt.pago.metodo_pago}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPaymentModalAppointment(apt)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[11px] font-bold transition-colors"
                          >
                            Cobrar Cita
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <select
                          value={apt.status}
                          onChange={(e) =>
                            updateAppointmentStatus(apt.id, e.target.value as Appointment['status'])
                          }
                          className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-semibold focus:outline-none"
                        >
                          <option value="scheduled">Pendiente</option>
                          <option value="confirmed">Confirmar</option>
                          <option value="completed">Completar</option>
                          <option value="cancelled">Cancelar</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONSULTORIOS (Matching FastAPI /consultorios) */}
      {activeTab === 'consultorios' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Consultorios, Sillones y Unidades de Atención
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestione las salas físicas donde los odontólogos atienden las citas.
              </p>
            </div>
            <button
              onClick={() => setShowAddConsultorioModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Consultorio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {clinicConsultorios.map((c) => (
              <div
                key={c.id_consultorio}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {c.numero_sala}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{c.id_consultorio}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{c.nombre}</h3>
                <p className="text-xs text-slate-600">{c.ubicacion}</p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Odontólogos asignados:</span>
                  <strong>
                    {clinicDentists.filter((d) => d.id_consultorio === c.id_consultorio).length}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TRATAMIENTOS (Matching FastAPI /tratamientos) */}
      {activeTab === 'tratamientos' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Catálogo Institucional de Tratamientos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Procedimientos disponibles para agendamiento con precios oficiales establecidos por la administración.
              </p>
            </div>
            <button
              onClick={() => setShowAddTratamientoModal(true)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Tratamiento</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Nombre del Tratamiento</th>
                  <th className="px-5 py-3">Descripción</th>
                  <th className="px-5 py-3">Duración Estimada</th>
                  <th className="px-5 py-3">Costo Oficial</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clinicTratamientos.map((t) => (
                  <tr key={t.id_tratamiento} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-bold text-slate-900">{t.nombre}</td>
                    <td className="px-5 py-3 text-slate-600 max-w-sm leading-relaxed">
                      {t.descripcion}
                    </td>
                    <td className="px-5 py-3 text-slate-700 font-medium">
                      {t.duracion_estimada}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        ${t.costo} USD
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => deleteTratamiento(t.id_tratamiento, 'clinic_admin')}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Eliminar tratamiento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: FACTURACIÓN Y PAGOS (Matching FastAPI /pagos y /facturas) */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Módulo de Facturación y Cobranza
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Desglose fiscal con subtotal, impuesto (IVA 19%) y comprobantes electrónicos emitidos.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Facturado
              </span>
              <span className="text-lg font-black text-emerald-700 font-mono">
                ${totalFacturado} USD
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Nº Factura</th>
                  <th className="px-5 py-3">Fecha Emisión</th>
                  <th className="px-5 py-3">Paciente & Cita</th>
                  <th className="px-5 py-3">Método de Pago</th>
                  <th className="px-5 py-3">Subtotal</th>
                  <th className="px-5 py-3">IVA (19%)</th>
                  <th className="px-5 py-3">Total Pagado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paidAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      Aún no se han cobrado citas en esta sede.
                    </td>
                  </tr>
                ) : (
                  paidAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono font-bold text-indigo-700">
                        {apt.factura?.id_factura}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{apt.factura?.fecha_emision}</td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-800">{apt.patientName}</div>
                        <div className="text-[11px] text-slate-500">{apt.treatment}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          {apt.pago?.metodo_pago}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          Ref: {apt.pago?.referencia}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-600">
                        ${apt.factura?.subtotal}
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-600">
                        ${apt.factura?.impuesto}
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-emerald-700 text-sm">
                        ${apt.factura?.total} USD
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: RECORDATORIOS 24H (Matching APScheduler task in FastAPI) */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-rose-100 text-rose-700 font-bold">⏰</span>
                <h2 className="text-base font-bold text-slate-900">
                  Programador de Recordatorios 24h (APScheduler)
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                En el backend, una tarea cron corre a las 08:00 AM escaneando todas las citas del día siguiente y despachando correos HTML mediante Gmail SMTP. Puede lanzar una ejecución manual de prueba en cualquier momento.
              </p>
            </div>

            <button
              onClick={handleRunReminders}
              disabled={remindersRunning}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{remindersRunning ? 'Ejecutando APScheduler...' : 'Disparar Recordatorios 24h Ahora'}</span>
            </button>
          </div>

          {remindersResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2 animate-in fade-in">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Simulación de Tarea Cron completada con éxito</span>
              </div>
              <p>
                Se detectaron <strong>{remindersResult.enviados}</strong> cita(s) programadas para mañana. Se generaron las plantillas HTML con horario y doctor.
              </p>
              <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5">
                {remindersResult.destinatarios.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-700 space-y-2">
            <h4 className="font-bold text-slate-900">⚙️ Configuración del Servicio de Correo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-500 block">Servidor SMTP:</span>
                <strong className="font-mono text-slate-800">smtp.gmail.com:587 (TLS)</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Frecuencia Automatizada:</span>
                <strong className="text-slate-800">Diaria a las 08:00 AM (APScheduler)</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Plantilla de Mensaje:</span>
                <span className="text-slate-700">HTML con fecha, hora, doctor y recomendaciones</span>
              </div>
              <div>
                <span className="text-slate-500 block">Integración Odontólogo:</span>
                <span className="text-emerald-700 font-semibold">Google Calendar + Gmail en paralelo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: PROVEEDORES & INSUMOS ODONTOLÓGICOS */}
      {activeTab === 'proveedores' && (
        <ProveedorDashboard tenantId={tenantId} />
      )}

      {/* Modal: Incorporar Odontólogo */}
      {showAddDentistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-600" />
                <span>Incorporar Nuevo Odontólogo a la Clínica</span>
              </h3>
              <button
                onClick={() => setShowAddDentistModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterDentist} className="space-y-3 pt-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Dr. Andrés Restrepo"
                  value={dentistForm.name}
                  onChange={(e) => setDentistForm({ ...dentistForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Correo Electrónico (Login) *</label>
                <input
                  type="email"
                  required
                  placeholder="doctor@clinica.com"
                  value={dentistForm.email}
                  onChange={(e) => setDentistForm({ ...dentistForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={dentistForm.phone}
                    onChange={(e) => setDentistForm({ ...dentistForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Matrícula / Registro</label>
                  <input
                    type="text"
                    placeholder="MN-12345"
                    value={dentistForm.licenseNumber}
                    onChange={(e) => setDentistForm({ ...dentistForm, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Especialidad</label>
                <select
                  value={dentistForm.specialty}
                  onChange={(e) => setDentistForm({ ...dentistForm, specialty: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="Odontología General">Odontología General</option>
                  <option value="Ortodoncia & Alineadores">Ortodoncia & Alineadores</option>
                  <option value="Endodoncia & Estética">Endodoncia & Estética</option>
                  <option value="Implantología & Cirugía Oral">Implantología & Cirugía Oral</option>
                  <option value="Periodoncia">Periodoncia</option>
                  <option value="Odontopediatría">Odontopediatría</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Consultorio / Sala Asignada</label>
                <select
                  value={dentistForm.id_consultorio}
                  onChange={(e) => setDentistForm({ ...dentistForm, id_consultorio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                >
                  {clinicConsultorios.map((c) => (
                    <option key={c.id_consultorio} value={c.id_consultorio}>
                      {c.nombre} ({c.numero_sala})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Guardar y Habilitar Acceso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Consultorio */}
      {showAddConsultorioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Registrar Nuevo Consultorio o Unidad</span>
              </h3>
              <button
                onClick={() => setShowAddConsultorioModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateConsultorio} className="space-y-3 pt-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre del Consultorio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Consultorio C - Cirugía & Periodoncia"
                  value={consultorioForm.nombre}
                  onChange={(e) => setConsultorioForm({ ...consultorioForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Número de Sala *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sala 103"
                    value={consultorioForm.numero_sala}
                    onChange={(e) => setConsultorioForm({ ...consultorioForm, numero_sala: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ubicación / Piso</label>
                  <input
                    type="text"
                    placeholder="Piso 2 - Ala Norte"
                    value={consultorioForm.ubicacion}
                    onChange={(e) => setConsultorioForm({ ...consultorioForm, ubicacion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Registrar Consultorio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Tratamiento */}
      {showAddTratamientoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Añadir Tratamiento al Catálogo</span>
              </h3>
              <button
                onClick={() => setShowAddTratamientoModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTratamiento} className="space-y-3 pt-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre del Tratamiento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Corona en Disilicato de Litio"
                  value={tratamientoForm.nombre}
                  onChange={(e) => setTratamientoForm({ ...tratamientoForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={tratamientoForm.descripcion}
                  onChange={(e) => setTratamientoForm({ ...tratamientoForm, descripcion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Costo ($ USD) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={tratamientoForm.costo}
                    onChange={(e) => setTratamientoForm({ ...tratamientoForm, costo: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Duración Estimada</label>
                  <input
                    type="text"
                    placeholder="45 minutos"
                    value={tratamientoForm.duracion_estimada}
                    onChange={(e) => setTratamientoForm({ ...tratamientoForm, duracion_estimada: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Guardar en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cobrar Cita y Emitir Factura */}
      {paymentModalAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Asentar Pago y Emitir Factura</span>
              </h3>
              <button
                onClick={() => setPaymentModalAppointment(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-3 pt-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800">{paymentModalAppointment.patientName}</p>
                <p className="text-slate-500 text-[11px]">{paymentModalAppointment.treatment}</p>
                <div className="flex items-center justify-between pt-1 font-mono">
                  <span>Monto Total a Cobrar:</span>
                  <strong className="text-emerald-700 text-sm">
                    ${paymentModalAppointment.price} USD
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta de Crédito/Débito">Tarjeta de Crédito / Débito</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="MercadoPago / PSE">MercadoPago / PSE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Referencia / Voucher (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: AUT-984029"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Pago y Generar Factura</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
