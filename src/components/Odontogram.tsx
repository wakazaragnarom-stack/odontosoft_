import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, Check, Save, Search, Stethoscope } from 'lucide-react';
import { getPaciente, getPacientes, getOdontograma, updateOdontograma } from '../api.js';

type UserContext = { role: string; id_paciente?: number; id_odontologo?: number; email?: string };
type Condition =
  | 'unassessed' | 'healthy' | 'caries' | 'root_canal_needed' | 'root_canal_done'
  | 'filled' | 'crown' | 'missing' | 'implant' | 'fracture' | 'treatment_done'
  | 'treatment_planned' | 'sealant';
type Tooth = { status: Condition; observation: string };
type Patient = { id_paciente: number; nombre: string; apellido: string; documento?: string; correo?: string };

const PU1 = [18,17,16,15,14,13,12,11], PU2 = [21,22,23,24,25,26,27,28];
const PL4 = [48,47,46,45,44,43,42,41], PL3 = [31,32,33,34,35,36,37,38];
const TU1 = [55,54,53,52,51], TU2 = [61,62,63,64,65];
const TL4 = [85,84,83,82,81], TL3 = [71,72,73,74,75];

const CONDITIONS: { value: Condition; label: string; color: string; text: string }[] = [
  { value: 'unassessed', label: 'Sin revisar', color: '#e2e8f0', text: '#334155' },
  { value: 'healthy', label: 'Sano', color: '#ffffff', text: '#0f172a' },
  { value: 'caries', label: 'Caries', color: '#dc2626', text: '#ffffff' },
  { value: 'root_canal_needed', label: 'Necesita conducto', color: '#f97316', text: '#ffffff' },
  { value: 'root_canal_done', label: 'Endodoncia realizada', color: '#16a34a', text: '#ffffff' },
  { value: 'filled', label: 'Restaurado / obturado', color: '#60a5fa', text: '#0f172a' },
  { value: 'crown', label: 'Corona', color: '#8b5cf6', text: '#ffffff' },
  { value: 'missing', label: 'Ausente', color: '#475569', text: '#ffffff' },
  { value: 'implant', label: 'Implante', color: '#0d9488', text: '#ffffff' },
  { value: 'fracture', label: 'Fractura', color: '#facc15', text: '#422006' },
  { value: 'treatment_done', label: 'Tratamiento realizado', color: '#34d399', text: '#064e3b' },
  { value: 'treatment_planned', label: 'Tratamiento indicado', color: '#c084fc', text: '#3b0764' },
  { value: 'sealant', label: 'Sellante', color: '#38bdf8', text: '#082f49' },
];
const BY_CONDITION = Object.fromEntries(CONDITIONS.map((x) => [x.value, x])) as Record<Condition, (typeof CONDITIONS)[number]>;
const LEGACY: Record<string, Condition> = {
  sano: 'healthy', healthy: 'healthy', caries: 'caries', restaurado: 'filled', filled: 'filled',
  ausente: 'missing', missing: 'missing', realizado: 'treatment_done', treatment_done: 'treatment_done',
  indicado: 'treatment_planned', treatment_planned: 'treatment_planned', root_canal: 'root_canal_done',
  root_canal_done: 'root_canal_done', root_canal_needed: 'root_canal_needed', conducto: 'root_canal_needed',
  endodoncia: 'root_canal_done', corona: 'crown', crown: 'crown', implante: 'implant', implant: 'implant',
  fractura: 'fracture', fracture: 'fracture', sellante: 'sealant', sealant: 'sealant',
  sin_revisar: 'unassessed', unassessed: 'unassessed',
};
const LEGACY_STATUS: Record<Condition, string> = {
  unassessed: 'sin_revisar', healthy: 'sano', caries: 'caries', root_canal_needed: 'indicado',
  root_canal_done: 'realizado', filled: 'restaurado', crown: 'restaurado', missing: 'ausente',
  implant: 'realizado', fracture: 'indicado', treatment_done: 'realizado',
  treatment_planned: 'indicado', sealant: 'restaurado',
};

function toothNumbers() {
  return [...PU1,...PU2,...PL4,...PL3,...TU1,...TU2,...TL4,...TL3];
}
function blankChart(): Record<string, Tooth> {
  return Object.fromEntries(toothNumbers().map((n) => [String(n), { status: 'unassessed', observation: '' }]));
}
function normalizeChart(input: any): Record<string, Tooth> {
  const result = blankChart();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
  Object.entries(input).forEach(([number, raw]: [string, any]) => {
    const status = String(raw?.status ?? raw?.estado ?? 'unassessed').toLowerCase().replaceAll(' ', '_');
    result[number] = {
      status: LEGACY[status] || 'unassessed',
      observation: String(raw?.observacion ?? raw?.observation ?? raw?.notes ?? ''),
    };
  });
  return result;
}
function typeOfTooth(n: number): 'incisor'|'canine'|'premolar'|'molar' {
  const d = n % 10;
  if (d === 1 || d === 2) return 'incisor';
  if (d === 3) return 'canine';
  if (d === 4 || d === 5) return 'premolar';
  return 'molar';
}
function pathOfTooth(type: ReturnType<typeof typeOfTooth>) {
  if (type === 'incisor') return 'M21 3 C14 3 10 8 10 16 L11 39 C11 47 14 51 21 51 C28 51 31 47 31 39 L32 16 C32 8 28 3 21 3 Z';
  if (type === 'canine') return 'M21 3 C15 4 11 10 12 17 L15 45 C16 50 18 52 21 52 C24 52 26 50 27 45 L30 17 C31 10 27 4 21 3 Z';
  if (type === 'premolar') return 'M21 4 C14 4 8 9 8 17 C8 25 11 29 10 38 C10 47 14 51 21 51 C28 51 32 47 32 38 C31 29 34 25 34 17 C34 9 28 4 21 4 Z';
  return 'M13 5 C7 6 4 12 5 19 L8 42 C9 49 14 52 21 51 C28 52 33 49 34 42 L37 19 C38 12 35 6 29 5 L25 8 L21 5 L17 8 Z';
}

export default function Odontogram({ user }: { user: UserContext }) {
  const isPatient = user.role === 'patient';
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [chart, setChart] = useState<Record<string, Tooth>>(() => blankChart());
  const [chosen, setChosen] = useState<number | null>(null);
  const [dentition, setDentition] = useState<'permanent'|'primary'>('permanent');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function openPatient(rowOrId: Patient | number) {
    const id = typeof rowOrId === 'number' ? rowOrId : rowOrId.id_paciente;
    if (!id) return;
    setLoadingChart(true); setError(''); setSuccess('');
    try {
      const row = typeof rowOrId === 'number' ? await getPaciente(id) as Patient : rowOrId;
      setPatient(row);
      const response = await getOdontograma(id);
      setChart(normalizeChart(response?.dientes));
      setChosen(null); setDirty(false);
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar el odontograma de este paciente.');
      setChart(blankChart());
    } finally { setLoadingChart(false); }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingPatients(true); setError('');
      try {
        if (isPatient) {
          if (!user.id_paciente) throw new Error('Esta cuenta aún no está asociada a un expediente de paciente.');
          const row = await getPaciente(user.id_paciente) as Patient;
          if (!active) return;
          setPatients([row]);
          await openPatient(row);
        } else {
          const rows = await getPacientes() as Patient[];
          if (!active) return;
          setPatients(rows);
          if (rows.length) await openPatient(rows[0]);
        }
      } catch (e: any) {
        if (active) setError(e?.message || 'No se pudieron cargar los pacientes.');
      } finally { if (active) setLoadingPatients(false); }
    })();
    return () => { active = false; };
  }, [user.role, user.id_paciente]);

  const leftUpper = dentition === 'permanent' ? PU1 : TU1;
  const rightUpper = dentition === 'permanent' ? PU2 : TU2;
  const leftLower = dentition === 'permanent' ? PL4 : TL4;
  const rightLower = dentition === 'permanent' ? PL3 : TL3;
  const active = useMemo(() => [...leftUpper,...rightUpper,...leftLower,...rightLower], [leftUpper,rightUpper,leftLower,rightLower]);
  const totals = useMemo(() => {
    const values: Record<Condition, number> = {
      unassessed:0, healthy:0, caries:0, root_canal_needed:0, root_canal_done:0,
      filled:0, crown:0, missing:0, implant:0, fracture:0, treatment_done:0,
      treatment_planned:0, sealant:0,
    };
    active.forEach((n) => { values[chart[String(n)]?.status || 'unassessed'] += 1; });
    return values;
  }, [active, chart]);

  function patchChosen(patch: Partial<Tooth>) {
    if (chosen === null || isPatient) return;
    const key = String(chosen);
    setChart((previous) => ({ ...previous, [key]: { ...(previous[key] || {status:'unassessed',observation:''}), ...patch } }));
    setDirty(true); setSuccess('');
  }
  async function saveChart() {
    if (!patient || isPatient) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const dientes = Object.fromEntries(Object.entries(chart)
        .filter(([,t]) => t.status !== 'unassessed' || t.observation.trim())
        .map(([number,t]) => [number, { status:t.status, estado:LEGACY_STATUS[t.status], observacion:t.observation.trim() }]));
      await updateOdontograma(patient.id_paciente, { id_paciente:Number(patient.id_paciente), dientes });
      setDirty(false); setSuccess('Odontograma guardado en PostgreSQL correctamente.');
    } catch (e: any) { setError(e?.message || 'No se pudo guardar el odontograma.'); }
    finally { setSaving(false); }
  }

  function renderTooth(n: number, lower: boolean) {
    const t = chart[String(n)] || {status:'unassessed' as Condition, observation:''};
    const c = BY_CONDITION[t.status] || BY_CONDITION.unassessed;
    const selected = chosen === n;
    return <button key={n} type="button" onClick={() => setChosen(n)} title={'Diente '+n+' · '+c.label}
      aria-label={'Diente '+n+', estado: '+c.label} aria-pressed={selected}
      className={'min-w-0 rounded-xl border px-0.5 py-2 flex flex-col items-center gap-1 transition hover:-translate-y-0.5 hover:shadow-sm '+(selected?'ring-2 ring-sky-500 ring-offset-1':'')}
      style={{backgroundColor:selected?'#eff6ff':'#fff',borderColor:selected?'#0284c7':'#cbd5e1'}}>
      <svg viewBox="0 0 42 56" className="w-full max-w-[42px] h-10 sm:h-12" aria-hidden="true">
        <path d={pathOfTooth(typeOfTooth(n))} transform={lower?'rotate(180 21 28)':undefined} fill={c.color}
          stroke={t.status==='unassessed'?'#94a3b8':t.status==='healthy'?'#64748b':c.color} strokeWidth="2" strokeLinejoin="round"/>
      </svg>
      <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">{n}</span>
      {t.status !== 'unassessed' && <span className="h-1.5 w-1.5 rounded-full" style={{backgroundColor:c.color,border:t.status==='healthy'?'1px solid #64748b':'none'}}/>}
    </button>;
  }
  function renderArch(left: number[], right: number[], lower: boolean) {
    const teeth = [...left,...right];
    return <div className="min-w-[790px]">
      <div className="grid gap-1 sm:gap-1.5" style={{gridTemplateColumns:'repeat('+teeth.length+',minmax(0,1fr))'}}>
        {teeth.map((n,i)=><div key={n} className={i===left.length?'border-l-2 border-slate-300 pl-1':''}>{renderTooth(n,lower)}</div>)}
      </div>
      <div className="grid grid-cols-2 mt-2 text-[10px] uppercase tracking-wide text-slate-400">
        <span>{lower?'Cuadrante IV':'Cuadrante I'}</span><span className="text-right">{lower?'Cuadrante III':'Cuadrante II'}</span>
      </div>
    </div>;
  }

  const selected = chosen === null ? null : chart[String(chosen)];
  const selectedCondition = BY_CONDITION[selected?.status || 'unassessed'];
  return <div className="space-y-5">
    <section className="rounded-3xl bg-slate-950 text-white p-5 sm:p-7">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div><div className="flex items-center gap-2 text-sky-300 text-xs font-bold uppercase tracking-wider"><Stethoscope className="w-4 h-4"/>OdontoSoft · Registro clínico</div>
          <h2 className="text-2xl sm:text-3xl font-black mt-2">Odontograma visual</h2>
          <p className="text-slate-300 text-sm mt-2">Selecciona una pieza, registra su condición y guarda los cambios en la ficha del paciente.</p></div>
        {!isPatient && <button disabled={!patient||saving||loadingChart||!dirty} onClick={() => void saveChart()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-bold text-white hover:bg-sky-400 disabled:opacity-50"><Save className="w-4 h-4"/>{saving?'Guardando…':'Guardar odontograma'}</button>}
      </div>
      <div className="mt-5 flex flex-col md:flex-row md:items-end gap-3">
        {isPatient ? <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><div className="text-xs text-slate-400">Paciente</div><div className="font-bold">{patient?patient.nombre+' '+patient.apellido:'Cargando ficha…'}</div></div> :
          <label className="flex-1 max-w-xl"><span className="block text-xs text-slate-400 mb-1.5">Seleccionar paciente</span><div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <select className="w-full rounded-xl bg-white text-slate-900 border border-slate-300 pl-9 pr-3 py-3 text-sm" value={patient?.id_paciente||''}
              onChange={(e) => {const row=patients.find((p)=>Number(p.id_paciente)===Number(e.target.value));if(row)void openPatient(row);}}
              disabled={loadingPatients||patients.length===0}>
              <option value="">{loadingPatients?'Cargando pacientes…':patients.length===0?'No hay pacientes disponibles':'Selecciona un paciente'}</option>
              {patients.map((p)=><option key={p.id_paciente} value={p.id_paciente}>{p.nombre} {p.apellido} · #{p.id_paciente}</option>)}
            </select>
          </div></label>}
        <div className="flex gap-2"><button onClick={()=>setDentition('permanent')} className={'rounded-xl border px-4 py-3 text-sm font-bold '+(dentition==='permanent'?'bg-sky-500 text-white border-sky-400':'bg-white/5 text-slate-200 border-white/15')}>Permanente · 32</button>
          <button onClick={()=>setDentition('primary')} className={'rounded-xl border px-4 py-3 text-sm font-bold '+(dentition==='primary'?'bg-sky-500 text-white border-sky-400':'bg-white/5 text-slate-200 border-white/15')}>Temporal · 20</button></div>
      </div>
      {(patient?.documento||patient?.correo)&&<div className="mt-3 text-xs text-slate-400">{patient.documento?'Documento: '+patient.documento:''}{patient.documento&&patient.correo?' · ':''}{patient.correo||''}</div>}
    </section>

    {error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>{error}</div>}
    {success&&<div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2"><Check className="w-4 h-4 shrink-0"/>{success}</div>}
    {isPatient&&<div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">Vista de consulta: solo el odontólogo o personal autorizado puede modificar el odontograma.</div>}

    <div className="grid xl:grid-cols-[minmax(0,1fr)_310px] gap-5 items-start">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><h3 className="text-lg font-black text-slate-900">Dentición {dentition==='permanent'?'permanente':'temporal'}</h3><p className="text-xs text-slate-500 mt-1">Nomenclatura FDI · Haz clic sobre una pieza para editarla.</p></div>{loadingChart&&<span className="text-sm text-sky-700 animate-pulse">Cargando odontograma…</span>}</div>
        <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-3 sm:p-4"><div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-3"><span>Arcada superior</span><span>{leftUpper.length+rightUpper.length} piezas</span></div><div className="overflow-x-auto pb-2">{renderArch(leftUpper,rightUpper,false)}</div></div>
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 my-2"><span className="h-px flex-1 bg-slate-200"/><span>Línea media</span><span className="h-px flex-1 bg-slate-200"/></div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 sm:p-4"><div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-3"><span>Arcada inferior</span><span>{leftLower.length+rightLower.length} piezas</span></div><div className="overflow-x-auto pb-2">{renderArch(leftLower,rightLower,true)}</div></div>
        <div className="mt-5"><div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Leyenda de condiciones</div><div className="flex flex-wrap gap-2">{CONDITIONS.map((c)=><span key={c.value} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700"><span className="h-3 w-3 rounded-full border border-slate-400" style={{backgroundColor:c.color}}/>{c.label}</span>)}</div></div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2"><h3 className="font-black text-slate-900">Pieza seleccionada</h3>{dirty&&!isPatient&&<span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 rounded-full px-2 py-1">Sin guardar</span>}</div>
          {chosen===null?<div className="mt-4 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">Selecciona un diente del odontograma.</div>:<>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="w-14 h-16 rounded-lg border border-slate-200 flex items-center justify-center bg-white"><svg viewBox="0 0 42 56" className="w-10 h-12"><path d={pathOfTooth(typeOfTooth(chosen))} transform={chosen>=31&&chosen<=48||chosen>=71?'rotate(180 21 28)':undefined} fill={selectedCondition.color} stroke="#64748b" strokeWidth="2"/></svg></div><div><div className="text-xs text-slate-500">Nomenclatura FDI</div><div className="text-2xl font-black text-slate-900">Diente {chosen}</div><div className="text-xs font-bold mt-1" style={{color:selectedCondition.text}}>{selectedCondition.label}</div></div></div>
            <fieldset disabled={isPatient} className="mt-5"><legend className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Estado clínico</legend><div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
              {CONDITIONS.map((c)=><button key={c.value} type="button" onClick={()=>patchChosen({status:c.value})} className={'flex items-center gap-2.5 rounded-xl border p-2.5 text-left text-xs font-bold '+(selectedCondition.value===c.value?'ring-2 ring-sky-500 border-sky-500':'border-slate-200 hover:border-slate-400')} style={{backgroundColor:selectedCondition.value===c.value?'#f0f9ff':'#ffffff'}}><span className="h-4 w-4 rounded-full border border-slate-300 shrink-0" style={{backgroundColor:c.color}}/>{c.label}{selectedCondition.value===c.value&&<Check className="w-3.5 h-3.5 ml-auto text-sky-700"/>}</button>)}
            </div><label htmlFor="tooth-observation" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mt-5 mb-2">Observaciones</label><textarea id="tooth-observation" rows={4} value={selected?.observation||''} onChange={(e)=>patchChosen({observation:e.target.value})} placeholder="Ej. Caries oclusal, dolor, restauración pendiente…" className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"/></fieldset>
            {isPatient&&selected?.observation&&<p className="mt-3 text-sm text-slate-600"><strong>Observación:</strong> {selected.observation}</p>}
          </>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Activity className="w-4 h-4 text-sky-600"/><h3 className="font-black">Resumen de piezas</h3></div><p className="text-xs text-slate-500 mt-1">{active.length} dientes en dentición {dentition==='permanent'?'permanente':'temporal'}.</p><div className="mt-4 space-y-3">
          {[{value:'healthy' as Condition,label:'Sanos'},{value:'caries' as Condition,label:'Caries'},{value:'root_canal_needed' as Condition,label:'Necesita conducto'},{value:'root_canal_done' as Condition,label:'Endodoncia realizada'},{value:'unassessed' as Condition,label:'Sin revisar'}].map((item)=><div key={item.value}><div className="flex justify-between text-xs mb-1.5"><span className="text-slate-600">{item.label}</span><strong>{totals[item.value]}</strong></div><div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{width:(totals[item.value]/active.length*100)+'%',backgroundColor:BY_CONDITION[item.value].color,border:item.value==='healthy'?'1px solid #94a3b8':'none'}}/></div></div>)}
        </div><div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">“Sin revisar” no significa sano. Registra únicamente las piezas evaluadas clínicamente.</div></section>
      </aside>
    </div>
  </div>;
}
