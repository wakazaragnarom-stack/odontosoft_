import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Stethoscope,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  User,
  Building2,
  ChevronRight,
  Smile,
} from 'lucide-react';
import { getStoreState } from '../../lib/store';
import type { UserRole } from '../../types';

interface LandingPageProps {
  onBookAppointment: () => void;
  onLogin: () => void;
  onAccessPortals: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onBookAppointment,
  onLogin,
  onAccessPortals,
}) => {
  const store = getStoreState();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');

  const specialties = [
    {
      id: 'prevencion',
      title: 'Odontología Integral & Prevención',
      description:
        'Diagnósticos clínicos de alta precisión con cámara intraoral, profilaxis profunda y control periodontal continuo.',
      icon: Stethoscope,
    },
    {
      id: 'ortodoncia',
      title: 'Ortodoncia Digital & Correctiva',
      description:
        'Alineadores transparentes y aparatología moderna para corregir maloclusiones y diseñar sonrisas armónicas.',
      icon: Smile,
    },
    {
      id: 'implantologia',
      title: 'Implantología & Cirugía Oral',
      description:
        'Rehabilitación protésica fija sobre implantes de titanio biocompatible para recuperar la función masticatoria.',
      icon: Award,
    },
    {
      id: 'estetica',
      title: 'Estética Dental & Blanqueamiento',
      description:
        'Carillas de porcelana, diseño estético y blanqueamiento dental avanzado con tecnología fría de mínima sensibilidad.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Notice Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Centro Odontológico Especializado San Rafael • Atención clínica con respaldo OdontoSoft</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-sky-400" /> +1 (555) 234-5678
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" /> Lun - Sáb: 08:00 a 20:00 hs
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                Centro Odontológico San Rafael
              </span>
              <span className="text-[11px] text-sky-700 font-medium tracking-wide">
                Clínica Médica impulsada por OdontoSoft
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#proposito" className="hover:text-sky-700 transition-colors">
              Quiénes Somos
            </a>
            <a href="#especialidades" className="hover:text-sky-700 transition-colors">
              Especialidades
            </a>
            <a href="#equipo" className="hover:text-sky-700 transition-colors">
              Especialistas
            </a>
            <a href="#sedes" className="hover:text-sky-700 transition-colors">
              Sedes
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onLogin}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={onBookAppointment}
              className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Agendar Cita</span>
            </button>
            <button
              onClick={onAccessPortals}
              className="hidden lg:flex px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors items-center gap-1"
              title="Acceso administrativo y clínico"
            >
              <span>Portales</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50 py-16 sm:py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold border border-sky-200">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Salud y Estética Dental Certificada</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Cuidamos de tu sonrisa con tecnología médica y trato humano
              </h1>

              <p className="text-slate-600 text-base leading-relaxed max-w-2xl">
                El Centro Odontológico San Rafael presta servicios integrales de salud bucal para niños, jóvenes y adultos.
                Mediante la plataforma OdontoSoft, gestionamos tu atención clínica con historiales digitales, recordatorios automáticos
                y una agenda coordinada en tiempo real.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={onBookAppointment}
                  className="px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agendar Cita en Línea</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onLogin}
                  className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-sm border border-slate-300 shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Acceso para Pacientes & Personal</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-slate-700">
                <div>
                  <span className="block text-2xl font-black text-slate-900">12+</span>
                  <span className="text-xs text-slate-500">Años de trayectoria</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-900">8.500+</span>
                  <span className="text-xs text-slate-500">Pacientes atendidos</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-900">99.2%</span>
                  <span className="text-xs text-slate-500">Satisfacción en tratamientos</span>
                </div>
              </div>
            </div>

            {/* Quick Booking Card */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 shadow-xl border border-slate-200 space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>Reserva Inmediata de Turno</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecciona la atención deseada y confirma tu cita en pocos pasos.
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tratamiento o Motivo
                  </label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value="all">Evaluación General y Diagnóstico</option>
                    <option value="limpieza">Limpieza y Profilaxis Ultrasónica</option>
                    <option value="ortodoncia">Control de Ortodoncia / Brackets</option>
                    <option value="blanqueamiento">Blanqueamiento Dental</option>
                    <option value="cirugia">Extracción o Cirugía Dental</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sede de Atención
                  </label>
                  <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium">
                    {store.tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.address || 'Central'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-sky-900 text-[11px] leading-relaxed">
                  Podrás elegir fecha, hora exacta y tu odontólogo de preferencia en el portal de citas.
                </div>

                <button
                  onClick={onBookAppointment}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>Continuar al Agendamiento</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-400">
                  ¿Ya tienes una cita?{' '}
                  <button
                    onClick={onLogin}
                    className="text-sky-600 hover:text-sky-800 font-semibold underline"
                  >
                    Consulta tu estado aquí
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Purpose / Who We Are Section */}
      <section id="proposito" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              Institución y Misión
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              El Propósito del Centro Odontológico San Rafael
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Somos una institución médica odontológica comprometida con la excelencia asistencial,
              la accesibilidad y la salud bucodental de la comunidad. Con el soporte tecnológico de OdontoSoft,
              ofrecemos una experiencia clínica organizada, transparente y orientada al bienestar de cada paciente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Misión Asistencial</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Brindar tratamientos odontológicos preventivos y curativos con tecnología moderna,
                protocolos estrictos de bioseguridad y profesionales de probada idoneidad.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Visión de Excelencia</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ser el centro dental de referencia regional en innovación médica, satisfacción del paciente
                y seguimiento preventivo integral a lo largo de toda su vida.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Compromiso Ético</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Diagnósticos fundamentados en evidencia científica, presupuestos claros y planes de tratamiento
                ajustados a las necesidades reales de cada paciente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section id="especialidades" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              Áreas de Atención
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Especialidades Médicas Disponibles
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Tratamientos odontológicos integrales ejecutados por especialistas certificados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {specialties.map((spec) => {
              const Icon = spec.icon;
              return (
                <div
                  key={spec.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 hover:border-sky-300 transition-all shadow-xs space-y-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{spec.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{spec.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Specialists Section */}
      <section id="equipo" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              Cuerpo Médico
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Nuestros Profesionales
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Odontólogos con amplia formación académica y dedicación exclusiva al paciente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {store.dentists.slice(0, 3).map((dentist) => (
              <div
                key={dentist.id}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {dentist.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-bold text-slate-900">{dentist.name}</h4>
                  <p className="text-xs font-semibold text-sky-700">{dentist.specialty}</p>
                  <p className="text-[11px] text-slate-500">Matrícula: {dentist.licenseNumber}</p>
                  <button
                    onClick={onBookAppointment}
                    className="mt-2 text-xs text-sky-600 hover:text-sky-800 font-semibold inline-flex items-center gap-1"
                  >
                    <span>Agendar con este doctor</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Staff Access Banner */}
      <section className="bg-slate-900 text-white py-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">¿Perteneces al equipo médico o administrativo?</h3>
            <p className="text-xs text-slate-400">
              Accede al centro de operaciones clínicas, agendas de doctores y administración de la sede.
            </p>
          </div>
          <button
            onClick={onAccessPortals}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors whitespace-nowrap"
          >
            Ingresar al Hub de Gestión
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-800">Centro Odontológico San Rafael</span>
            <span className="mx-2">•</span>
            <span>Software de Gestión OdontoSoft</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onBookAppointment} className="hover:text-slate-800">
              Agendar Cita
            </button>
            <button onClick={onLogin} className="hover:text-slate-800">
              Iniciar Sesión
            </button>
            <button onClick={onAccessPortals} className="hover:text-slate-800">
              Portales Clínicos
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
