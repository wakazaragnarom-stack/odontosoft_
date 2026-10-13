import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { getHistoriaDetallada, getPaciente, getPacientes, updateHistoriaDetallada } from '../../shared/api/client.js';
import { Card, Page } from '../../shared/components/ui';

export default function Clinical({user}:any){
  const [patients,setPatients]=useState<any[]>([]);
  const [patient,setPatient]=useState<any>(null);
  const [detail,setDetail]=useState<any>({datos_clinicos:{}});
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const select=async(id:number)=>{
    if(!id)return;
    setLoading(true);setError('');
    try{
      const p=await getPaciente(id);
      let v:any={datos_clinicos:{}};
      try{v=await getHistoriaDetallada(id)||v;}catch{ /* La ficha detallada puede no existir todavía. */ }
      setPatient(p);setDetail({...v,datos_clinicos:v.datos_clinicos||{}});
    }catch(e:any){setError(e.message||'No se pudo abrir la historia clínica.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{
    if(user.role==='patient'){if(user.id_paciente)void select(user.id_paciente);}
    else getPacientes().then(setPatients).catch((e:any)=>setError(e.message||'No se pudieron cargar pacientes.'));
  },[user.role,user.id_paciente]);
  return <Page title={user.role==='patient'?'Mi historia clínica':'Historia clínica'}>
    {user.role!=='patient'&&<Card><label className="block text-sm font-semibold mb-2">Selecciona un paciente</label><select className="field" value={patient?.id_paciente||''} onChange={e=>void select(Number(e.target.value))}><option value="">Selecciona paciente</option>{patients.map(p=><option key={p.id_paciente} value={p.id_paciente}>{p.nombre} {p.apellido}</option>)}</select></Card>}
    {error&&<p className="text-sm text-rose-600">{error}</p>}
    {loading&&<p className="text-sm text-slate-500">Cargando historia clínica…</p>}
    {patient&&<Card><div className="mb-4"><h3 className="font-black text-lg">{patient.nombre} {patient.apellido}</h3><p className="text-sm text-slate-500">Documento: {patient.documento||'—'} · Paciente #{patient.id_paciente}</p><p className="text-xs text-slate-500 mt-2">El odontograma tiene su propia sección en el menú lateral.</p></div><h3 className="font-black">Datos clínicos</h3><div className="space-y-2 mt-3">{['motivo_consulta','antecedentes_medicos','alergias_especificas','presion_arterial','enfermedades_sistemicas','medicacion_actual','habitos','diagnostico_periodontal','observaciones_generales'].map(k=><label key={k} className="block"><span className="block text-xs font-semibold text-slate-500 capitalize mb-1">{k.replaceAll('_',' ')}</span><textarea className="field min-h-16" value={detail.datos_clinicos?.[k]||''} onChange={e=>setDetail({...detail,datos_clinicos:{...(detail.datos_clinicos||{}),[k]:e.target.value}})}/></label>)}</div>{user.role!=='patient'&&<button onClick={async()=>{try{setError('');setDetail(await updateHistoriaDetallada(patient.id_paciente,{id_paciente:patient.id_paciente,datos_clinicos:detail.datos_clinicos||{}}));}catch(e:any){setError(e.message||'No se pudo guardar la historia clínica.');}}} className="btn mt-3"><Save className="w-4 h-4"/>Guardar historia</button>}</Card>}
    {!patient&&!loading&&<Card><div className="py-10 text-center text-slate-400">Selecciona un paciente para consultar su historia clínica.</div></Card>}
  </Page>;
}


