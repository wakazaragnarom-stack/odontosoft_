import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  CalendarCheck,
  Mail,
  FileText,
  Upload,
  AlertTriangle,
  Play,
  Check,
  X,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Send,
  Plus,
  BookOpen,
} from 'lucide-react';
import type {
  DentistProfile,
  Appointment,
  PatientRecord,
  ToothCondition,
} from '../../types';
import {
  getStoreState,
  updateAppointmentStatus,
  updateToothStatus,
  addClinicalEvolutionNote,
  updateDentistGoogleStatus,
  bookAppointment,
  guardarHistoriaClinicaDetallada,
} from '../../lib/store';
import {
  googleSignIn,
  firebaseLogout,
  getAccessToken,
} from '../../lib/firebase';
import { uploadClinicalFileToDrive } from '../../lib/googleWorkspace';

interface DentistDashboardProps {
  tenantId: string;
}

export const DentistDashboard: React.FC<DentistDashboardProps> = ({ tenantId }) => {
  const store = getStoreState();
  const currentTenant = store.tenants.find((t) => t.id === tenantId);
  const isSuspended = currentTenant?.status === 'suspended';

  // Available dentists in this clinic
  const clinicDentists = store.dentists.filter((d) => d.tenantId === tenantId);
  const [selectedDentistId, setSelectedDentistId] = useState<string>(
    clinicDentists[0]?.id || ''
  );

  const activeDentist =
    clinicDentists.find((d) => d.id === selectedDentistId) || clinicDentists[0];

  const [activeTab, setActiveTab] = useState<'agenda' | 'odontogram' | 'anamnesis'>('agenda');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-1');
  const [selectedTooth, setSelectedTooth] = useState<ToothCondition | null>(null);
  const [newToothCondition, setNewToothCondition] = useState<ToothCondition['status']>('healthy');
  const [toothNotes, setToothNotes] = useState('');

  // Anamnesis / Historia Clinica Detallada state (FastAPI Synced)
  const [anamnesisForm, setAnamnesisForm] = useState({
    motivo_consulta: '',
    antecedentes_medicos: '',
    alergias_especificas: '',
    presion_arterial: '',
    enfermedades_sistemicas: '',
    medicacion_actual: '',
    habitos: '',
    diagnostico_periodontal: '',
    observaciones_generales: '',
  });
  const [anamnesisSaved, setAnamnesisSaved] = useState(false);

  // Evolution note form
  const [evolutionTreatment, setEvolutionTreatment] = useState('');
  const [evolutionNotes, setEvolutionNotes] = useState('');

  // Google status
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(activeDentist?.googleCalendarLinked || false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // File upload state for Drive
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [showDriveConfirmModal, setShowDriveConfirmModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Get appointments for active dentist
  const dentistAppointments = store.appointments.filter(
    (a) => a.dentistId === activeDentist?.id && a.tenantId === tenantId
  );

  const selectedPatient = store.patients.find((p) => p.id === selectedPatientId) || store.patients[0];

  const handleLinkGoogleAccount = async () => {
    setIsLinkingGoogle(true);
    try {
      const res = await googleSignIn();
      if (res && activeDentist) {
        setGoogleConnected(true);
        updateDentistGoogleStatus(activeDentist.id, true, res.user.email || undefined);
        setSyncFeedback(`Google Calendar y Gmail vinculados a ${res.user.email}`);
      }
    } catch (err) {
      console.error('Error linking Google account:', err);
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleSendTestAppointment = async () => {
    if (!activeDentist) return;
    try {
      const testApt = await bookAppointment({
        tenantId,
        dentistId: activeDentist.id,
        dentistName: activeDentist.name,
        dentistEmail: activeDentist.email,
        patientId: 'pat-test',
        patientName: 'Paciente de Prueba',
        patientEmail: 'paciente.prueba@gmail.com',
        patientPhone: '+1 555 123 4567',
        treatment: 'Revisión Periódica',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '14:00',
        durationMinutes: 30,
        price: 45,
        notes: 'Turno de prueba para validar Google Calendar y notificación por correo.',
      });
      setSyncFeedback(
        `Turno de prueba creado y sincronizado en Google Calendar. Correo de notificación enviado a ${activeDentist.email}`
      );
    } catch (err: any) {
      setSyncFeedback(`Error: ${err.message}`);
    }
  };

  const handleToothClick = (tooth: ToothCondition) => {
    setSelectedTooth(tooth);
    setNewToothCondition(tooth.status);
    setToothNotes(tooth.notes || '');
  };

  const handleSaveTooth = () => {
    if (selectedTooth && selectedPatient) {
      updateToothStatus(selectedPatient.id, selectedTooth.toothNumber, newToothCondition, toothNotes);
      setSelectedTooth(null);
    }
  };

  const handleAddEvolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evolutionTreatment || !selectedPatient || !activeDentist) return;

    addClinicalEvolutionNote(selectedPatient.id, activeDentist.name, evolutionTreatment, evolutionNotes);
    setEvolutionTreatment('');
    setEvolutionNotes('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowDriveConfirmModal(true);
  };

  const handleConfirmDriveUpload = async () => {
    if (!pendingFile || !selectedPatient) return;
    setIsUploadingDrive(true);
    setShowDriveConfirmModal(false);

    try {
      const res = await uploadClinicalFileToDrive(
        pendingFile,
        selectedPatient.name,
        async () => true // User just confirmed in UI modal
      );

      if (res.success) {
        setSyncFeedback(`Radiografía ${pendingFile.name} subida exitosamente a Google Drive.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingDrive(false);
      setPendingFile(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Suspended Notice if Clinic is Inactive */}
      {isSuspended && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 text-rose-900 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h3 className="font-bold text-sm text-rose-900">
                Atención: Servicio de la Clínica Suspendido por Falta de Pago
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                La administración central del SaaS ha bloqueado la recepción de nuevas citas hasta que
                se regularice la mensualidad de la clínica.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold bg-rose-200 text-rose-800 px-3 py-1 rounded-full uppercase">
            Solo Consulta
          </span>
        </div>
      )}

      {/* Dentist Profile & Selector Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-teal-600/20">
            {activeDentist?.name.charAt(3) || 'D'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{activeDentist?.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                {activeDentist?.specialty}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeDentist?.email} • Matrícula {activeDentist?.licenseNumber} • {currentTenant?.name}
            </p>
          </div>
        </div>

        {/* Switch Dentist for demo */}
        {clinicDentists.length > 1 && (
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Ver como:</span>
            <select
              value={selectedDentistId}
              onChange={(e) => {
                setSelectedDentistId(e.target.value);
                const d = clinicDentists.find((item) => item.id === e.target.value);
                setGoogleConnected(d?.googleCalendarLinked || false);
              }}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {clinicDentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Google Calendar & Email Synchronization Hub */}
      <div className="bg-gradient-to-br from-teal-900 via-slate-900 to-sky-950 text-white rounded-2xl p-6 shadow-md border border-teal-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2 border border-teal-500/30">
              <CalendarCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Automatización Google Calendar & Gmail</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Sincronización Automática de Turnos Odontológicos
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Cada vez que un paciente o la clínica le agende una cita, el sistema agregará el evento
              automáticamente a su <strong>Google Calendar</strong> personal con recordatorios y le
              despachará una notificación por <strong>correo electrónico</strong> con la ficha del
              turno.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {googleConnected ? (
              <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 rounded-xl text-xs text-emerald-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Google Calendar Vinculado</span>
              </div>
            ) : (
              <button
                id="link-google-dentist-btn"
                onClick={handleLinkGoogleAccount}
                disabled={isLinkingGoogle}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>{isLinkingGoogle ? 'Conectando...' : 'Vincular mi Google Calendar'}</span>
              </button>
            )}

            <button
              id="test-calendar-sync-btn"
              onClick={handleSendTestAppointment}
              className="px-3.5 py-2 bg-teal-600/60 hover:bg-teal-600 border border-teal-400/40 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              title="Crea una cita de prueba y verifica la sincronización"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Probar Sincronización</span>
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-teal-950/80 border border-teal-700/60 text-xs text-teal-200 flex items-center justify-between">
            <span>✨ {syncFeedback}</span>
            <button
              onClick={() => setSyncFeedback(null)}
              className="text-teal-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Tabs: Agenda vs Odontograma Digital */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          id="tab-agenda-btn"
          onClick={() => setActiveTab('agenda')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'agenda'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Mi Agenda de Turnos ({dentistAppointments.length})</span>
        </button>

        <button
          id="tab-odontogram-btn"
          onClick={() => setActiveTab('odontogram')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'odontogram'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Ficha Clínica & Odontograma 32 Piezas</span>
        </button>

        <button
          id="tab-anamnesis-btn"
          onClick={() => {
            setActiveTab('anamnesis');
            if (selectedPatient?.historiaDetallada?.datos_clinicos) {
              const dc = selectedPatient.historiaDetallada.datos_clinicos;
              setAnamnesisForm({
                motivo_consulta: dc.motivo_consulta || '',
                antecedentes_medicos: dc.antecedentes_medicos || '',
                alergias_especificas: dc.alergias_especificas || selectedPatient.alergias || '',
                presion_arterial: dc.presion_arterial || '',
                enfermedades_sistemicas: dc.enfermedades_sistemicas || '',
                medicacion_actual: dc.medicacion_actual || '',
                habitos: dc.habitos || '',
                diagnostico_periodontal: dc.diagnostico_periodontal || '',
                observaciones_generales: dc.observaciones_generales || selectedPatient.notes || '',
              });
            }
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'anamnesis'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>Historia Clínica Detallada (Anamnesis)</span>
        </button>
      </div>

      {/* Tab 1: Agenda */}
      {activeTab === 'agenda' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Próximos Turnos Asignados a {activeDentist?.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Citas agregadas automáticamente a su Google Calendar y notificadas por correo.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              {dentistAppointments.length} turnos registrados
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {dentistAppointments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No tiene turnos agendados en este momento.
              </div>
            ) : (
              dentistAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex flex-col items-center justify-center shrink-0 border border-teal-100">
                      <span className="text-[10px] uppercase font-bold text-teal-800">
                        {new Date(apt.date).toLocaleDateString('es-ES', { month: 'short' })}
                      </span>
                      <span className="text-base font-black leading-none">
                        {apt.date.split('-')[2]}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{apt.patientName}</h3>
                        <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                          {apt.treatment}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {apt.time} hs (
                          {apt.durationMinutes} min)
                        </span>
                        <span>•</span>
                        <span>{apt.patientPhone}</span>
                        <span>•</span>
                        <span>{apt.patientEmail}</span>
                      </div>
                      {apt.notes && (
                        <p className="text-xs text-slate-600 mt-1.5 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          "{apt.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Sync Indicators */}
                  <div className="flex flex-wrap items-center gap-2 sm:self-center">
                    {/* Google Sync Pill */}
                    {apt.googleCalendarSynced && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        Calendar
                      </span>
                    )}

                    {/* Email Pill */}
                    {apt.emailNotificationSent && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </span>
                    )}

                    {/* Status Dropdown */}
                    <select
                      value={apt.status}
                      disabled={isSuspended}
                      onChange={(e) => updateAppointmentStatus(apt.id, e.target.value as any)}
                      className="text-xs font-bold border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="scheduled">Agendado</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="in_progress">En Consulta</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>

                    <button
                      onClick={() => {
                        setSelectedPatientId(apt.patientId);
                        setActiveTab('odontogram');
                      }}
                      className="text-xs font-semibold px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
                    >
                      Odontograma
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Odontograma Digital & Ficha Clínica */}
      {activeTab === 'odontogram' && (
        <div className="space-y-6">
          {/* Patient Selector */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Expediente Clínico del Paciente
              </span>
              <h2 className="text-lg font-black text-slate-900">{selectedPatient?.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedPatient?.phone} • {selectedPatient?.email} • {selectedPatient?.notes}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">Cambiar Paciente:</span>
              <select
                value={selectedPatient?.id}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
              >
                {store.patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Upload Radiograph to Drive button */}
              <label
                htmlFor="radiograph-upload"
                className="text-xs font-semibold px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Radiografía</span>
                <input
                  id="radiograph-upload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Interactive Odontogram Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Odontograma Interactivo (Sistema FDI)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Haga clic en cualquier pieza dental para cambiar su estado patológico o tratamiento.
                </p>
              </div>

              {/* Color legend */}
              <div className="hidden lg:flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Sano
                </span>
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Caries
                </span>
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span> Obturación
                </span>
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Corona
                </span>
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span> Implante
                </span>
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-slate-300 inline-block"></span> Ausente
                </span>
              </div>
            </div>

            {/* Upper Arch (18 to 28) */}
            <div className="mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                Arcada Superior (Maxilar)
              </span>
              <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
                {selectedPatient?.odontogram.slice(0, 16).map((tooth) => {
                  const colorClass =
                    tooth.status === 'healthy'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : tooth.status === 'caries'
                      ? 'bg-rose-100 text-rose-800 border-rose-400 font-bold'
                      : tooth.status === 'filled'
                      ? 'bg-sky-100 text-sky-800 border-sky-400 font-bold'
                      : tooth.status === 'crown'
                      ? 'bg-amber-100 text-amber-800 border-amber-400 font-bold'
                      : tooth.status === 'implant'
                      ? 'bg-purple-100 text-purple-800 border-purple-400 font-bold'
                      : 'bg-slate-100 text-slate-400 border-slate-300 line-through';

                  return (
                    <button
                      key={tooth.toothNumber}
                      onClick={() => handleToothClick(tooth)}
                      className={`w-9 h-12 sm:w-11 sm:h-14 rounded-xl border flex flex-col items-center justify-between p-1 transition-transform hover:scale-105 ${colorClass}`}
                      title={`Pieza ${tooth.toothNumber}: ${tooth.status} ${tooth.notes ? `(${tooth.notes})` : ''}`}
                    >
                      <span className="text-[10px] font-mono">{tooth.toothNumber}</span>
                      <span className="text-xs">🦷</span>
                      <span className="text-[9px] uppercase font-bold leading-none">
                        {tooth.status === 'healthy'
                          ? 'OK'
                          : tooth.status === 'caries'
                          ? 'CAR'
                          : tooth.status === 'filled'
                          ? 'OBT'
                          : tooth.status === 'crown'
                          ? 'COR'
                          : tooth.status === 'implant'
                          ? 'IMP'
                          : 'AUS'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lower Arch (48 to 38) */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                Arcada Inferior (Mandibular)
              </span>
              <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
                {selectedPatient?.odontogram.slice(16, 32).map((tooth) => {
                  const colorClass =
                    tooth.status === 'healthy'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : tooth.status === 'caries'
                      ? 'bg-rose-100 text-rose-800 border-rose-400 font-bold'
                      : tooth.status === 'filled'
                      ? 'bg-sky-100 text-sky-800 border-sky-400 font-bold'
                      : tooth.status === 'crown'
                      ? 'bg-amber-100 text-amber-800 border-amber-400 font-bold'
                      : tooth.status === 'implant'
                      ? 'bg-purple-100 text-purple-800 border-purple-400 font-bold'
                      : 'bg-slate-100 text-slate-400 border-slate-300 line-through';

                  return (
                    <button
                      key={tooth.toothNumber}
                      onClick={() => handleToothClick(tooth)}
                      className={`w-9 h-12 sm:w-11 sm:h-14 rounded-xl border flex flex-col items-center justify-between p-1 transition-transform hover:scale-105 ${colorClass}`}
                      title={`Pieza ${tooth.toothNumber}: ${tooth.status}`}
                    >
                      <span className="text-[9px] uppercase font-bold leading-none">
                        {tooth.status === 'healthy'
                          ? 'OK'
                          : tooth.status === 'caries'
                          ? 'CAR'
                          : tooth.status === 'filled'
                          ? 'OBT'
                          : tooth.status === 'crown'
                          ? 'COR'
                          : tooth.status === 'implant'
                          ? 'IMP'
                          : 'AUS'}
                      </span>
                      <span className="text-xs">🦷</span>
                      <span className="text-[10px] font-mono">{tooth.toothNumber}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Clinical Evolution History & Drive Files */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolution Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Evolución Clínica del Paciente</h3>

              {/* Add evolution note form */}
              <form onSubmit={handleAddEvolution} className="space-y-3 bg-slate-50 p-3 rounded-xl text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tratamiento Realizado
                  </label>
                  <input
                    type="text"
                    required
                    value={evolutionTreatment}
                    onChange={(e) => setEvolutionTreatment(e.target.value)}
                    placeholder="Ej: Obturación resina oclusal pieza 26"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Observaciones Clínicas
                  </label>
                  <textarea
                    rows={2}
                    value={evolutionNotes}
                    onChange={(e) => setEvolutionNotes(e.target.value)}
                    placeholder="Evolución favorable, anestesia infiltrativa..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-xs transition-colors"
                >
                  Registrar Entrada
                </button>
              </form>

              {/* History list */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {selectedPatient?.clinicalEvolution.map((evo) => (
                  <div
                    key={evo.id}
                    className="p-3 rounded-xl border border-slate-100 bg-white text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{evo.treatment}</span>
                      <span className="text-[10px] text-slate-400">{evo.date}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{evo.notes}</p>
                    <span className="text-[10px] text-teal-700 font-medium block">
                      Atendido por: {evo.dentistName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Google Drive Radiographs & Files */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Estudios y Radiografías en Google Drive
                </h3>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                  drive.file
                </span>
              </div>

              <div className="space-y-3">
                {selectedPatient?.driveFiles && selectedPatient.driveFiles.length > 0 ? (
                  selectedPatient.driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                          X-RAY
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{file.name}</p>
                          <span className="text-[10px] text-slate-400">
                            {file.uploadedAt} • {file.size || '1.8 MB'}
                          </span>
                        </div>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
                      >
                        <span>Abrir</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No se han subido radiografías o archivos para este paciente.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Historia Clínica Detallada (Anamnesis) */}
      {activeTab === 'anamnesis' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-1 border border-purple-200">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Historia Clínica Detallada • Sincronización FastAPI</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Anamnesis y Datos Clínicos de {selectedPatient?.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro de antecedentes médicos, alergias, presión arterial y hábitos patológicos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Paciente:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    setSelectedPatientId(e.target.value);
                    const p = store.patients.find((item) => item.id === e.target.value);
                    if (p?.historiaDetallada?.datos_clinicos) {
                      const dc = p.historiaDetallada.datos_clinicos;
                      setAnamnesisForm({
                        motivo_consulta: dc.motivo_consulta || '',
                        antecedentes_medicos: dc.antecedentes_medicos || '',
                        alergias_especificas: dc.alergias_especificas || p.alergias || '',
                        presion_arterial: dc.presion_arterial || '',
                        enfermedades_sistemicas: dc.enfermedades_sistemicas || '',
                        medicacion_actual: dc.medicacion_actual || '',
                        habitos: dc.habitos || '',
                        diagnostico_periodontal: dc.diagnostico_periodontal || '',
                        observaciones_generales: dc.observaciones_generales || p.notes || '',
                      });
                    }
                  }}
                  className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  {store.patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {anamnesisSaved && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>¡Historia clínica detallada guardada correctamente en la ficha del paciente!</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                guardarHistoriaClinicaDetallada(selectedPatientId, anamnesisForm);
                setAnamnesisSaved(true);
                setTimeout(() => setAnamnesisSaved(false), 2500);
              }}
              className="mt-6 space-y-5 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Motivo de Consulta Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={anamnesisForm.motivo_consulta}
                    onChange={(e) =>
                      setAnamnesisForm({ ...anamnesisForm, motivo_consulta: e.target.value })
                    }
                    placeholder="Ej: Dolor agudo en molar superior, control general..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Presión Arterial (Signos Vitales)
                  </label>
                  <input
                    type="text"
                    value={anamnesisForm.presion_arterial}
                    onChange={(e) =>
                      setAnamnesisForm({ ...anamnesisForm, presion_arterial: e.target.value })
                    }
                    placeholder="Ej: 120/80 mmHg"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alergias Medicamentosas Específicas
                  </label>
                  <input
                    type="text"
                    value={anamnesisForm.alergias_especificas}
                    onChange={(e) =>
                      setAnamnesisForm({ ...anamnesisForm, alergias_especificas: e.target.value })
                    }
                    placeholder="Ej: Penicilina, AINEs, Látex..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Enfermedades Sistémicas
                  </label>
                  <input
                    type="text"
                    value={anamnesisForm.enfermedades_sistemicas}
                    onChange={(e) =>
                      setAnamnesisForm({ ...anamnesisForm, enfermedades_sistemicas: e.target.value })
                    }
                    placeholder="Ej: Diabetes Tipo II, Hipertensión, Cardiopatías..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Medicación Farmacológica Actual
                  </label>
                  <input
                    type="text"
                    value={anamnesisForm.medicacion_actual}
                    onChange={(e) =>
                      setAnamnesisForm({ ...anamnesisForm, medicacion_actual: e.target.value })
                    }
                    placeholder="Ej: Losartán 50mg, Metformina 850mg..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hábitos & Factores de Riesgo
                  </label>
                  <input
                    type="text"
                    value={anamnesisForm.habitos}
                    onChange={(e) =>
                      setAnamnesisForm({ ...anamnesisForm, habitos: e.target.value })
                    }
                    placeholder="Ej: Bruxismo nocturno, Tabaquismo (5 cig/día)..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Antecedentes Médicos y Quirúrgicos Relevantes
                  </label>
                  <textarea
                    rows={3}
                    value={anamnesisForm.antecedentes_medicos}
                    onChange={(e) =>
                      setAnamnesisForm({ ...anamnesisForm, antecedentes_medicos: e.target.value })
                    }
                    placeholder="Cirugías previas, hemorragias prolongadas, hospitalizaciones..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Diagnóstico Periodontal & Plan Propuesto
                  </label>
                  <textarea
                    rows={3}
                    value={anamnesisForm.diagnostico_periodontal}
                    onChange={(e) =>
                      setAnamnesisForm({ ...anamnesisForm, diagnostico_periodontal: e.target.value })
                    }
                    placeholder="Gingivitis inducida por placa, Periodontitis estadio II, etc..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observaciones Generales y Evolución Clínica
                </label>
                <textarea
                  rows={2}
                  value={anamnesisForm.observaciones_generales}
                  onChange={(e) =>
                    setAnamnesisForm({ ...anamnesisForm, observaciones_generales: e.target.value })
                  }
                  placeholder="Comentarios adicionales para el odontograma o consentimiento informado..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-slate-400 text-[11px]">
                  Ficha sincronizada con esquema FastAPI /historias-clinicas-detalladas
                </span>
                <button
                  type="submit"
                  disabled={isSuspended}
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Historia Clínica Detallada</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Tooth Condition */}
      {selectedTooth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Pieza Dental #{selectedTooth.toothNumber}
              </h3>
              <button
                onClick={() => setSelectedTooth(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Diagnóstico / Estado
                </label>
                <select
                  value={newToothCondition}
                  onChange={(e) => setNewToothCondition(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="healthy">🟢 Sano / Sin patología</option>
                  <option value="caries">🔴 Caries activa</option>
                  <option value="filled">🔵 Obturación / Empaste</option>
                  <option value="crown">🟡 Corona protésica</option>
                  <option value="implant">🟣 Implante osteointegrado</option>
                  <option value="root_canal">🟠 Tratamiento de conducto</option>
                  <option value="missing">⚪ Pieza ausente / Extracción</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas Específicas de la Pieza
                </label>
                <textarea
                  rows={2}
                  value={toothNotes}
                  onChange={(e) => setToothNotes(e.target.value)}
                  placeholder="Detalles sobre caras afectadas (oclusal, mesial, etc.)..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedTooth(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTooth}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Guardar en Odontograma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Google Drive Upload (Workspace skill requirement) */}
      {showDriveConfirmModal && pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  ¿Subir archivo a Google Drive?
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Confirmación requerida para almacenar documentos clínicos.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1">
              <p>
                <strong>Archivo:</strong> {pendingFile.name}
              </p>
              <p>
                <strong>Tamaño:</strong> {(pendingFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p>
                <strong>Paciente:</strong> {selectedPatient?.name}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowDriveConfirmModal(false);
                  setPendingFile(null);
                }}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDriveUpload}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Confirmar y Subir a Drive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
