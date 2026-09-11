import React, { useState } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  ShieldAlert,
  Power,
  Plus,
  Search,
  DollarSign,
  Calendar,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Sliders,
  TrendingUp,
  FileText,
  Clock,
  Check,
} from 'lucide-react';
import type { Tenant, TenantStatus } from '../../types';
import {
  getStoreState,
  toggleTenantStatus,
  createTenant,
  getSaaSMetrics,
} from '../../lib/store';

export const SuperAdminDashboard: React.FC = () => {
  const store = getStoreState();
  const metrics = getSaaSMetrics();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedTenantToToggle, setSelectedTenantToToggle] = useState<Tenant | null>(null);

  // New Tenant Form State
  const [newTenant, setNewTenant] = useState({
    name: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    phone: '',
    plan: 'Pro' as Tenant['plan'],
    monthlyFee: 149,
    nextDueDate: '2026-10-01',
    lastPaymentDate: '2026-09-01',
    dentistLimit: 8,
    status: 'active' as TenantStatus,
    address: '',
  });

  const filteredTenants = store.tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : tenant.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleConfirmToggle = () => {
    if (!selectedTenantToToggle) return;
    toggleTenantStatus(selectedTenantToToggle.id);
    setSelectedTenantToToggle(null);
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.adminEmail) return;

    createTenant({
      name: newTenant.name,
      subdomain: newTenant.subdomain || newTenant.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      adminName: newTenant.adminName,
      adminEmail: newTenant.adminEmail,
      phone: newTenant.phone,
      plan: newTenant.plan,
      monthlyFee: Number(newTenant.monthlyFee),
      lastPaymentDate: newTenant.lastPaymentDate,
      nextDueDate: newTenant.nextDueDate,
      dentistLimit: Number(newTenant.dentistLimit),
      status: 'active',
      address: newTenant.address,
    });

    setShowCreateModal(false);
    setNewTenant({
      name: '',
      subdomain: '',
      adminName: '',
      adminEmail: '',
      phone: '',
      plan: 'Pro',
      monthlyFee: 149,
      nextDueDate: '2026-10-01',
      lastPaymentDate: '2026-09-01',
      dentistLimit: 8,
      status: 'active',
      address: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / SaaS Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-3 border border-purple-500/30">
            <span>👑 Consola Central de Distribución SaaS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span>Control de Licencias por Token</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Panel de Super Administrador
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
            Gestión centralizada y automatizada de sus clínicas cliente. Controle el estado de las
            suscripciones, active o desactive el acceso de inmediato ante falta de pago y supervise
            las credenciales basadas en tokens de seguridad.
          </p>
        </div>
      </div>

      {/* SaaS Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clinics */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total de Clientes
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.totalTenants}</span>
            <span className="text-xs font-semibold text-slate-500">clínicas suscritas</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {metrics.activeTenants} con servicio activo y al día
          </p>
        </div>

        {/* Suspended for non-payment */}
        <div className="bg-white rounded-xl p-5 border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Servicio Desactivado
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">
              {metrics.suspendedTenants}
            </span>
            <span className="text-xs font-semibold text-rose-600/80">en mora o impago</span>
          </div>
          <p className="text-xs text-rose-700 mt-2 font-medium">
            Acceso a turnos bloqueado automáticamente
          </p>
        </div>

        {/* Monthly Recurring Revenue */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ingresos Mensuales (MRR)
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black text-emerald-600">
              ${metrics.monthlyRecurringRevenue}
            </span>
            <span className="text-xs font-semibold text-slate-500">USD / mes</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Calculado sobre cuentas activas</p>
        </div>

        {/* Dentists and Appointments */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Red Odontológica
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.totalDentists}</span>
            <span className="text-xs font-semibold text-slate-500">odontólogos en red</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {metrics.totalAppointments} citas agendadas y sincronizadas
          </p>
        </div>
      </div>

      {/* Main Control Panel for Client Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Listado Central de Clínicas Cliente (Tenants)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active o desactive el servicio a cada cliente en caso de no cumplir con el pago acordado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar clínica, doctor o email..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">🟢 Solo Activos</option>
              <option value="suspended">⛔ Solo Suspendidos</option>
            </select>

            {/* Add New Clinic Button */}
            <button
              id="add-clinic-btn"
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-semibold px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Clínica</span>
            </button>
          </div>
        </div>

        {/* Clinics Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Clínica / Subdominio</th>
                <th className="px-4 py-3">Administrador & Contacto</th>
                <th className="px-4 py-3">Plan & Cuota</th>
                <th className="px-4 py-3">Vencimiento de Pago</th>
                <th className="px-4 py-3">Token de Licencia</th>
                <th className="px-4 py-3">Estado del Servicio</th>
                <th className="px-4 py-3 text-right">Control de Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron clínicas que coincidan con los criterios.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const isSuspended = tenant.status === 'suspended';
                  const associatedDentists = store.dentists.filter((d) => d.tenantId === tenant.id);
                  const isLatePayment = isSuspended || new Date(tenant.nextDueDate) < new Date();

                  return (
                    <tr
                      key={tenant.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSuspended ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Clinic name */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 text-sm">{tenant.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <span>{tenant.subdomain}.denticloud.io</span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 inline-block">
                          {associatedDentists.length} odontólogos registrados
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{tenant.adminName}</div>
                        <div className="text-slate-500 text-[11px]">{tenant.adminEmail}</div>
                        <div className="text-slate-400 text-[11px]">{tenant.phone}</div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Plan {tenant.plan}
                        </span>
                        <div className="font-bold text-slate-800 text-xs mt-1">
                          ${tenant.monthlyFee} USD/mes
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tenant.nextDueDate}</span>
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {isSuspended ? (
                            <span className="text-rose-600 font-bold">⚠️ Mora en pago</span>
                          ) : (
                            <span className="text-emerald-600 font-medium">Último: {tenant.lastPaymentDate}</span>
                          )}
                        </div>
                      </td>

                      {/* License Token */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <code className="bg-slate-100 px-2 py-1 rounded text-[10px] font-mono text-slate-700 select-all border border-slate-200">
                            {tenant.licenseToken}
                          </code>
                          <button
                            onClick={() => handleCopyToken(tenant.licenseToken)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
                            title="Copiar token"
                          >
                            {copiedToken === tenant.licenseToken ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            SUSPENDIDO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            ACTIVO
                          </span>
                        )}
                      </td>

                      {/* Toggle Action Switch */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          id={`toggle-status-btn-${tenant.id}`}
                          onClick={() => setSelectedTenantToToggle(tenant)}
                          className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all inline-flex items-center gap-1.5 ${
                            isSuspended
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{isSuspended ? 'Reactivar Servicio' : 'Desactivar (Impago)'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Token & SaaS Architecture Explanation Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Mecanismo Centralizado de Seguridad por Tokens (Bearer JWT)
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Cada odontólogo, administrador y paciente interactúa mediante tokens de sesión
              criptográficos. Cuando usted desactiva el servicio de una clínica por falta de pago, el
              middleware interceptor invalida instantáneamente todas las peticiones con el código{' '}
              <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono">
                TENANT_SUSPENDED
              </code>
              , impidiendo la creación o sincronización de nuevos turnos hasta que se registre el pago
              acordado.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Activating / Deactivating Service */}
      {selectedTenantToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl ${
                  selectedTenantToToggle.status === 'active'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {selectedTenantToToggle.status === 'active'
                    ? '¿Desactivar Servicio por Falta de Pago?'
                    : '¿Reactivar Servicio de la Clínica?'}
                </h3>
                <p className="text-xs text-slate-500">
                  Clínica: <strong>{selectedTenantToToggle.name}</strong>
                </p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
              {selectedTenantToToggle.status === 'active' ? (
                <>
                  <p>
                    Al desactivar el servicio de <strong>{selectedTenantToToggle.name}</strong>:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li>Los odontólogos de esta clínica verán un banner de servicio suspendido.</li>
                    <li>
                      Se bloqueará el agendamiento de nuevas citas tanto para pacientes como para la
                      administración.
                    </li>
                    <li>
                      Las llamadas a las APIs mediante su token devolverán error de suspensión por
                      falta de pago.
                    </li>
                  </ul>
                </>
              ) : (
                <p>
                  Al reactivar el servicio, los odontólogos y pacientes recuperarán acceso inmediato
                  a la agenda, al odontograma y a la sincronización automática con Google Calendar.
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedTenantToToggle(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                id="confirm-toggle-btn"
                onClick={handleConfirmToggle}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors ${
                  selectedTenantToToggle.status === 'active'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {selectedTenantToToggle.status === 'active'
                  ? 'Confirmar Desactivación'
                  : 'Confirmar Reactivación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register New Client Clinic */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900">Registrar Nueva Clínica Cliente</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de la Clínica *</label>
                <input
                  type="text"
                  required
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  placeholder="Ej: Clínica Dental Platinum"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subdominio SaaS</label>
                  <input
                    type="text"
                    value={newTenant.subdomain}
                    onChange={(e) => setNewTenant({ ...newTenant, subdomain: e.target.value })}
                    placeholder="ej: platinum"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plan de Suscripción</label>
                  <select
                    value={newTenant.plan}
                    onChange={(e) =>
                      setNewTenant({
                        ...newTenant,
                        plan: e.target.value as any,
                        monthlyFee: e.target.value === 'Starter' ? 79 : e.target.value === 'Pro' ? 149 : 299,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Starter">Starter ($79/mes - hasta 3 odontólogos)</option>
                    <option value="Pro">Pro ($149/mes - hasta 8 odontólogos)</option>
                    <option value="Enterprise">Enterprise ($299/mes - ilimitados)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre Administrador *</label>
                  <input
                    type="text"
                    required
                    value={newTenant.adminName}
                    onChange={(e) => setNewTenant({ ...newTenant, adminName: e.target.value })}
                    placeholder="Dr. Juan Pérez"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Administrador *</label>
                  <input
                    type="email"
                    required
                    value={newTenant.adminEmail}
                    onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                    placeholder="admin@clinicaplatinum.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cuota Acordada (USD)</label>
                  <input
                    type="number"
                    value={newTenant.monthlyFee}
                    onChange={(e) => setNewTenant({ ...newTenant, monthlyFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dirección Física</label>
                <input
                  type="text"
                  value={newTenant.address}
                  onChange={(e) => setNewTenant({ ...newTenant, address: e.target.value })}
                  placeholder="Calle Principal 123, Ciudad"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-purple-800 text-[11px]">
                ℹ️ Al guardar, se generará un Token de Licencia único y se habilitará el acceso
                inmediato para la administración de la clínica y sus odontólogos.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Guardar y Activar Clínica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
