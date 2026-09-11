import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sliders,
  X,
  ShieldAlert,
} from 'lucide-react';
import { generateToken, saveSessionToken } from '../../lib/tokenService';

interface ProviderAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export const ProviderAccessModal: React.FC<ProviderAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [providerEmail, setProviderEmail] = useState('superadmin@odontosoft.io');
  const [masterPassword, setMasterPassword] = useState('supermaster2026');
  const [masterTokenInput, setMasterTokenInput] = useState('');
  const [authMode, setAuthMode] = useState<'credentials' | 'token'>('credentials');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleProviderLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (authMode === 'credentials') {
        if (!providerEmail || !masterPassword) {
          throw new Error('Ingrese sus credenciales de distribuidor/proveedor.');
        }

        // Generate Master Provider Token
        const token = generateToken(
          {
            id: 'super-admin-root',
            email: providerEmail,
            name: 'Proveedor SaaS (Super Administrador)',
            role: 'superadmin',
          },
          'active'
        );

        saveSessionToken(token);
        onSuccess(token);
        onClose();
      } else {
        if (!masterTokenInput.trim()) {
          throw new Error('Ingrese un Token Maestro válido.');
        }

        saveSessionToken(masterTokenInput);
        onSuccess(masterTokenInput);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de validación del Proveedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-500/30 animate-in fade-in zoom-in-95 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Acceso Exclusivo de Proveedor SaaS</h3>
              <p className="text-[11px] text-purple-300/80">Consola Central de Distribución</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl text-purple-200 text-[11px] leading-relaxed flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <span>
            Acceso administrativo reservado para el distribuidor central de OdontoSoft SaaS.
            Permite supervisar licencias y administrar el estado de servicio de las clínicas afiliadas.
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/50 text-rose-300 border border-rose-800 rounded-xl mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Toggle auth mode */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-800 rounded-lg mb-4 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setAuthMode('credentials')}
            className={`py-1.5 rounded-md transition-colors ${
              authMode === 'credentials' ? 'bg-purple-600 text-white' : 'text-slate-400'
            }`}
          >
            Credenciales de Proveedor
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('token')}
            className={`py-1.5 rounded-md transition-colors ${
              authMode === 'token' ? 'bg-purple-600 text-white' : 'text-slate-400'
            }`}
          >
            Token Maestro Bearer
          </button>
        </div>

        <form onSubmit={handleProviderLogin} className="space-y-3.5">
          {authMode === 'credentials' ? (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Email de Proveedor / Super Administrador
                </label>
                <input
                  type="email"
                  required
                  value={providerEmail}
                  onChange={(e) => setProviderEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Clave Maestra de Acceso
                </label>
                <input
                  type="password"
                  required
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Token Criptográfico Maestro
              </label>
              <textarea
                rows={3}
                value={masterTokenInput}
                onChange={(e) => setMasterTokenInput(e.target.value)}
                placeholder="denti_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-[10px]"
              />
            </div>
          )}

          <div className="pt-2">
            <button
              id="confirm-provider-login-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 transition-all"
            >
              <span>{loading ? 'Verificando...' : 'Desbloquear Consola de Proveedor'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
