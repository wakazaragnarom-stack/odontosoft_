import React, { useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, FileText, LayoutDashboard, LogOut, Package, Plus, Search, Stethoscope, Users, WalletCards, X, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import type { AppointmentStatus, Appointment } from './types';
import { addClinicalEvolutionNote, bookAppointment, createProveedor, createTratamiento, dispararRecordatorios24h, getSaaSMetrics, getStoreState, hydrateFromBackend, registrarPagoCita, subscribeToStore, updateAppointmentStatus, updateToothStatus } from './lib/store';
import { loadBackendState } from './lib/backendStore';
import { canTransitionAppointment, type AppointmentStatus as UnifiedAppointmentStatus } from './lib/unifiedDomain';

const nav = [
  ['dashboard', 'Resumen', LayoutDashboard],
  ['appointments', 'Citas', CalendarDays],
  ['patients', 'Pacientes', Users],
  ['clinical', 'Historia clínica', Stethoscope],
  ['treatments', 'Tratamientos', ClipboardList],
  ['billing', 'Pagos y facturas', WalletCards],
  ['suppliers', 'Proveedores', Package],
] as const;

type Section = (typeof nav)[number][0];

export default function UnifiedApp() {
  const [, forceRender] = useState(0);
  const [loadingBackend, setLoadingBackend] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  React.useEffect(() => subscribeToStore(() => forceRender((v) => v + 1)), []);
  React.useEffect(() => {
    let mounted = true;
    setLoadingBackend(true);
    void hydrateFromBackend(loadBackendState)
      .catch((error) => { if (mounted) setBackendError(error?.message || 'No se pudo cargar la información del backend'); })
      .finally(() => { if (mounted) setLoadingBackend(false); });
    return () => { mounted = false; };
  }, []);
  const store = getStoreState();
  const [section, setSection] = useState<Section>('dashboard');
  const [query, setQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(store.patients[0]?.id || '');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedPatient && store.patients[0]?.id) setSelectedPatient(store.patients[0].id);
    if (selectedPatient && !store.patients.some((p) => p.id === selectedPatient) && store.patients[0]?.id) setSelectedPatient(store.patients[0].id);
  }, [store.patients, selectedPatient]);

  const activePatient = store.patients.find((p) => p.id === selectedPatient) || store.patients[0];
  const metrics = getSaaSMetrics();
  const notify = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(null), 3000); };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      <aside className="hidden md:flex w-64 bg-slate-950 text-white flex-col shrink-0">
        <div className="p-6 border-b border-white/10"><div className="text-2xl font-black tracking-tight">OdontoSoft</div><div className="text-xs text-slate-400 mt-1">Plataforma clínica unificada</div></div>
        <nav className="p-3 space-y-1 flex-1">{nav.map(([id, label, Icon]) => (<button key={id} onClick={() => setSection(id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${section === id ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}><Icon className="w-4 h-4" />{label}</button>))}</nav>
        <div className="p-4 border-t border-white/10 text-xs text-slate-400">PostgreSQL: {loadingBackend ? 'cargando…' : backendError ? 'sin conexión' : 'conectado'}</div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 gap-4 sticky top-0 z-20"><div><h1 className="font-black text-lg">{nav.find(([id]) => id === section)?.[1]}</h1><p className="text-[11px] text-slate-500 hidden sm:block">Paciente → Cita → Atención → Historia → Tratamiento → Pago</p></div><div className="flex items-center gap-2"><div className="relative hidden lg:block"><Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar paciente..." className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-64" /></div><span className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">{loadingBackend ? 'Conectando' : backendError ? 'Backend no disponible' : 'Sistema activo'}</span></div></header>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {message && <div className="mb-4 p-3 bg-slate-900 text-white rounded-xl text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{message}</div>}
          {backendError && <div className="mb-4 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-sm"><strong>API:</strong> {backendError}. Verifica el backend FastAPI y `VITE_API_URL`.</div>}
          {section === 'dashboard' && <Dashboard metrics={metrics} store={store} onNavigate={setSection} />}
          {section === 'appointments' && <Appointments appointments={store.appointments} patients={store.patients} onNew={() => setShowNewAppointment(true)} onStatus={updateAppointmentStatus} notify={notify} />}
          {section === 'patients' && <Patients patients={store.patients} query={query} selected={selectedPatient} onSelect={setSelectedPatient} onClinical={() => setSection('clinical')} />}
          {section === 'clinical' && activePatient && <Clinical patient={activePatient} notify={notify} />}
          {section === 'treatments' && <Treatments treatments={store.tratamientos} tenantId={store.tenants[0]?.id || 'tenant-1'} notify={notify} />}
          {section === 'billing' && <Billing appointments={store.appointments} notify={notify} />}
          {section === 'suppliers' && <Suppliers suppliers={store.proveedores} tenantId={store.tenants[0]?.id || 'tenant-1'} notify={notify} />}
        </div>
      </main>
      {showNewAppointment && <NewAppointment patients={store.patients} dentists={store.dentists} treatments={store.tratamientos} tenantId={store.tenants[0]?.id || 'tenant-1'} onClose={() => setShowNewAppointment(false)} notify={notify} />}
    </div>
  );
}

function Dashboard({ metrics, store, onNavigate }: any) {
  const cards = [['Citas', metrics.totalAppointments, 'appointments'], ['Pacientes', store.patients.length, 'patients'], ['Odontólogos', metrics.totalDentists, 'clinical'], ['Facturación mensual', `$${metrics.monthlyRecurringRevenue.toLocaleString()}`, 'billing']];
  const upcoming = [...store.appointments].sort((a: Appointment,b: Appointment)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0,5);
  return <div className="space-y-6"><section className="bg-gradient-to-r from-slate-950 to-sky-950 text-white rounded-3xl p-6 sm:p-8"><div className="max-w-3xl"><p className="text-sky-300 text-xs font-bold uppercase tracking-wider">Centro de operación</p><h2 className="text-3xl sm:text-4xl font-black mt-2">Una sola historia para toda la clínica.</h2><p className="text-slate-300 mt-3 max-w-2xl">La agenda, atención, odontograma, tratamientos, pagos y proveedores comparten el mismo tenant y flujo operativo.</p></div></section><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(([label,value,target])=><button key={label} onClick={()=>onNavigate(target)} className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-sky-300"><div className="text-xs text-slate-500 font-semibold">{label}</div><div className="text-2xl font-black mt-1">{value}</div></button>)}</div><section className="bg-white border border-slate-200 rounded-2xl p-5"><div className="flex items-center justify-between mb-4"><div><h3 className="font-black">Próximas citas</h3><p className="text-xs text-slate-500">Agenda operativa</p></div><CalendarDays className="w-5 h-5 text-slate-400" /></div>{upcoming.length===0?<div className="py-10 text-center text-slate-400 text-sm">No hay citas registradas todavía.</div>:<div className="space-y-2">{upcoming.map((a:Appointment)=><div key={a.id} className="border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3"><div><div className="font-bold text-sm">{a.patientName || `Paciente #${a.patientId}`}</div><div className="text-xs text-slate-500">{a.date} · {a.time} · {a.treatment}</div></div><span className="text-[11px] font-bold px-2 py-1 rounded-full bg-slate-100">{a.status}</span></div>)}</div>}</section></div>;
}

function Appointments({ appointments, patients, onNew, onStatus, notify }: any) {
  const move = (a: Appointment, next: AppointmentStatus) => { if (canTransitionAppointment(a.status as UnifiedAppointmentStatus, next as UnifiedAppointmentStatus)) { onStatus(a.id, next); notify(`Cita actualizada a ${next}`); } else notify(`No se permite pasar de ${a.status} a ${next}`); };
  return <div className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">Agenda y atención</h2><p className="text-sm text-slate-500">Estados controlados para evitar saltos inválidos.</p></div><button onClick={onNew} className="inline-flex items-center gap-2 bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold"><Plus className="w-4 h-4"/>Nueva cita</button></div><div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">{appointments.length===0?<div className="p-10 text-center text-slate-400">Aún no hay citas.</div>:<div className="divide-y divide-slate-100">{appointments.map((a:Appointment)=><div key={a.id} className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div><div className="font-black">{a.patientName || `Paciente #${a.patientId}`}</div><div className="text-sm text-slate-500">{a.date} · {a.time} · {a.dentistName || `Odontólogo #${a.dentistId}`} · {a.treatment}</div><div className="text-xs text-slate-400 mt-1">{a.notes || 'Sin notas'}</div></div><div className="flex items-center gap-2 flex-wrap"><span className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold">{a.status}</span>{a.status==='scheduled'&&<button onClick={()=>move(a,'confirmed')} className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-bold">Confirmar</button>}{a.status==='confirmed'&&<button onClick={()=>move(a,'arrived' as any)} className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">Llegó</button>}{a.status==='arrived'&&<button onClick={()=>move(a,'in_progress' as any)} className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">Atender</button>}{a.status==='in_progress'&&<button onClick={()=>move(a,'completed')} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">Finalizar</button>}{!['completed','cancelled'].includes(a.status)&&<button onClick={()=>move(a,'cancelled')} className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">Cancelar</button>}</div></div>)}</div>}</div></div>;
}

function Patients({ patients, query, selected, onSelect, onClinical }: any) {
  const filtered = patients.filter((p:any)=>`${p.nombre} ${p.apellido} ${p.documento}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-4"><div><h2 className="text-xl font-black">Pacientes</h2><p className="text-sm text-slate-500">Identidad y expediente clínico centralizados.</p></div><div className="grid lg:grid-cols-3 gap-4">{filtered.map((p:any)=><button key={p.id} onClick={()=>onSelect(p.id)} className={`text-left bg-white border rounded-2xl p-4 ${selected===p.id?'border-sky-400 ring-2 ring-sky-100':'border-slate-200'}`}><div className="font-black">{p.name}</div><div className="text-xs text-slate-500 mt-1">CC {p.documento}</div><div className="text-xs text-slate-500">{p.phone}</div><div className="mt-3 text-xs font-bold text-sky-700">Ver expediente →</div></button>)}</div>{filtered.length===0&&<div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">No hay coincidencias.</div>}<button onClick={onClinical} className="text-sm font-bold text-sky-700">Abrir historia clínica del paciente seleccionado</button></div>;
}

function Clinical({ patient, notify }: any) {
  const [note, setNote] = useState(''); const [tooth, setTooth] = useState(11); const [condition, setCondition] = useState<any>('healthy');
  const saveEvolution = () => { if (!note.trim()) return; addClinicalEvolutionNote(patient.id,{id:'',date:new Date().toISOString().slice(0,10),dentistName:'OdontoSoft',treatment:'Atención clínica',notes:note.trim()}); setNote(''); notify('Evolución clínica guardada localmente; la persistencia de evolución detallada seguirá el endpoint clínico.'); };
  return <div className="space-y-5"><div><h2 className="text-xl font-black">Historia clínica: {patient.name}</h2><p className="text-sm text-slate-500">Odontograma + anamnesis + evolución en un único expediente.</p></div><div className="grid xl:grid-cols-2 gap-5"><section className="bg-white border border-slate-200 rounded-2xl p-5"><h3 className="font-black mb-4">Odontograma</h3><div className="flex gap-2"><input type="number" value={tooth} onChange={e=>setTooth(Number(e.target.value))} className="w-24 border rounded-xl px-3 py-2"/><select value={condition} onChange={e=>setCondition(e.target.value)} className="border rounded-xl px-3 py-2 flex-1"><option value="healthy">Sano</option><option value="caries">Caries</option><option value="filled">Obturado</option><option value="crown">Corona</option><option value="missing">Ausente</option><option value="implant">Implante</option><option value="root_canal">Endodoncia</option></select><button onClick={()=>{updateToothStatus(patient.id,tooth,condition);notify(`Pieza ${tooth} actualizada en el expediente`)}} className="bg-slate-900 text-white px-4 rounded-xl font-bold">Guardar</button></div><div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-5">{patient.odontogram.slice(0,32).map((t:any)=><div key={t.toothNumber} className="p-2 rounded-lg border text-center"><div className="text-[10px] text-slate-500">{t.toothNumber}</div><div className="text-[9px] font-bold">{t.status}</div></div>)}</div></section><section className="bg-white border border-slate-200 rounded-2xl p-5"><h3 className="font-black mb-3">Evolución clínica</h3><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Registrar hallazgos, diagnóstico, conducta o evolución..." className="w-full min-h-28 border rounded-xl p-3 text-sm"/><button onClick={saveEvolution} className="mt-3 bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Guardar evolución</button><div className="text-xs text-slate-400 mt-4">La evolución histórica se sigue centralizando en PostgreSQL a medida que el modelo clínico legado expone sus registros.</div></section></div></div>;
}
