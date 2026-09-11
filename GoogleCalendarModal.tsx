import React, { useState } from 'react';
import {
  Calendar,
  CalendarCheck,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock,
  User,
  Building,
  Check,
  X,
  Sparkles,
  Link2,
  ShieldCheck,
} from 'lucide-react';
import type { Appointment } from '../../types';
import { getStoreState, updateAppointmentGoogleCalendar } from '../../lib/store';
import { createGoogleCalendarEvent } from '../../lib/googleWorkspace';
import { googleSignIn, firebaseLogout, getAccessToken } from '../../lib/firebase';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId?: string;
  dentistId?: string;
}

export const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  dentistId,
}) => {
  const store = getStoreState();
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  React.useEffect(() => {
    getAccessToken().then((t) => {
      if (t) setGoogleConnected(true);
    });
  }, []);

  if (!isOpen) return null;

  // Filter appointments for current context
  const appointments = store.appointments.filter((apt) => {
    if (tenantId && apt.tenantId !== tenantId) return false;
    if (dentistId && apt.dentistId !== dentistId) return false;
    return true;
  });

  const syncedCount = appointments.filter((a) => a.googleCalendarSynced).length;
  const pendingCount = appointments.length - syncedCount;

  const handleConnectGoogle = async () => {
    setConnecting(true);
    try {
      const user = await googleSignIn();
      if (user) {
        setGoogleConnected(true);
        setSyncFeedback('✓ Cuenta de Google Calendar conectada exitosamente.');
      }
    } catch (err: any) {
      setSyncFeedback('Error al conectar Google: ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await firebaseLogout();
    setGoogleConnected(false);
    setSyncFeedback('Cuenta de Google desconectada.');
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    setSyncFeedback(null);

    try {
      for (const apt of appointments) {
        if (!apt.googleCalendarSynced) {
          const res = await createGoogleCalendarEvent(apt);
          updateAppointmentGoogleCalendar(apt.id, res.eventId, true);
        }
      }
      setSyncFeedback('✓ Todas las citas han sido sincronizadas con Google Calendar.');
    } catch (err: any) {
      setSyncFeedback('Error en la sincronización: ' + err.message);
    } finally {
      setSyncingAll(false);
    }
  };

  const generateGoogleCalendarUrl = (apt: Appointment) => {
    const startTime = new Date(`${apt.date}T${apt.time}:00`);
    const endTime = new Date(startTime.getTime() + apt.durationMinutes * 60 * 1000);

    const startISO = startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endISO = endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const summary = `🦷 Cita OdontoSoft: ${apt.patientName} (${apt.treatment})`;
    const details = `Cita Odontológica OdontoSoft
--------------------------------
• Paciente: ${apt.patientName}
• Documento: ${apt.patientDocumento || 'No especificado'}
• Odontólogo: ${apt.dentistName}
• Consultorio: ${apt.consultorioNombre || 'Consultorio Principal'}
• Tratamiento: ${apt.treatment}
• Teléfono: ${apt.patientPhone}
• Notas: ${apt.notes || 'Sin observaciones'}
--------------------------------
Agendado con OdontoSoft`;

    const location = apt.consultorioNombre || 'Clínica OdontoSoft';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      summary
    )}&dates=${startISO}/${endISO}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
      location
    )}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg tracking-tight">
                Integración con Google Calendar
              </h3>
              <p className="text-xs text-slate-500">
                Sincronización de turnos, recordatorios emergentes y enlaces directos de agenda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {syncFeedback && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Account Connection Status Ribbon */}
        <div className="mt-4 p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                googleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <div>
              <div className="font-bold text-xs text-slate-800">
                {googleConnected
                  ? 'Cuenta de Google Conectada (API Calendar & Gmail Activa)'
                  : 'Sincronización Directa de Calendario Habilitada'}
              </div>
              <p className="text-[11px] text-slate-500">
                {googleConnected
                  ? 'Los turnos se agregan automáticamente al calendario principal de Google.'
                  : 'Puedes abrir cualquier cita directamente en Google Calendar con el enlace pre-configurado.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {googleConnected ? (
              <button
                onClick={handleDisconnectGoogle}
                className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl"
              >
                Desconectar
              </button>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={connecting}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{connecting ? 'Conectando...' : 'Vincular Google'}</span>
              </button>
            )}

            <button
              onClick={handleSyncAll}
              disabled={syncingAll || appointments.length === 0}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${syncingAll ? 'animate-spin' : ''}`} />
              <span>{syncingAll ? 'Sincronizando...' : 'Sincronizar Todas'}</span>
            </button>
          </div>
        </div>

        {/* Appointments Calendar Sync Table */}
        <div className="mt-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">
              Citas Agendadas ({syncedCount} sincronizadas de {appointments.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Haz clic en "Abrir en Google Calendar" para guardar en tu móvil
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-y-auto flex-1 divide-y divide-slate-100">
            {appointments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No hay citas programadas actualmente.
              </div>
            ) : (
              appointments.map((apt) => {
                const calUrl = generateGoogleCalendarUrl(apt);
                return (
                  <div
                    key={apt.id}
                    className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {apt.patientName}
                        </span>
                        <span className="text-[11px] text-slate-500">• {apt.treatment}</span>
                        {apt.googleCalendarSynced ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CalendarCheck className="w-3 h-3 text-emerald-600" />
                            Sincronizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pendiente Sync
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {apt.date} a las {apt.time} ({apt.durationMinutes} min)
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {apt.dentistName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          {apt.consultorioNombre || 'Consultorio Principal'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <a
                        href={calUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors border border-teal-200"
                      >
                        <span>Abrir en Google Calendar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
