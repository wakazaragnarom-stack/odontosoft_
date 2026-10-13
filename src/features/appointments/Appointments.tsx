import { useEffect, useState } from 'react';
import { createCita, getCitas, getCitasPaciente, getConsultorios, getOdontologos, getPacientes, updateEstadoCita } from '../../shared/api/client.js';
import { Card, Page } from '../../shared/components/ui';

export default function Appointments({user}:any){
  const [rows,setRows]=useState<any[]>([]);
  const [patients,setPatients]=useState<any[]>([]);
  const [dentists,setDentists]=useState<any[]>([]);
  const [clinics,setClinics]=useState<any[]>([]);
  const [form,setForm]=useState({fecha:'',hora:'',id_paciente:'',id_odontologo:'',id_consultorio:'',motivo_consulta:'',observaciones:''});
  const [error,setError]=useState('');
  const load=async()=>{
    try{
      setRows(user.role==='patient' && user.id_paciente ? await getCitasPaciente(user.id_paciente) : await getCitas());
      if(user.role!=='patient'){
        const v=await Promise.all([getPacientes(),getOdontologos(),getConsultorios()]);
        setPatients(v[0]);setDentists(v[1]);setClinics(v[2]);
      }
    }catch(e:any){setError(e.message||'No se pudieron cargar citas.');}
  };
  useEffect(()=>{void load();},[user]);
  const save=async()=>{
    try{
      await createCita({
        fecha:form.fecha,hora:form.hora,estado:'Pendiente',
        motivo_consulta:form.motivo_consulta,observaciones:form.observaciones,
        id_paciente:Number(form.id_paciente),id_odontologo:Number(form.id_odontologo),
        id_consultorio:Number(form.id_consultorio)
      });
      setForm({fecha:'',hora:'',id_paciente:'',id_odontologo:'',id_consultorio:'',motivo_consulta:'',observaciones:''});
      await load();
    }catch(e:any){setError(e.message||'No se pudo crear la cita.');}
  };
  const next:any={'Pendiente':'Confirmada','Confirmada':'Llegó','Llegó':'En curso','En curso':'Completada'};
  return <Page title={user.role==='patient'?'Mis citas':'Agenda de citas'}>
    {user.role!=='patient'&&<Card>
      <div className="grid md:grid-cols-5 gap-3">
        <input type="date" className="field" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/>
        <input type="time" className="field" value={form.hora} onChange={e=>setForm({...form,hora:e.target.value})}/>
        <select className="field" value={form.id_paciente} onChange={e=>setForm({...form,id_paciente:e.target.value})}><option value="">Paciente</option>{patients.map(p=><option key={p.id_paciente} value={p.id_paciente}>{p.nombre} {p.apellido}</option>)}</select>
        <select className="field" value={form.id_odontologo} onChange={e=>setForm({...form,id_odontologo:e.target.value})}><option value="">Odontólogo</option>{dentists.map(d=><option key={d.id_odontologo} value={d.id_odontologo}>{d.nombre} {d.apellido}</option>)}</select>
        <select className="field" value={form.id_consultorio} onChange={e=>setForm({...form,id_consultorio:e.target.value})}><option value="">Consultorio</option>{clinics.map(c=><option key={c.id_consultorio} value={c.id_consultorio}>{c.nombre}</option>)}</select>
      </div>
      <div className="grid md:grid-cols-2 gap-3 mt-3"><input className="field" placeholder="Motivo de consulta" value={form.motivo_consulta} onChange={e=>setForm({...form,motivo_consulta:e.target.value})}/><input className="field" placeholder="Observaciones" value={form.observaciones} onChange={e=>setForm({...form,observaciones:e.target.value})}/></div>
      <button onClick={()=>void save()} disabled={!form.fecha||!form.hora||!form.id_paciente||!form.id_odontologo||!form.id_consultorio} className="btn mt-3"><Plus className="w-4 h-4"/>Agendar cita</button>
    </Card>}
    <Card><div className="divide-y">
      {rows.map(a=><div key={a.id_cita} className="py-4 flex items-center justify-between gap-3">
        <div><div className="font-black">Cita #{a.id_cita}</div><div className="text-sm text-slate-500">{a.fecha} · {String(a.hora).slice(0,5)} · Odontólogo #{a.id_odontologo}</div><div className="text-xs text-slate-500 mt-1">{a.motivo_consulta||'Consulta'}</div></div>
        <div className="flex items-center gap-2">{user.role!=='patient'&&next[a.estado]&&<button onClick={async()=>{try{await updateEstadoCita(a.id_cita,next[a.estado]);await load();}catch(e:any){setError(e.message||'No se pudo actualizar la cita.');}}} className="btn">{next[a.estado]}</button>}<span className="px-2 py-1 rounded-lg bg-slate-100 text-xs font-bold">{a.estado}</span></div>
      </div>)}
    </div>{rows.length===0&&<div className="py-10 text-center text-slate-400">Sin citas.</div>}{error&&<p className="text-sm text-rose-600 mt-3">{error}</p>}</Card>
  </Page>;
}



