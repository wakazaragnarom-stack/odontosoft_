import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
  Mail,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Phone,
  Building2,
  Receipt,
  FileText,
} from 'lucide-react';
import type { Appointment, DentistProfile, Tratamiento } from '../../types';
import { getStoreState, bookAppointment } from '../../lib/store';

interface PatientPortalProps {
  tenantId: string;
}

const FALLBACK_TREATMENTS: Tratamiento[] = [
  {
    id_tratamiento: 't-1',
    tenantId: 'default',
    nombre: 'Evaluación y Diagnóstico Inicial',
    duracion_estimada: '30 minutos',
    costo: 40,
    descripcion: 'Revisión clínica general, odontograma completo y presupuesto de tratamiento.',
  },
  {
    id_tratamiento: 't-2',
    tenantId: 'default',
    nombre: 'Limpieza y Profilaxis Ultrasónica',
    duracion_estimada: '45 minutos',
    costo: 50,
    descripcion: 'Eliminación de sarro supra/subgingival, pulido coronario y fluorización.',
  },
  {
    id_tratamiento: 't-3',
    tenantId: 'default',
    nombre: 'Ajuste de Ortodoncia / Brackets',
    duracion_estimada: '45 minutos',
    costo: 65,
    descripcion: 'Cambio de arcos estéticos o metálicos, reposición de ligaduras y activación.',
  },
  {
    id_tratamiento: 't-4',
    tenantId: 'default',
    nombre: 'Blanqueamiento Dental LED en Consultorio',
    duracion_estimada: '60 minutos',
    costo: 130,
    descripcion: 'Fotoactivación con luz fría LED de peróxido de alta densidad estética.',
  },
  {
    id_tratamiento: 't-5',
    tenantId: 'default',
    nombre: 'Endodoncia & Tratamiento de Conducto',
    duracion_estimada: '90 minutos',
    costo: 160,
    descripcion: 'Instrumentación rotatoria mecanizada y sellado termoplástico radicular.',
  },
];

const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

export const PatientPortal: React.FC<PatientPortalProps> = ({ tenantId }) => {
  const store = getStoreState();
  const currentTenant = store.tenants.find((t) => t.id === tenantId);
  const isSuspended = currentTenant?.status === 'suspended';

  const clinicDentists = store.dentists.filter((d) => d.tenantId === tenantId);
  const tenantTratamientos = store.tratamientos.filter((t) => t.tenantId === tenantId);
  const activeTreatments = tenantTratamientos.length > 0 ? tenantTratamientos : FALLBACK_TREATMENTS;

  const [activeTab, setActiveTab] = useState<'book' | 'my_appointments'>('book');

  // Booking Flow Steps
  const [selectedTreatment, setSelectedTreatment] = useState<Tratamiento>(activeTreatments[0]);
  const [selectedDentist, setSelectedDentist] = useState<DentistProfile>(
    clinicDentists[0] || null
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[1]);

  // Patient Info matching FastAPI Paciente model
  const [patientName, setPatientName] = useState('Lucas Martínez');
  const [patientEmail, setPatientEmail] = useState('lucas.martinez@gmail.com');
  const [patientPhone, setPatientPhone] = useState('+1 (555) 912-3456');
  const [patientDocumento, setPatientDocumento] = useState('CC10293847');
  const [patientEps, setPatientEps] = useState('Sanitas EPS');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Patient's own appointments
  const myAppointments = store.appointments.filter(
    (a) =>
      (a.patientEmail.toLowerCase() === patientEmail.toLowerCase() ||
        a.patientDocumento === patientDocumento) &&
      a.tenantId === tenantId
  );

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isSuspended) {
      setErrorMessage(
        'El agendamiento en línea no está disponible en este momento para esta clínica (Servicio Suspendido por el Proveedor).'
      );
      return;
    }

    if (!selectedDentist) {
      setErrorMessage('Por favor seleccione un odontólogo de la lista.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newBooking = await bookAppointment({
        tenantId,
        dentistId: selectedDentist.id,
        dentistName: selectedDentist.name,
        dentistEmail: selectedDentist.email,
        patientId: `pat-${Date.now()}`,
        patientName,
        patientEmail,
        patientPhone,
        patientDocumento,
        id_consultorio: selectedDentist.id_consultorio,
        consultorioNombre: selectedDentist.consultorioNombre,
        treatment: selectedTreatment.nombre,
        tratamientosIds: [selectedTreatment.id_tratamiento],
        date: selectedDate,
        time: selectedTime,
        durationMinutes: 45,
        price: selectedTreatment.costo,
        notes: notes || `Motivo de consulta: ${selectedTreatment.nombre}. EPS: ${patientEps}`,
      });

      setConfirmedBooking(newBooking);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la reserva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner if Clinic is Suspended */}
      {isSuspended && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 text-rose-900 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-200 text-rose-800 rounded-xl shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-block bg-rose-600 text-white text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full mb-1">
                Servicio Clínico Suspendido
              </span>
              <h2 className="text-xl font-black text-rose-900">
                Agendamiento de Turnos Temporalmente Inhabilitado
              </h2>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed max-w-2xl">
                Estimado paciente, el portal de reservas online de{' '}
                <strong>{currentTenant?.name}</strong> se encuentra pausado administrativamente. Por
                favor comuníquese telefónicamente al {currentTenant?.phone} para solicitar
                atención de urgencia.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full inline-block mb-1">
              Portal de Autoservicio para Pacientes
            </span>
            <h1 className="text-2xl font-black text-white">
              Agende su Turno en {currentTenant?.name}
            </h1>
            <p className="text-xs text-white/90 mt-1">
              {currentTenant?.address} • Consultorios habilitados y confirmación instantánea
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('book')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'book'
                  ? 'bg-white text-sky-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              Agendar Nueva Cita
            </button>
            <button
              onClick={() => setActiveTab('my_appointments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my_appointments'
                  ? 'bg-white text-sky-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              Mis Turnos ({myAppointments.length})
            </button>
          </div>
        </div>
      </div>

      {/* View 1: Booking Flow */}
      {activeTab === 'book' && (
        <>
          {confirmedBooking ? (
            /* Confirmation Screen */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 animate-in fade-in">
              <div className="text-center space-y-2 max-w-md mx-auto">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">¡Cita Agendada con Éxito!</h2>
                <p className="text-xs text-slate-500">
                  Su reserva ha sido procesada e integrada automáticamente en la agenda del consultorio.
                </p>
              </div>

              {/* Automations feedback boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs space-y-1">
                  <div className="flex items-center gap-2 text-teal-800 font-bold">
                    <CalendarCheck className="w-4 h-4 text-teal-600" />
                    <span>Google Calendar Sincronizado</span>
                  </div>
                  <p className="text-teal-700 text-[11px] leading-relaxed">
                    La cita fue añadida automáticamente a la agenda oficial del Dr(a).{' '}
                    {confirmedBooking.dentistName}.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs space-y-1">
                  <div className="flex items-center gap-2 text-sky-800 font-bold">
                    <Mail className="w-4 h-4 text-sky-600" />
                    <span>Notificación de Turno Enviada</span>
                  </div>
                  <p className="text-sky-700 text-[11px] leading-relaxed">
                    Se despachó un correo electrónico con los detalles a {confirmedBooking.patientEmail}.
                  </p>
                </div>
              </div>

              {/* Booking Summary Box */}
              <div className="max-w-md mx-auto p-5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Paciente:</span>
                  <span className="font-bold text-slate-900">
                    {confirmedBooking.patientName} ({confirmedBooking.patientDocumento})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tratamiento:</span>
                  <span className="font-bold text-slate-900">{confirmedBooking.treatment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Odontólogo & Sala:</span>
                  <span className="font-bold text-slate-900">
                    {confirmedBooking.dentistName} • {confirmedBooking.consultorioNombre || 'Sala 101'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha y Hora:</span>
                  <span className="font-bold text-slate-900">
                    {confirmedBooking.date} a las {confirmedBooking.time} hs
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>Valor consulta:</span>
                  <span className="text-emerald-600 font-black">${confirmedBooking.price} USD</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setConfirmedBooking(null);
                    setActiveTab('my_appointments');
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  Ver mis turnos agendados
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleBookAppointment} className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Step 1: Select Treatment */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h2 className="font-bold text-base text-slate-900">
                    Seleccione el Tratamiento o Procedimiento
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeTreatments.map((t) => {
                    const isSelected = selectedTreatment.id_tratamiento === t.id_tratamiento;
                    return (
                      <div
                        key={t.id_tratamiento}
                        onClick={() => setSelectedTreatment(t)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50/60 ring-2 ring-sky-500/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <h3 className="font-bold text-xs text-slate-900">{t.nombre}</h3>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{t.descripcion}</p>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-400">{t.duracion_estimada}</span>
                          <span className="font-black text-sky-700">${t.costo} USD</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Dentist & Schedule */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h2 className="font-bold text-base text-slate-900">
                    Seleccione Odontólogo y Horario
                  </h2>
                </div>

                {/* Dentists list */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Odontólogo Especialista:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {clinicDentists.map((d) => {
                      const isSelected = selectedDentist?.id === d.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDentist(d)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {d.name.charAt(3) || 'D'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate">{d.name}</h4>
                            <p className="text-[11px] text-teal-700 truncate">{d.specialty}</p>
                            <span className="text-[10px] text-indigo-600 block truncate">
                              {d.consultorioNombre || 'Consultorio General'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Date & Time selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fecha deseada
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Horario disponible
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIME_SLOTS.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            selectedTime === time
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Patient Information */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h2 className="font-bold text-base text-slate-900">
                    Datos del Paciente (Ficha Clínica)
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Documento de Identidad (Cédula) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="CC10293847"
                      value={patientDocumento}
                      onChange={(e) => setPatientDocumento(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Correo Electrónico (Notificaciones) *
                    </label>
                    <input
                      type="email"
                      required
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      EPS / Cobertura Médica
                    </label>
                    <input
                      type="text"
                      value={patientEps}
                      onChange={(e) => setPatientEps(e.target.value)}
                      placeholder="Ej: Sanitas, Sura, Particular..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Motivo de consulta o síntomas (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describa brevemente si siente dolor, sensibilidad o si es un control regular..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Action Submit */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    <span>Total a abonar en consulta: </span>
                    <span className="font-bold text-slate-900 text-sm">
                      ${selectedTreatment.costo} USD
                    </span>
                  </div>

                  <button
                    id="submit-booking-btn"
                    type="submit"
                    disabled={isSubmitting || isSuspended}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all ${
                      isSuspended
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                    }`}
                  >
                    <span>{isSubmitting ? 'Agendando turno...' : 'Confirmar Cita Odontológica'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          )}
        </>
      )}

      {/* View 2: My Scheduled Appointments */}
      {activeTab === 'my_appointments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Mis Citas Registradas en {currentTenant?.name}
              </h2>
              <p className="text-xs text-slate-500">
                Historial de citas agendadas con su correo ({patientEmail}) y documento ({patientDocumento}).
              </p>
            </div>
            <button
              onClick={() => setActiveTab('book')}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <span>+ Nuevo Turno</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {myAppointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No tiene citas activas registradas con estos datos.
              </div>
            ) : (
              myAppointments.map((apt) => (
                <div key={apt.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{apt.treatment}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {apt.status === 'confirmed' ? 'Confirmada' : 'Programada'}
                      </span>
                      {apt.pago && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          Facturado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      Doctor: <strong>{apt.dentistName}</strong> • {apt.consultorioNombre || 'Sala de Atención'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {apt.date} a las {apt.time} hs
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        Sincronizada con Google Calendar
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-slate-900 block">${apt.price} USD</span>
                    {apt.factura && (
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Factura #{apt.factura.id_factura.slice(-5)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
