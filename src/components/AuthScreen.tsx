import { useState } from 'react';
import { LockKeyhole, Mail, UserPlus, RefreshCcw, LogIn, Eye, EyeOff } from 'lucide-react';
import { getCurrentUser, login, registroUsuario, resetPassword, solicitarReset } from '../api.js';

type Props = {
  onAuthenticated: (user: any) => void;
};

type Mode = 'login' | 'register' | 'reset';

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documento, setDocumento] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submitLogin = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      await login({ correo: email.trim().toLowerCase(), contrasena: password });
      const user = await getCurrentUser();
      onAuthenticated(user);
    } catch (e: any) {
      setError(e?.message || 'No fue posible iniciar sesión.');
    } finally { setBusy(false); }
  };

  const submitRegister = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      await registroUsuario({
        correo: email.trim().toLowerCase(),
        contrasena: password,
        nombre: name.trim() || null,
        apellido: lastName.trim() || null,
        documento: documento.trim() || null,
        telefono: phone.trim() || null,
      });
      setMessage('Cuenta creada. Ahora puedes iniciar sesión.');
      setMode('login');
      setPassword('');
    } catch (e: any) {
      setError(e?.message || 'No fue posible registrar la cuenta.');
    } finally { setBusy(false); }
  };

  const requestReset = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await solicitarReset(email.trim().toLowerCase());
      setMessage(result?.mensaje || 'Revisa tu correo para continuar.');
    } catch (e: any) {
      setError(e?.message || 'No fue posible solicitar el restablecimiento.');
    } finally { setBusy(false); }
  };

  const confirmReset = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await resetPassword({ token: token.trim(), nueva_contrasena: newPassword });
      setMessage(result?.mensaje || 'Contraseña actualizada.');
      setMode('login');
      setPassword('');
      setToken('');
      setNewPassword('');
    } catch (e: any) {
      setError(e?.message || 'El token no es válido o expiró.');
    } finally { setBusy(false); }
  };

  const title = mode === 'login' ? 'Bienvenido a OdontoSoft' : mode === 'register' ? 'Crear cuenta de paciente' : 'Recuperar acceso';
  const subtitle = mode === 'login'
    ? 'Gestiona la clínica desde una sola plataforma conectada a PostgreSQL.'
    : mode === 'register'
      ? 'Tu registro crea la cuenta y el expediente de paciente.'
      : 'Solicita un enlace o completa el restablecimiento con el token recibido.';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="hidden md:flex p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sky-200 text-xs font-bold">OdontoSoft 3.0</div>
            <h1 className="text-4xl font-black mt-5 leading-tight">Tu clínica, tu agenda y tu expediente en un solo lugar.</h1>
            <p className="text-slate-300 mt-4 leading-relaxed">Acceso por rol, agenda, pacientes, historia clínica, tratamientos, facturación y administración.</p>
          </div>
          <div className="text-xs text-slate-400">Persistencia: PostgreSQL · API: FastAPI · Frontend: React + Vite</div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="md:hidden text-2xl font-black text-slate-950 mb-8">OdontoSoft</div>
          <h2 className="text-2xl font-black text-slate-950">{title}</h2>
          <p className="text-sm text-slate-500 mt-2 mb-7">{subtitle}</p>

          {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

          <div className="space-y-3">
            {mode !== 'reset' && (
              <>
                <label className="block text-xs font-bold text-slate-600">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className="w-full border border-slate-200 rounded-xl pl-10 pr-3 py-3 outline-none focus:border-sky-500" placeholder="correo@ejemplo.com" />
                </div>
              </>
            )}

            {mode === 'login' && (
              <>
                <label className="block text-xs font-bold text-slate-600 pt-1">Contraseña</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-3 outline-none focus:border-sky-500" placeholder="Tu contraseña" onKeyDown={(e) => { if (e.key === 'Enter') void submitLogin(); }} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-2.5 text-slate-400">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
              </>
            )}

            {mode === 'register' && (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={name} onChange={(e) => setName(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-3" placeholder="Nombre" />
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-3" placeholder="Apellido" />
                  <input value={documento} onChange={(e) => setDocumento(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-3" placeholder="Documento (opcional)" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-3" placeholder="Teléfono (opcional)" />
                </div>
                <label className="block text-xs font-bold text-slate-600 pt-1">Contraseña</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" className="w-full border border-slate-200 rounded-xl px-3 py-3" placeholder="Mínimo 8 caracteres" />
              </>
            )}

            {mode === 'reset' && (
              <>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full border border-slate-200 rounded-xl px-3 py-3" placeholder="Correo registrado" />
                <button type="button" onClick={() => void requestReset()} disabled={busy || !email} className="w-full border border-slate-200 hover:border-sky-400 rounded-xl py-3 font-bold text-slate-700">Enviar enlace de recuperación</button>
                <div className="border-t pt-4 mt-3 space-y-3">
                  <input value={token} onChange={(e) => setToken(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-3" placeholder="Token recibido" />
                  <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="w-full border border-slate-200 rounded-xl px-3 py-3" placeholder="Nueva contraseña" />
                  <button type="button" onClick={() => void confirmReset()} disabled={busy || !token || !newPassword} className="w-full bg-slate-950 hover:bg-slate-800 text-white rounded-xl py-3 font-bold">Restablecer contraseña</button>
                </div>
              </>
            )}

            {mode === 'login' && <button onClick={() => void submitLogin()} disabled={busy || !email || !password} className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl py-3.5 font-bold"><LogIn className="w-4 h-4" />{busy ? 'Ingresando…' : 'Iniciar sesión'}</button>}
            {mode === 'register' && <button onClick={() => void submitRegister()} disabled={busy || !email || !password || !name || !lastName} className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl py-3.5 font-bold"><UserPlus className="w-4 h-4" />{busy ? 'Creando cuenta…' : 'Crear cuenta'}</button>}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            {mode !== 'login' && <button onClick={() => { setMode('login'); setError(''); }} className="font-bold text-sky-700">Volver a iniciar sesión</button>}
            {mode === 'login' && <button onClick={() => { setMode('register'); setError(''); setMessage(''); }} className="font-bold text-sky-700">Crear cuenta</button>}
            {mode === 'login' && <button onClick={() => { setMode('reset'); setError(''); setMessage(''); }} className="inline-flex items-center gap-1 font-bold text-slate-500"><RefreshCcw className="w-4 h-4" />¿Olvidaste tu contraseña?</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
