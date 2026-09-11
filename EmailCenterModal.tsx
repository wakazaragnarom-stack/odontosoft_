import React, { useState } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  Inbox,
  Sparkles,
  User,
  Calendar,
  Building,
} from 'lucide-react';
import type { EmailLog } from '../../types';
import { getStoreState, logEmailNotification } from '../../lib/store';

interface EmailCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailCenterModal: React.FC<EmailCenterModalProps> = ({ isOpen, onClose }) => {
  const store = getStoreState();
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(
    store.emailLogs[0] || null
  );
  const [filterType, setFilterType] = useState<string>('Todos');

  // Test-Send Form State
  const [showTestSender, setShowTestSender] = useState(false);
  const [testRecipient, setTestRecipient] = useState('paciente.ejemplo@odontosoft.com');
  const [testSubject, setTestSubject] = useState('🔔 Recordatorio de Cita Odontológica - OdontoSoft');
  const [testType, setTestType] = useState<EmailLog['tipo']>('Confirmación de Cita');
  const [testBody, setTestBody] = useState(
    'Estimado paciente, le confirmamos su cita de Profilaxis y Limpieza Dental para el día de mañana a las 10:00 AM en el Consultorio Principal.'
  );
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  if (!isOpen) return null;

  const emailLogs = store.emailLogs;
  const filteredEmails = emailLogs.filter((e) => {
    if (filterType === 'Todos') return true;
    return e.tipo === filterType;
  });

  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendSuccess(false);

    setTimeout(() => {
      const newEmail = logEmailNotification({
        tipo: testType,
        destinatario: testRecipient,
        asunto: testSubject,
        contenido: testBody,
        estado: 'Enviado con éxito',
        mensajeId: `msg_fastmail_${Date.now()}`,
      });

      setSelectedEmail(newEmail);
      setSending(false);
      setSendSuccess(true);
      setShowTestSender(false);
      setTimeout(() => setSendSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg tracking-tight">
                Centro de Notificaciones por Correo Electrónico
              </h3>
              <p className="text-xs text-slate-500">
                Despacho automático de citas, recordatorios 24h a las 08:00 AM y restablecimiento de claves
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTestSender(!showTestSender)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{showTestSender ? 'Ver Bandeja' : 'Enviar Correo de Prueba'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {sendSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>✓ Correo electrónico enviado y registrado en la bandeja de salida.</span>
          </div>
        )}

        {/* Content Body */}
        <div className="mt-4 flex-1 overflow-hidden flex flex-col">
          {showTestSender ? (
            /* Test Send Form */
            <form onSubmit={handleSendTestEmail} className="space-y-4 text-xs overflow-y-auto pr-1">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-sky-900 leading-relaxed">
                <strong>Simulador de Despacho de Correo OdontoSoft:</strong> Permite enviar una
                notificación personalizada en tiempo real simulando el servicio SMTP / FastMail del backend.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tipo de Notificación
                  </label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Confirmación de Cita">Confirmación de Cita</option>
                    <option value="Recordatorio 24h">Recordatorio 24h Previo</option>
                    <option value="Restablecimiento de Contraseña">Restablecimiento de Contraseña</option>
                    <option value="Comprobante de Pago">Comprobante de Pago Odontológico</option>
                    <option value="Aviso Administrativo">Aviso Administrativo de Clínica</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correo Destinatario *
                  </label>
                  <input
                    type="email"
                    required
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asunto del Correo</label>
                <input
                  type="text"
                  required
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cuerpo del Mensaje</label>
                <textarea
                  rows={4}
                  required
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestSender(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'Despachando...' : 'Enviar Ahora'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Inbox & Preview Split View */
            <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden min-h-[380px]">
              {/* Left: Email List */}
              <div className="w-full md:w-5/12 border border-slate-200 rounded-2xl flex flex-col overflow-hidden bg-slate-50">
                {/* Filter pill */}
                <div className="p-2.5 border-b border-slate-200 bg-white flex items-center gap-1 overflow-x-auto text-[11px]">
                  {['Todos', 'Confirmación de Cita', 'Recordatorio 24h', 'Restablecimiento de Contraseña'].map(
                    (f) => (
                      <button
                        key={f}
                        onClick={() => setFilterType(f)}
                        className={`px-2 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                          filterType === f
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {f === 'Restablecimiento de Contraseña' ? 'Reset Clave' : f}
                      </button>
                    )
                  )}
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-200/70">
                  {filteredEmails.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No hay correos en esta categoría.
                    </div>
                  ) : (
                    filteredEmails.map((em) => {
                      const isSelected = selectedEmail?.id === em.id;
                      return (
                        <button
                          key={em.id}
                          onClick={() => setSelectedEmail(em)}
                          className={`w-full text-left p-3 transition-colors flex flex-col gap-1 ${
                            isSelected ? 'bg-sky-50/90 border-l-4 border-sky-600' : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-sky-700 uppercase tracking-wider">
                              {em.tipo}
                            </span>
                            <span className="text-slate-400">{em.fecha_envio}</span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {em.asunto}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            Para: {em.destinatario}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: Email Preview Card */}
              <div className="flex-1 border border-slate-200 rounded-2xl p-5 overflow-y-auto bg-white flex flex-col">
                {selectedEmail ? (
                  <div className="space-y-4 text-xs">
                    {/* Medical Header inside email */}
                    <div className="p-4 bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-xl shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🦷</span>
                          <div>
                            <h4 className="font-black text-sm tracking-tight">ODONTOSOFT</h4>
                            <span className="text-[10px] text-sky-100 uppercase tracking-wider block">
                              Sistema de Gestión Odontológica Integral
                            </span>
                          </div>
                        </div>
                        <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                          {selectedEmail.tipo}
                        </span>
                      </div>
                    </div>

                    {/* Metadata header */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Destinatario:</span>
                        <span className="font-mono text-slate-900 font-bold">
                          {selectedEmail.destinatario}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Fecha y Hora:</span>
                        <span className="text-slate-700">{selectedEmail.fecha_envio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">ID Mensaje:</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {selectedEmail.mensajeId || 'msg_system_auto'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Estado de Entrega:</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {selectedEmail.estado}
                        </span>
                      </div>
                    </div>

                    {/* Email Subject & Content */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                      <div className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                        {selectedEmail.asunto}
                      </div>
                      <div className="text-slate-700 text-xs leading-relaxed whitespace-pre-line font-sans">
                        {selectedEmail.contenido}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100">
                      Este mensaje fue generado automáticamente por el subsistema de correo y APScheduler de OdontoSoft.
                    </div>
                  </div>
                ) : (
                  <div className="m-auto text-center text-slate-400 py-12">
                    <Mail className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Selecciona un correo de la lista para ver la plantilla despachada.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
