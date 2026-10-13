import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { createCita, getCitas, getCitasPaciente, getConsultorios, getOdontologos, getPacientes, updateEstadoCita } from '../../shared/api/client.js';
import { Card, Page } from '../../shared/components/ui';

const localDate = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const nextState: Record<string, string> = { 'Pendiente': 'Confirmada', 'Confirmada': 'Llegó', 'Llegó': 'En curso', 'En curso': 'Completada' };
const hourText = (hour: number) => String(hour).padStart(2, '0') + ':00';

export default function Appointments({ user }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [dentists, setDentists] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => localDate(new Date()));
  const [selectedDentist, setSelectedDentist] = useState('');
  const [form, setForm] = useState({ fecha: '', hora: '', id_paciente: '', id_odontologo: '', id_consultorio: '', motivo_consulta: '', observaciones: '' });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const appointments = user.role === 'patient' && user.id_paciente ? await getCitasPaciente(user.id_paciente) : await getCitas();
      setRows(appointments);
      if (user.role !== 'patient') {
        const [patientList, dentistList, clinicList] = await Promise.all([getPacientes(), getOdontologos(), getConsultorios()]);
        setPatients(patientList); setDentists(dentistList); setClinics(clinicList);
      }
    } catch (e: any) { setError(e.message || 'No se pudieron cargar las citas.'); }
  };
  useEffect(() => { void load(); }, [user]);

  const dentistOwnId = user.role === 'dentist' ? String(user.id_odontologo ?? '') : '';
  const filtered = useMemo(() => rows
    .filter(a => String(a.fecha).slice(0, 10) === selectedDate)
    .filter(a => user.role !== 'clinic_admin' || !selectedDentist || String(a.id_odontologo) === selectedDentist)
    .sort((a, b) => String(a.hora).localeCompare(String(b.hora))), [rows, selectedDate, selectedDentist, user.role]);

  const namePatient = (id: number) => { const p = patients.find(p => p.id_paciente === id); return p ? p.nombre + ' ' + p.apellido : 'Paciente #' + id; };
  const nameDentist = (id: number) => { const d = dentists.find(d => d.id_odontologo === id); return d ? d.nombre + ' ' + d.apellido : 'Odontólogo #' + id; };
  const shiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const target = new Date(y, m - 1, d + days);
    setSelectedDate(localDate(target));
  };
  const save = async () => {
    try {
      setError('');
      await createCita({
        fecha: form.fecha, hora: form.hora, estado: 'Pendiente',
        motivo_consulta: form.motivo_consulta, observaciones: form.observaciones,
        id_paciente: Number(form.id_paciente), id_odontologo: Number(user.role === 'dentist' ? dentistOwnId : form.id_odontologo),
        id_consultorio: Number(form.id_consultorio)
      });
      setSelectedDate(form.fecha);
      setForm({ fecha: '', hora: '', id_paciente: '', id_odontologo: '', id_consultorio: '', motivo_consulta: '', observaciones: '' });
      await load();
    } catch (e: any) { setError(e.message || 'No se pudo crear la cita.'); }
  };
  const formDentist = user.role === 'dentist' ? dentistOwnId : form.id_odontologo;

  return <Page title={user.role === 'patient' ? 'Mis citas' : user.role === 'dentist' ? 'Mi calendario de citas' : 'Calendario de citas'}>
    {user.role !== 'patient' && <Card>
      <div className="flex items-center gap-2 mb-4 font-bold text-slate-800"><Plus className="w-4 h-4" />Nueva cita</div>
      <div className="grid md:grid-cols-5 gap-3">
        <input aria-label="Fecha de cita" type="date" className="field" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
        <input aria-label="Hora de cita" type="time" className="field" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} />
        <select aria-label="Paciente" className="field" value={form.id_paciente} onChange={e => setForm({ ...form, id_paciente: e.target.value })}><option value="">Paciente</option>{patients.map(p => <option key={p.id_paciente} value={p.id_paciente}>{p.nombre} {p.apellido}</option>)}</select>
        {user.role === 'dentist'
          ? <div className="field flex items-center text-sm">Mi agenda: {nameDentist(Number(dentistOwnId))}</div>
          : <select aria-label="Odontólogo" className="field" value={form.id_odontologo} onChange={e => setForm({ ...form, id_odontologo: e.target.value })}><option value="">Odontólogo</option>{dentists.map(d => <option key={d.id_odontologo} value={d.id_odontologo}>{d.nombre} {d.apellido}</option>)}</select>}
        <select aria-label="Consultorio" className="field" value={form.id_consultorio} onChange={e => setForm({ ...form, id_consultorio: e.target.value })}><option value="">Consultorio</option>{clinics.map(c => <option key={c.id_consultorio} value={c.id_consultorio}>{c.nombre}</option>)}</select>
      </div>
      <div className="grid md:grid-cols-2 gap-3 mt-3"><input className="field" placeholder="Motivo de consulta" value={form.motivo_consulta} onChange={e => setForm({ ...form, motivo_consulta: e.target.value })}/><input className="field" placeholder="Observaciones" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })}/></div>
      <button onClick={() => void save()} disabled={!form.fecha || !form.hora || !form.id_paciente || !formDentist || !form.id_consultorio} className="btn mt-3"><Plus className="w-4 h-4" />Agendar cita</button>
    </Card>}
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="font-black flex items-center gap-2"><CalendarDays className="w-5 h-5" />Agenda diaria <span className="text-sm text-slate-500 font-normal">({filtered.length} citas)</span></div>
        <div className="flex flex-wrap gap-2 items-center">
          {user.role === 'clinic_admin' && <select aria-label="Filtrar odontólogo" className="field" value={selectedDentist} onChange={e => setSelectedDentist(e.target.value)}><option value="">Todos los odontólogos</option>{dentists.map(d => <option key={d.id_odontologo} value={d.id_odontologo}>{d.nombre} {d.apellido}</option>)}</select>}
          <button aria-label="Día anterior" className="btn" onClick={() => shiftDate(-1)}><ChevronLeft className="w-4 h-4" /></button>
          <input aria-label="Día de la agenda" className="field" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          <button aria-label="Día siguiente" className="btn" onClick={() => shiftDate(1)}><ChevronRight className="w-4 h-4" /></button>
          <button className="btn" onClick={() => setSelectedDate(localDate(new Date()))}>Hoy</button>
        </div>
      </div>
      <div className="space-y-0">
        {filtered.map(a => <div key={a.id_cita} className="border-l-4 border-sky-400 pl-4 py-3 mb-3 bg-slate-50 rounded-r-xl flex flex-wrap justify-between gap-3">
          <div>
            <div className="text-lg font-black">{String(a.hora).slice(0, 5)} <span className="text-sm text-slate-500 font-normal">· {namePatient(a.id_paciente)}</span></div>
            <div className="text-sm text-slate-700 mt-1">{a.motivo_consulta || 'Consulta odontológica'}</div>
            <div className="text-xs text-slate-500 mt-1">{nameDentist(a.id_odontologo)} · Consultorio #{a.id_consultorio} · Cita #{a.id_cita}</div>
          </div>
          <div className="flex items-center gap-2">
            {user.role !== 'patient' && nextState[a.estado] && <button className="btn" onClick={async () => { try { await updateEstadoCita(a.id_cita, nextState[a.estado]); await load(); } catch (e: any) { setError(e.message || 'No se pudo actualizar la cita.'); } }}>{nextState[a.estado]}</button>}
            <span className="px-2 py-1 rounded-lg bg-white border text-xs font-bold h-fit">{a.estado}</span>
          </div>
        </div>)}
        {filtered.length === 0 && <div className="py-12 text-center text-slate-400">No hay citas programadas para este día.</div>}
      </div>
      {error && <p role="alert" className="text-sm text-rose-600 mt-3">{error}</p>}
    </Card>
  </Page>;
}
