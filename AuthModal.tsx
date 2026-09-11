import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Lock, Mail } from 'lucide-react';
import type { UserRole } from './types';
import { getAccessToken, login, solicitarReset } from './api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: UserRole, tenantId?: string, token?: string) => void;
  initialTab?: 'login' | 'register_dentist';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTab(initialTab === 'register_dentist' ? 'login' : 'login');
    setErrorMsg(null);
    setSuccessMsg(null);
    if (getAccessToken()) setSuccessMsg('Existe una sesión guardada en este navegador.');
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const result = await login({ correo: email.trim().toLowerCase(), contrasena: password });
      const role = result?.rol as UserRole;
      const token = result?.access_token as string | undefined;
      if (!token || !role) throw new Error('Respuesta de autenticación incompleta');

      setSuccessMsg(`Sesión iniciada correctamente como ${role}.`);
      onSuccess(role, undefined, token);
      onClose();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'No fue posible iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const result = await solicitarReset(resetEmail.trim().toLowerCase());
      setSuccessMsg(
        result?.mensaje ||
          'Si el correo está registrado, recibirás las instrucciones de recuperación.'
      );
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'No fue posible solicitar la recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Acceso seguro a OdontoSoft</h3>
              <p className="text-[11px] text-slate-400">FastAPI + JWT + PostgreSQL</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-base" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl my-4 font-semibold text-[11px]">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 rounded-lg transition-all ${tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => { setTab('forgot_password'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 rounded-lg transition-all ${tab === 'forgot_password' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-500'}`}
          >
            Recuperar contraseña
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Correo electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              {loading ? 'Validando…' : 'Iniciar sesión'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
              Solicita la recuperación desde el backend. El sistema responde de forma genérica para no revelar si un correo existe.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo registrado</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              {loading ? 'Enviando…' : 'Solicitar recuperación'}
            </button>

            <button
              type="button"
              onClick={() => setTab('login')}
              className="w-full text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              ← Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
