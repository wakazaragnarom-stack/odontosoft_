import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Copy,
  Check,
  RefreshCw,
  AlertOctagon,
  AlertTriangle,
  Server,
  Zap,
  Clock,
  UserCheck,
  X,
  Sparkles,
} from 'lucide-react';
import type { UserRole, TokenPayload } from '../../types';
import {
  generateToken,
  verifyToken,
  saveSessionToken,
  clearSessionToken,
} from '../../lib/tokenService';
import { getStoreState } from '../../lib/store';

interface TokenSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeToken: string | null;
  onTokenUpdated: (newToken: string | null) => void;
  currentRole: UserRole | 'gateway' | 'proveedores';
  currentTenantId?: string;
}

export const TokenSecurityModal: React.FC<TokenSecurityModalProps> = ({
  isOpen,
  onClose,
  activeToken,
  onTokenUpdated,
  currentRole,
  currentTenantId = 'tenant-1',
}) => {
  const store = getStoreState();
  const [copied, setCopied] = useState(false);
  const [verifyingServer, setVerifyingServer] = useState(false);
  const [serverResponse, setServerResponse] = useState<any>(null);
  const [nowTimestamp, setNowTimestamp] = useState(Math.floor(Date.now() / 1000));

  // Update clock every 5 seconds for expiry calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTimestamp(Math.floor(Date.now() / 1000));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const currentTenant = store.tenants.find((t) => t.id === currentTenantId);
  const decoded = verifyToken(activeToken, (tId) => store.tenants.find((t) => t.id === tId)?.status);
  const payload = decoded.payload;

  const remainingSeconds = payload?.expiresAt ? Math.max(0, payload.expiresAt - nowTimestamp) : 0;
  const remainingHours = Math.floor(remainingSeconds / 3600);
  const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);

  const handleCopy = () => {
    if (!activeToken) return;
    navigator.clipboard.writeText(activeToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyWithServer = async () => {
    setVerifyingServer(true);
    setServerResponse(null);
    try {
      const res = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
      });
      const data = await res.json();
      setServerResponse({ status: res.status, data });
    } catch (err: any) {
      setServerResponse({
        status: 500,
        data: { error: 'SERVER_ERROR', message: err.message },
      });
    } finally {
      setVerifyingServer(false);
    }
  };

  const handleGenerateRoleToken = (role: UserRole) => {
    const email = `${role}@${currentTenant?.subdomain || 'odontosoft'}.com`;
    const token = generateToken(
      {
        id: `usr-${role}-${Date.now().toString().slice(-4)}`,
        email,
        name: `${role.toUpperCase()} (OdontoSoft)`,
        role,
        tenantId: role === 'superadmin' ? undefined : currentTenantId,
      },
      currentTenant?.status || 'active',
      24
    );

    saveSessionToken(token);
    onTokenUpdated(token);
    setServerResponse(null);
  };

  const handleGenerateExpiredToken = () => {
    // Generate token with duration -1 hour
    const token = generateToken(
      {
        id: 'usr-expired-test',
        email: 'expirado@odontosoft.com',
        name: 'Usuario Expirado',
        role: 'dentist',
        tenantId: currentTenantId,
      },
      'active',
      -1
    );

    saveSessionToken(token);
    onTokenUpdated(token);
    setServerResponse(null);
  };

  const handleRevoke = () => {
    clearSessionToken();
    onTokenUpdated(null);
    setServerResponse(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg tracking-tight">
                Consola de Seguridad & Tokens JWT
              </h3>
              <p className="text-xs text-slate-500">
                Autenticación Bearer token, validación de caducidad y roles del backend
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

        {/* Token Status Ribbon */}
        <div
          className={`p-4 rounded-2xl border mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            decoded.valid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {decoded.valid ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div>
              <div className="font-bold text-xs">
                {decoded.valid
                  ? 'Token Bearer Válido y Firmado'
                  : `Token Rechazado: ${decoded.error || 'INVALID'}`}
              </div>
              <p className="text-[11px] opacity-85">
                {decoded.valid
                  ? `Expira en ${remainingHours}h ${remainingMinutes}m (Criptográficamente autenticado)`
                  : decoded.message || 'El token suministrado no es válido o ha expirado.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleVerifyWithServer}
              disabled={verifyingServer || !activeToken}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
            >
              <Server className="w-3.5 h-3.5 text-sky-400" />
              <span>{verifyingServer ? 'Verificando...' : 'Verificar en Servidor'}</span>
            </button>
          </div>
        </div>

        {/* Raw Bearer String */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-purple-600" />
              Token Bearer Activo (JWT Format)
            </label>
            <button
              onClick={handleCopy}
              disabled={!activeToken}
              className="text-purple-600 hover:text-purple-800 font-bold text-[11px] flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copiado al portapapeles</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Bearer Token</span>
                </>
              )}
            </button>
          </div>
          <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl break-all select-all border border-slate-800 shadow-inner">
            {activeToken || 'Sin token de sesión configurado'}
          </div>
        </div>

        {/* Decoded Claims Grid */}
        {payload && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-5 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-slate-700">
              <span>Claims Decodificados del Token (Payload)</span>
              <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                alg: HS256 • typ: JWT
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  User ID (sub)
                </span>
                <span className="font-mono text-slate-800 font-semibold">{payload.userId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Rol Clínico
                </span>
                <span className="font-bold text-sky-700 capitalize">{payload.role}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Tenant / Clínica
                </span>
                <span className="font-mono text-slate-800">
                  {payload.tenantId || 'Global / SuperAdmin'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Emitido (iat)
                </span>
                <span className="text-slate-700">
                  {new Date(payload.issuedAt * 1000).toLocaleTimeString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Expira (exp)
                </span>
                <span className="text-slate-700">
                  {new Date(payload.expiresAt * 1000).toLocaleTimeString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Estado Sede
                </span>
                <span
                  className={`font-bold ${
                    payload.tenantStatus === 'suspended' ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {payload.tenantStatus === 'suspended' ? '⛔ Suspendida' : '🟢 Activa'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Server Response Feedback */}
        {serverResponse && (
          <div className="bg-slate-900 text-slate-200 p-3.5 rounded-2xl border border-slate-800 text-xs font-mono mb-5 space-y-1 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
              <span>Respuesta Backend (POST /api/auth/verify-token)</span>
              <span
                className={`font-bold ${
                  serverResponse.status === 200 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                HTTP {serverResponse.status}
              </span>
            </div>
            <pre className="text-[10px] text-emerald-400 overflow-x-auto pt-1">
              {JSON.stringify(serverResponse.data, null, 2)}
            </pre>
          </div>
        )}

        {/* Action Buttons / Token Generation */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            Generar Token Rápido para Pruebas de Roles:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleGenerateRoleToken('superadmin')}
              className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-colors text-center"
            >
              👑 Super Admin
            </button>
            <button
              onClick={() => handleGenerateRoleToken('clinic_admin')}
              className="p-2.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-bold transition-colors text-center"
            >
              🏥 Admin Clínica
            </button>
            <button
              onClick={() => handleGenerateRoleToken('dentist')}
              className="p-2.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold transition-colors text-center"
            >
              🩺 Odontólogo
            </button>
            <button
              onClick={() => handleGenerateRoleToken('patient')}
              className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-colors text-center"
            >
              👤 Paciente
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateExpiredToken}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline"
                title="Generar token con fecha de expiración en el pasado para probar rechazo de seguridad"
              >
                ⚠️ Probar Token Expirado (401)
              </button>
              <span>•</span>
              <button
                onClick={handleRevoke}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Cerrar Sesión / Revocar
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
