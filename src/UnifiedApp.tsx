import { useEffect, useState } from 'react';
import { getAccessToken, getCurrentUser, clearAccessToken } from './api.js';
import AuthScreen from './components/AuthScreen';
import BackOffice from './components/BackOffice';
import type { User } from './types';

type SessionUser = User & { id_paciente?: number; id_odontologo?: number; nombre?: string };

export default function UnifiedApp() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    getCurrentUser()
      .then((result: any) => {
        if (mounted) setUser(mapSessionUser(result));
      })
      .catch(() => {
        clearAccessToken();
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><div className="text-sm font-bold">Comprobando sesión…</div></div>;
  }

  if (!user) {
    return <AuthScreen onAuthenticated={(result: any) => setUser(mapSessionUser(result))} />;
  }

  return <BackOffice user={user} onLogout={() => { clearAccessToken(); setUser(null); }} />;
}

function mapSessionUser(result: any): SessionUser {
  const role = normalizeRole(result?.rol || result?.role);
  return {
    id: String(result?.id_usuario ?? result?.id ?? ''),
    email: String(result?.correo ?? result?.email ?? ''),
    name: String(result?.nombre ?? result?.name ?? ''),
    nombre: String(result?.nombre ?? result?.name ?? ''),
    role,
    tenantId: undefined,
    createdAt: String(result?.fecha_registro ?? new Date().toISOString()),
    documento: result?.documento ? String(result.documento) : undefined,
    phone: result?.telefono ? String(result.telefono) : undefined,
    id_paciente: result?.id_paciente != null ? Number(result.id_paciente) : undefined,
    id_odontologo: result?.id_odontologo != null ? Number(result.id_odontologo) : undefined,
  };
}

function normalizeRole(value: string): User['role'] {
  const role = String(value || '').toLowerCase();
  if (role === 'patient' || role === 'paciente') return 'patient';
  if (role === 'dentist' || role === 'odontologo' || role === 'odontólogo') return 'dentist';
  if (role === 'superadmin' || role === 'super_admin') return 'superadmin';
  return 'clinic_admin';
}
