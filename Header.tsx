import React, { useState } from 'react';
import {
  Calendar,
  ShieldAlert,
  ShieldCheck,
  Bell,
  CheckCircle2,
  Lock,
  KeyRound,
  Sparkles,
  CalendarCheck,
  Mail,
  RefreshCw,
  ExternalLink,
  LogOut,
  ChevronDown,
  LayoutGrid,
  Truck,
} from 'lucide-react';
import type { UserRole } from '../../types';
import { getStoreState } from '../../lib/store';
import { getAccessToken, googleSignIn, firebaseLogout } from '../../lib/firebase';

interface HeaderProps {
  currentRole: UserRole | 'gateway' | 'proveedores';
  onRoleChange: (role: UserRole | 'gateway' | 'proveedores') => void;
  currentTenantId?: string;
  onTenantChange: (tenantId: string) => void;
  activeToken: string | null;
  onOpenAuthModal: () => void;
  onOpenProviderModal: () => void;
  onOpenTokenSecurity?: () => void;
  onOpenEmailCenter?: () => void;
  onOpenCalendarHub?: () => void;
  onOpenProveedores?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentTenantId,
  onTenantChange,
  activeToken,
  onOpenAuthModal,
  onOpenProviderModal,
  onOpenTokenSecurity,
  onOpenEmailCenter,
  onOpenCalendarHub,
  onOpenProveedores,
}) => {
  const store = getStoreState();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const [showPortalMenu, setShowPortalMenu] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  const currentTenant = store.tenants.find((t) => t.id === currentTenantId);
  const isSuspended = currentTenant?.status === 'suspended';

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleConnected(true);
      }
    } catch (err) {
      console.error('Error linking Google:', err);
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleLogoutGoogle = async () => {
    await firebaseLogout();
    setGoogleConnected(false);
  };

  // Check if token in memory exists
  React.useEffect(() => {
    getAccessToken().then((t) => {
      if (t) setGoogleConnected(true);
    });
  }, []);

  const isProvider = currentRole === 'superadmin';
  const isDentist = currentRole === 'dentist';
  const isClinic = currentRole === 'clinic_admin';
  const isPatient = currentRole === 'patient';
  const isGateway = currentRole === 'gateway';

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-b shadow-xs transition-colors ${
        isProvider
          ? 'bg-slate-950/95 border-purple-900/50 text-white'
          : 'bg-white/95 border-slate-200 text-slate-800'
      }`}
    >
      {/* Top Banner if Tenant is Suspended by Super Admin */}
      {isSuspended && !isProvider && !isGateway && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
            <span>
              <strong>SERVICIO SUSPENDIDO POR FALTA DE PAGO:</strong> La clínica{' '}
              <span className="underline font-semibold">{currentTenant?.name}</span> tiene el acceso
              temporalmente bloqueado por el Super Administrador.
            </span>
          </div>
          <span className="bg-rose-800/80 px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-bold">
            Token Inactivo
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onRoleChange('gateway')}
              className="flex items-center gap-3 text-left focus:outline-none group"
              title="Volver al Selector de Portales Independientes"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-md transition-transform group-hover:scale-105 ${
                  isProvider
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-purple-600/30'
                    : isDentist
                    ? 'bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-teal-500/20'
                    : isClinic
                    ? 'bg-gradient-to-tr from-sky-600 to-blue-500 text-white shadow-sky-500/20'
                    : 'bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-indigo-500/20'
                }`}
              >
                {isProvider ? '👑' : isDentist ? '🩺' : isClinic ? '🏥' : '🦷'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-black tracking-tight text-lg ${
                      isProvider ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    OdontoSoft
                    <span className={isProvider ? 'text-purple-400' : 'text-sky-600'}>
                      {isProvider ? '.Provider' : isDentist ? '.Doctor' : isPatient ? '.Citas' : '.Sede'}
                    </span>
                  </span>

                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                      isProvider
                        ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                        : isDentist
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : isClinic
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {isProvider
                      ? 'Consola Proveedor'
                      : isDentist
                      ? 'Portal Odontólogo'
                      : isClinic
                      ? 'Administración'
                      : isPatient
                      ? 'Portal Pacientes'
                      : 'Hub de Portales'}
                  </span>
                </div>

                <p
                  className={`text-xs truncate max-w-xs ${
                    isProvider ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {isProvider
                    ? 'Gestión Centralizada SaaS & Control de Pago'
                    : currentTenant?.name || 'Sistema de Gestión Odontológica'}
                </p>
              </div>
            </button>
          </div>

          {/* Right Actions & Portal Switcher Hub */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Clinic selector (if inside dentist, clinic or patient views) */}
            {!isProvider && !isGateway && (
              <div className="hidden sm:block relative">
                <select
                  value={currentTenantId}
                  onChange={(e) => onTenantChange(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {store.tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.status === 'suspended' ? '⛔ ' : '🟢 '}
                      {t.name} ({t.status === 'suspended' ? 'SUSPENDIDA' : 'Activa'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Google Workspace status indicator for dentists */}
            {isDentist && (
              <button
                id="google-workspace-btn"
                onClick={googleConnected ? handleLogoutGoogle : handleLinkGoogle}
                disabled={isLinkingGoogle}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                  googleConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title={
                  googleConnected
                    ? 'Google Calendar & Gmail Conectados'
                    : 'Conectar Google Calendar & Gmail'
                }
              >
                {googleConnected ? (
                  <>
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Google Conectado</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span className="hidden sm:inline">Vincular Calendar</span>
                  </>
                )}
              </button>
            )}

            {/* Proveedores Quick Access */}
            <button
              id="header-proveedores-btn"
              onClick={() => {
                if (onOpenProveedores) onOpenProveedores();
                else onRoleChange('proveedores');
              }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                currentRole === 'proveedores'
                  ? 'bg-sky-600 text-white border-sky-600'
                  : isProvider
                  ? 'bg-slate-800 text-purple-200 border-purple-800 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Gestión de Proveedores e Insumos"
            >
              <Truck className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden sm:inline">Proveedores</span>
            </button>

            {/* Token Security Modal Trigger */}
            {onOpenTokenSecurity && (
              <button
                id="header-token-security-btn"
                onClick={onOpenTokenSecurity}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                  isProvider
                    ? 'bg-slate-800 text-amber-300 border-amber-500/50 hover:bg-slate-700'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
                title="Gestor y Validador de Tokens de Seguridad JWT"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden md:inline">Seguridad & Tokens</span>
              </button>
            )}

            {/* Email Center Trigger */}
            {onOpenEmailCenter && (
              <button
                id="header-email-center-btn"
                onClick={onOpenEmailCenter}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                  isProvider
                    ? 'bg-slate-800 text-sky-300 border-sky-500/50 hover:bg-slate-700'
                    : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'
                }`}
                title="Centro de Correos Electrónicos"
              >
                <Mail className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden lg:inline">Correos</span>
              </button>
            )}

            {/* Google Calendar Hub Trigger */}
            {onOpenCalendarHub && (
              <button
                id="header-calendar-hub-btn"
                onClick={onOpenCalendarHub}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                  isProvider
                    ? 'bg-slate-800 text-emerald-300 border-emerald-500/50 hover:bg-slate-700'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Sincronización y Configuración de Google Calendar"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden lg:inline">Calendar</span>
              </button>
            )}

            {/* Token Badge Inspector */}
            <div className="relative">
              <button
                id="view-token-btn"
                onClick={() => setShowTokenDetails(!showTokenDetails)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-mono flex items-center gap-1 transition-colors ${
                  isProvider
                    ? 'bg-slate-900 border-purple-800 text-purple-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="Inspeccionar Token JWT de Autorización"
              >
                <KeyRound
                  className={`w-3.5 h-3.5 ${isProvider ? 'text-purple-400' : 'text-amber-600'}`}
                />
                <span className="hidden sm:inline">Token</span>
              </button>

              {/* Token Details Dropdown Popover */}
              {showTokenDetails && (
                <div
                  className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                    isProvider
                      ? 'bg-slate-900 border border-purple-800 text-slate-200'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/20 mb-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        Token de Seguridad Activo
                      </h4>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      HS256 Firmado
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Rol asignado
                      </span>
                      <span className="font-semibold capitalize">
                        {isProvider ? '👑 Proveedor SaaS (Super Admin)' : currentRole}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Clínica Asociada (Tenant)
                      </span>
                      <span className="font-mono text-slate-400">
                        {isProvider ? 'Global (Todas las sedes)' : currentTenantId}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Estado del Servicio
                      </span>
                      <span
                        className={`font-semibold inline-flex items-center gap-1 ${
                          isSuspended && !isProvider ? 'text-rose-500' : 'text-emerald-400'
                        }`}
                      >
                        {isSuspended && !isProvider
                          ? '⛔ Suspendido por Falta de Pago'
                          : '🟢 Activo y Al Día'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Bearer Token String
                      </span>
                      <div className="p-2 bg-slate-950 text-emerald-400 rounded-md font-mono text-[10px] break-all max-h-24 overflow-y-auto select-all border border-slate-800">
                        {activeToken || 'denti_eyJhbGciOiJIUzI1NiJ9.demo_token.active'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/20 flex justify-between items-center text-[11px] text-slate-400">
                    <span>Middleware de Verificación Activo</span>
                    <button
                      onClick={() => setShowTokenDetails(false)}
                      className="text-purple-400 hover:text-purple-300 font-semibold"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                id="notifications-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg relative transition-colors ${
                  isProvider
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Notificaciones automáticas en tiempo real"
              >
                <Bell className="w-4 h-4" />
                {store.notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-500 rounded-full ring-2 ring-slate-900"></span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div
                  className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                    isProvider
                      ? 'bg-slate-900 border border-purple-800 text-slate-200'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/20 mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-sky-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        Notificaciones en Tiempo Real
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {store.notifications.length} eventos
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 text-xs">
                    {store.notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-lg border ${
                          isProvider
                            ? 'bg-slate-800/80 border-slate-700'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {notif.type === 'calendar' ? (
                            <CalendarCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : notif.type === 'email' ? (
                            <Mail className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-xs">{notif.title}</p>
                            <p className="text-[11px] leading-relaxed mt-0.5 text-slate-300">
                              {notif.description}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {notif.timestamp} • {notif.dentistEmail}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Portal Switcher Dropdown (Allows evaluating separate portals seamlessly) */}
            <div className="relative">
              <button
                id="portal-switcher-btn"
                onClick={() => setShowPortalMenu(!showPortalMenu)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-all ${
                  isProvider
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Portales Separados</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showPortalMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 text-xs text-slate-800 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                    Accesos Independientes
                  </div>

                  <div className="py-1 space-y-0.5">
                    {/* Provider */}
                    <button
                      onClick={() => {
                        setShowPortalMenu(false);
                        onOpenProviderModal();
                      }}
                      className={`w-full p-2 rounded-lg text-left font-semibold flex items-center gap-2 transition-colors ${
                        isProvider
                          ? 'bg-purple-50 text-purple-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="p-1 rounded bg-purple-100 text-purple-700">👑</span>
                      <div>
                        <div className="leading-tight">Consola Proveedor SaaS</div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Acceso con Token Maestro
                        </span>
                      </div>
                    </button>

                    {/* Dentist */}
                    <button
                      onClick={() => {
                        setShowPortalMenu(false);
                        onRoleChange('dentist');
                      }}
                      className={`w-full p-2 rounded-lg text-left font-semibold flex items-center gap-2 transition-colors ${
                        isDentist ? 'bg-teal-50 text-teal-900' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="p-1 rounded bg-teal-100 text-teal-700">🩺</span>
                      <div>
                        <div className="leading-tight">Portal Odontólogo</div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Google Calendar & Odontograma
                        </span>
                      </div>
                    </button>

                    {/* Clinic Admin */}
                    <button
                      onClick={() => {
                        setShowPortalMenu(false);
                        onRoleChange('clinic_admin');
                      }}
                      className={`w-full p-2 rounded-lg text-left font-semibold flex items-center gap-2 transition-colors ${
                        isClinic ? 'bg-sky-50 text-sky-900' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="p-1 rounded bg-sky-100 text-sky-700">🏥</span>
                      <div>
                        <div className="leading-tight">Administración Clínica</div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Gestión local de sede
                        </span>
                      </div>
                    </button>

                    {/* Patient */}
                    <button
                      onClick={() => {
                        setShowPortalMenu(false);
                        onRoleChange('patient');
                      }}
                      className={`w-full p-2 rounded-lg text-left font-semibold flex items-center gap-2 transition-colors ${
                        isPatient
                          ? 'bg-indigo-50 text-indigo-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="p-1 rounded bg-indigo-100 text-indigo-700">👤</span>
                      <div>
                        <div className="leading-tight">Portal Pacientes</div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Agendamiento 24/7
                        </span>
                      </div>
                    </button>

                    {/* Proveedores */}
                    <button
                      onClick={() => {
                        setShowPortalMenu(false);
                        if (onOpenProveedores) onOpenProveedores();
                        else onRoleChange('proveedores');
                      }}
                      className={`w-full p-2 rounded-lg text-left font-semibold flex items-center gap-2 transition-colors ${
                        currentRole === 'proveedores'
                          ? 'bg-sky-50 text-sky-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="p-1 rounded bg-sky-100 text-sky-700">🚚</span>
                      <div>
                        <div className="leading-tight">Panel de Proveedores</div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Catálogo de insumos y pedidos
                        </span>
                      </div>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 mt-1">
                    <button
                      onClick={() => {
                        setShowPortalMenu(false);
                        onRoleChange('gateway');
                      }}
                      className="w-full text-center py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md"
                    >
                      🏠 Ver Hub de Portales
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Exit Portal Button */}
            {!isGateway && (
              <button
                onClick={() => onRoleChange('gateway')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  isProvider
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Cerrar este portal y volver al selector"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
