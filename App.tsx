import React, { useState, useEffect } from 'react';
import type { UserRole } from './types';
import { getStoreState, subscribeToStore } from './lib/store';
import { getSessionToken, generateToken } from './lib/tokenService';
import { Header } from './components/common/Header';
import { PortalGateway } from './components/portal/PortalGateway';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { ClinicAdminDashboard } from './components/clinic/ClinicAdminDashboard';
import { DentistDashboard } from './components/dentist/DentistDashboard';
import { PatientPortal } from './components/patient/PatientPortal';
import { AuthModal } from './components/auth/AuthModal';
import { ProviderAccessModal } from './components/superadmin/ProviderAccessModal';
import { ProveedorDashboard } from './components/proveedor/ProveedorDashboard';
import { TokenSecurityModal } from './components/security/TokenSecurityModal';
import { EmailCenterModal } from './components/email/EmailCenterModal';
import { GoogleCalendarModal } from './components/calendar/GoogleCalendarModal';

export default function App() {
  const [, setTick] = useState(0);

  // Subscribe to live reactive store changes
  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      setTick((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  const store = getStoreState();

  // Active Portal View
  const [currentRole, setCurrentRole] = useState<UserRole | 'gateway' | 'proveedores'>('gateway');
  const [currentTenantId, setCurrentTenantId] = useState<string>(
    store.tenants[0]?.id || 'tenant-1'
  );

  // Active Session Token
  const [activeToken, setActiveToken] = useState<string | null>(() => {
    return getSessionToken() || null;
  });

  // Modals for Isolated Access & Features
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register_dentist'>('login');
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isTokenSecurityOpen, setIsTokenSecurityOpen] = useState(false);
  const [isEmailCenterOpen, setIsEmailCenterOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const handleSelectPortal = (role: UserRole | 'proveedores', tenantId?: string) => {
    if (tenantId) setCurrentTenantId(tenantId);

    if (role === 'superadmin') {
      // Prompt for Provider credentials / Master Token
      setIsProviderModalOpen(true);
      return;
    }

    if (role === 'proveedores') {
      setCurrentRole('proveedores');
      return;
    }

    const tenant = store.tenants.find((t) => t.id === (tenantId || currentTenantId));
    const token = generateToken(
      {
        id: `usr-${role}`,
        email: `${role}@${tenant?.subdomain || 'denticloud'}.io`,
        name: role.toUpperCase(),
        role,
        tenantId: tenantId || currentTenantId,
      },
      tenant?.status || 'active'
    );

    setActiveToken(token);
    setCurrentRole(role);
  };

  const handleOpenAuthForRole = (role: UserRole, mode: 'login' | 'register') => {
    if (role === 'superadmin') {
      setIsProviderModalOpen(true);
      return;
    }

    setAuthModalTab(mode === 'register' ? 'register_dentist' : 'login');
    setIsAuthModalOpen(true);
  };

  const handleProviderLoginSuccess = (token: string) => {
    setActiveToken(token);
    setCurrentRole('superadmin');
  };

  const handleAuthSuccess = (role: UserRole, tenantId?: string, token?: string) => {
    if (tenantId) setCurrentTenantId(tenantId);
    if (token) setActiveToken(token);
    setCurrentRole(role);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Dynamic Header adapted to the active isolated portal */}
      <Header
        currentRole={currentRole}
        onRoleChange={(newRole) => {
          if (newRole === 'superadmin') {
            setIsProviderModalOpen(true);
          } else {
            setCurrentRole(newRole);
          }
        }}
        currentTenantId={currentTenantId}
        onTenantChange={(tenantId) => { 
          setCurrentTenantId(tenantId);
        }}
        activeToken={activeToken}
        onOpenAuthModal={() => {
          setAuthModalTab('login');
          setIsAuthModalOpen(true);
        }}
        onOpenProviderModal={() => setIsProviderModalOpen(true)}
        onOpenTokenSecurity={() => setIsTokenSecurityOpen(true)}
        onOpenEmailCenter={() => setIsEmailCenterOpen(true)}
        onOpenCalendarHub={() => setIsCalendarModalOpen(true)}
        onOpenProveedores={() => setCurrentRole('proveedores')}
      />

      {/* Main Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentRole === 'gateway' && (
          <PortalGateway
            onSelectPortal={handleSelectPortal}
            onOpenAuthForRole={handleOpenAuthForRole}
          />
        )}

        {currentRole === 'superadmin' && <SuperAdminDashboard />}

        {currentRole === 'proveedores' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentRole('gateway')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors"
                >
                  ← Volver al Hub
                </button>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Módulo de Proveedores e Insumos Médicos OdontoSoft
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Gestión de abastecimiento, catálogo y pedidos a distribuidores
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTokenSecurityOpen(true)}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  🔑 Tokens & Seguridad
                </button>
              </div>
            </div>
            <ProveedorDashboard tenantId={currentTenantId} />
          </div>
        )}

        {currentRole === 'clinic_admin' && (
          <ClinicAdminDashboard tenantId={currentTenantId} />
        )}

        {currentRole === 'dentist' && <DentistDashboard tenantId={currentTenantId} />}

        {currentRole === 'patient' && <PatientPortal tenantId={currentTenantId} />}
      </main>

      {/* Footer with Portal Hub Navigation */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">OdontoSoft SaaS</span>
            <span>•</span>
            <span>Entornos Separados por Tokens JWT</span>
            <span>•</span>
            <button
              onClick={() => setCurrentRole('gateway')}
              className="text-sky-600 hover:text-sky-700 font-semibold underline"
            >
              Hub de Portales
            </button>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <button
              onClick={() => setCurrentRole('proveedores')}
              className="text-sky-600 hover:text-sky-700 font-semibold"
            >
              🚚 Proveedores
            </button>
            <span>•</span>
            <button
              onClick={() => setIsTokenSecurityOpen(true)}
              className="text-amber-600 hover:text-amber-700 font-semibold"
            >
              🔑 Tokens
            </button>
            <span>•</span>
            <button
              onClick={() => setIsEmailCenterOpen(true)}
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              ✉️ Correos
            </button>
            <span>•</span>
            <button
              onClick={() => setIsCalendarModalOpen(true)}
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              📅 Calendar
            </button>
            <span>•</span>
            <button
              onClick={() => setIsProviderModalOpen(true)}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              👑 Consola Proveedor
            </button>
          </div>
        </div>
      </footer>

      {/* Provider Dedicated Master Access Modal */}
      <ProviderAccessModal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        onSuccess={handleProviderLoginSuccess}
      />

      {/* Clinic & Dentist Authentication / Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialTab={authModalTab}
      />

      {/* Token Security Modal */}
      <TokenSecurityModal
        isOpen={isTokenSecurityOpen}
        onClose={() => setIsTokenSecurityOpen(false)}
        activeToken={activeToken}
        onTokenUpdated={(newToken) => setActiveToken(newToken)}
        currentRole={currentRole}
        currentTenantId={currentTenantId}
      />

      {/* Email Center Modal */}
      <EmailCenterModal
        isOpen={isEmailCenterOpen}
        onClose={() => setIsEmailCenterOpen(false)}
      />

      {/* Google Calendar Hub Modal */}
      <GoogleCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        tenantId={currentTenantId}
      />
    </div>
  );
}
