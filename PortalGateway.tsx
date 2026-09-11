import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Stethoscope,
  User,
  KeyRound,
  Lock,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
  Sparkles,
  ExternalLink,
  Truck,
  Mail,
  Calendar,
} from 'lucide-react';
import type { UserRole } from '../../types';
import { getStoreState } from '../../lib/store';

interface PortalGatewayProps {
  onSelectPortal: (role: UserRole | 'proveedores', tenantId?: string) => void;
  onOpenAuthForRole: (role: UserRole, mode: 'login' | 'register') => void;
}

export const PortalGateway: React.FC<PortalGatewayProps> = ({
  onSelectPortal,
  onOpenAuthForRole,
}) => {
  const store = getStoreState();
  const [selectedTenantId, setSelectedTenantId] = useState(store.tenants[0]?.id || 'tenant-1');

  return (
    <div className="py-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Central Welcome Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200">
          <span>🦷 OdontoSoft SaaS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
          <span>Arquitectura Integral FastAPI + React</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          OdontoSoft • Entornos y Accesos Separados
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Cada rol dispone de su portal seguro independiente: Proveedor del Software, Proveedores de Insumos,
          Odontólogo, Administrador de Clínica y Paciente, interactuando en tiempo real con tokens JWT,
          notificaciones automáticas por correo y sincronización de Google Calendar.
        </p>
      </div>

      {/* Grid of Independent Portals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Portal del Proveedor SaaS (Super Administrador) */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-xl border border-slate-800 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <KeyRound className="w-32 h-32" />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Acceso Aislado • Proveedor
              </span>
              <span className="text-xs text-purple-400 font-mono">Token Maestro</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>👑 Consola del Proveedor</span>
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Su panel privado como dueño y distribuidor del software. Supervise todos sus clientes
                (clínicas), active o desactive servicios por falta de pago y gestione tokens de licencia.
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span>Clínicas clientes registradas:</span>
                <strong className="text-white font-mono">{store.tenants.length}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Control de servicio:</span>
                <span className="text-emerald-400 font-semibold">Activación / Suspensión</span>
              </div>
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <button
              id="enter-provider-portal-btn"
              onClick={() => onSelectPortal('superadmin')}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all"
            >
              <span>Acceder a la Consola de Proveedor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Portal del Odontólogo */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200 flex flex-col justify-between hover:border-teal-400 hover:shadow-md transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Profesional Odontológico
              </span>
              <span className="text-xs text-teal-600 font-semibold flex items-center gap-1">
                <CalendarCheck className="w-3.5 h-3.5" /> Google Calendar
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>🩺 Portal del Odontólogo</span>
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Área de trabajo para doctores. Sincronización automática de turnos con Google Calendar,
                notificaciones inmediatas por correo, odontograma de 32 piezas y fichas clínicas.
              </p>
            </div>

            <div className="bg-teal-50/50 rounded-xl p-3 border border-teal-100 text-xs space-y-1.5 text-teal-900">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Crea tu cuenta con correo y contraseña.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Vincula tu Google Calendar en 1 clic.</span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-2">
            <button
              id="enter-dentist-portal-btn"
              onClick={() => onSelectPortal('dentist', selectedTenantId)}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>Ingresar al Portal de Odontólogos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="register-dentist-portal-btn"
              onClick={() => onOpenAuthForRole('dentist', 'register')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-teal-800 rounded-xl font-semibold text-xs border border-slate-200 transition-colors"
            >
              Crear Nueva Cuenta de Odontólogo
            </button>
          </div>
        </div>

        {/* 3. Portal de Administración de Clínica */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200 flex flex-col justify-between hover:border-sky-400 hover:shadow-md transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                Sede Clínica
              </span>
              <span className="text-xs text-slate-500 font-medium">Gestión Local</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>🏥 Administración de Clínica</span>
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Panel para directores de clínica. Gestión del equipo odontológico, alta de doctores,
                agenda maestra y estado de suscripción de la sede.
              </p>
            </div>

            {/* Select clinic to manage */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Seleccionar Clínica:
              </label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {store.tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.status === 'suspended' ? '⛔ Suspendida' : '🟢 Activa'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6">
            <button
              id="enter-clinic-portal-btn"
              onClick={() => onSelectPortal('clinic_admin', selectedTenantId)}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>Acceder al Panel de Clínica</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4. Portal del Paciente (Cliente Final) */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200 flex flex-col justify-between hover:border-indigo-400 hover:shadow-md transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Cliente Final • Paciente
              </span>
              <span className="text-xs text-indigo-600 font-semibold">Citas 24/7</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>👤 Portal del Paciente</span>
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Interfaz pública de reserva de turnos para los pacientes de la clínica. Reserva en 3
                pasos, sincronización en vivo con la agenda del doctor y confirmación por correo.
              </p>
            </div>

            <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <p>
                <strong>Clínica activa:</strong>{' '}
                {store.tenants.find((t) => t.id === selectedTenantId)?.name}
              </p>
              <p className="text-[11px] text-indigo-700">
                Los turnos agendados aquí se reflejan de inmediato en Google Calendar del odontólogo.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <button
              id="enter-patient-portal-btn"
              onClick={() => onSelectPortal('patient', selectedTenantId)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>Ingresar como Paciente (Agendar Cita)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Portal y Gestión de Proveedores e Insumos Médicos */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-sky-900/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Nuevo Módulo Backend OdontoSoft
            </span>
            <span className="text-xs text-slate-300 font-mono flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-sky-400" />
              Catálogo & Suministros
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>🚚 Portal de Proveedores e Insumos Odontológicos</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Módulo independiente de abastecimiento dental sincronizado con las clínicas del sistema.
            Controle distribuidores (3M Oral Care, Dentsply Sirona, etc.), gestione compras por volumen,
            actualice precios de materiales e insumos críticos y consulte estados de entrega.
          </p>
        </div>

        <div className="shrink-0 w-full md:w-auto">
          <button
            id="enter-proveedores-portal-btn"
            onClick={() => onSelectPortal('proveedores', selectedTenantId)}
            className="w-full md:w-auto px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold text-xs shadow-lg shadow-sky-900/30 flex items-center justify-center gap-2 transition-all whitespace-nowrap"
          >
            <Truck className="w-4 h-4" />
            <span>Abrir Panel de Proveedores</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
