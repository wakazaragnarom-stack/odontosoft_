import React, { useEffect, useState } from 'react';
import type { UserRole } from './types';
import { getStoreState, subscribeToStore } from './lib/store';
import { getSessionToken, generateToken } from './lib/tokenService';
import { Header } from './Header';
import { PortalGateway } from './PortalGateway';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { ClinicAdminDashboard } from './ClinicAdminDashboard';
import { DentistDashboard } from './DentistDashboard';
import { PatientPortal } from './PatientPortal';
import { AuthModal } from './AuthModal';
import { ProviderAccessModal } from './ProviderAccessModal';
import { ProveedorDashboard } from './ProveedorDashboard';
import { TokenSecurityModal } from './TokenSecurityModal';
import { EmailCenterModal } from './EmailCenterModal';
import { GoogleCalendarModal } from './GoogleCalendarModal';

export default function App() {
  const [, setTick] = useState(0);

  useEffect(() => subscribeToStore(() => setTick((value) => value + 1)), []);

  const store = getStoreState();
  const [currentRole, setCurrentRole] = useState<UserRole | 'gateway' | 'proveedores'>('gateway');
  const [currentTenantId, setCurrentTenantId] = useState(store.tenants[0]?.id || 'tenant-1');
  const [activeToken, setActiveToken] = useState<string | null>(() => getSessionToken() || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register_dentist'>('login');
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isTokenSecurityOpen, setIsTokenSecurityOpen] = useState(false);
  const [isEmailCenterOpen, setIsEmailCenterOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const handleSelectPortal = (role: UserRole | 'proveedores', tenantId?: string) => {
    const selectedTenantId = tenantId || currentTenantId;
    if (tenantId) setCurrentTenantId(tenantId);
    if (role === 'superadmin') return setIsProviderModalOpen(true);
    if (role === 'proveedores') return setCurrentRole('proveedores');

    const tenant = store.tenants.find((item) => item.id === selectedTenantId);
    const token = generateToken(
      { id: `usr-${role}`, email: `${role}@${tenant?.subdomain || 'odontosoft'}.io`, name: role.toUpperCase(), role, tenantId: selectedTenantId },
      tenant?.status || 'active',
    );
    setActiveToken(token);
    setCurrentRole(role);
  };

  const handleOpenAuthForRole = (role: UserRole, mode: 'login' | 'register') => {
    if (role === 'superadmin') return setIsProviderModalOpen(true);
    setAuthModalTab(mode === 'register' ? 'register_dentist' : 'login');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased">
      <Header
        currentRole={currentRole}
        onRoleChange={(role) => role === 'superadmin' ? setIsProviderModalOpen(true) : setCurrentRole(role)}
        currentTenantId={currentTenantId}
        onTenantChange={setCurrentTenantId}
        activeToken={activeToken}
        onOpenAuthModal={() => { setAuthModalTab('login'); setIsAuthModalOpen(true); }}
        onOpenProviderModal={() => setIsProviderModalOpen(true)}
        onOpenTokenSecurity={() => setIsTokenSecurityOpen(true)}
        onOpenEmailCenter={() => setIsEmailCenterOpen(true)}
        onOpenCalendarHub={() => setIsCalendarModalOpen(true)}
        onOpenProveedores={() => setCurrentRole('proveedores')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentRole === 'gateway' && <PortalGateway onSelectPortal={handleSelectPortal} onOpenAuthForRole={handleOpenAuthForRole} />}
        {currentRole === 'superadmin' && <SuperAdminDashboard />}
        {currentRole === 'proveedores' && <ProveedorDashboard tenantId={currentTenantId} />}
        {currentRole === 'clinic_admin' && <ClinicAdminDashboard tenantId={currentTenantId} />}
        {currentRole === 'dentist' && <DentistDashboard tenantId={currentTenantId} />}
        {currentRole === 'patient' && <PatientPortal tenantId={currentTenantId} />}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-3">
          <span className="font-bold text-slate-900">OdontoSoft SaaS</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentRole('gateway')} className="hover:text-sky-600">Hub</button>
            <button onClick={() => setCurrentRole('proveedores')} className="hover:text-sky-600">Proveedores</button>
            <button onClick={() => setIsTokenSecurityOpen(true)} className="hover:text-amber-600">Tokens</button>
            <button onClick={() => setIsEmailCenterOpen(true)} className="hover:text-indigo-600">Correos</button>
            <button onClick={() => setIsCalendarModalOpen(true)} className="hover:text-emerald-600">Calendar</button>
          </div>
        </div>
      </footer>

      <ProviderAccessModal isOpen={isProviderModalOpen} onClose={() => setIsProviderModalOpen(false)} onSuccess={(token) => { setActiveToken(token); setCurrentRole('superadmin'); }} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={(role, tenantId, token) => { if (tenantId) setCurrentTenantId(tenantId); if (token) setActiveToken(token); setCurrentRole(role); }} initialTab={authModalTab} />
      <TokenSecurityModal isOpen={isTokenSecurityOpen} onClose={() => setIsTokenSecurityOpen(false)} activeToken={activeToken} onTokenUpdated={setActiveToken} currentRole={currentRole} currentTenantId={currentTenantId} />
      <EmailCenterModal isOpen={isEmailCenterOpen} onClose={() => setIsEmailCenterOpen(false)} />
      <GoogleCalendarModal isOpen={isCalendarModalOpen} onClose={() => setIsCalendarModalOpen(false)} tenantId={currentTenantId} />
    </div>
  );
}
