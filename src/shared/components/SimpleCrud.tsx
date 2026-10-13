import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, DataTable, Page } from './ui';

export default function SimpleCrud({title,load,create,remove,columns,fields}:any){
  const [rows,setRows]=useState<any[]>([]);const [form,setForm]=useState<any>({});const [error,setError]=useState('');
  const refresh=async()=>{try{setRows(await load());}catch(e:any){setError(e.message||'No se pudo cargar.');}};useEffect(()=>{void refresh();},[]);
  return <Page title={title}><Card><div className="grid md:grid-cols-4 gap-3">{fields.map((f:string)=><input key={f} className="field" placeholder={f} value={form[f]||''} onChange={e=>setForm({...form,[f]:e.target.value})}/>)}</div>{create&&<button onClick={async()=>{try{const payload={...form};['id_consultorio','id_cita','paciente_id'].forEach(k=>{if(payload[k])payload[k]=Number(payload[k]);});if(payload.costo)payload.costo=Number(payload.costo);await create(payload);setForm({});await refresh();}catch(e:any){setError(e.message||'No se pudo guardar.');}}} className="btn mt-3"><Plus className="w-4 h-4"/>Crear</button>}<span className="text-sm text-slate-500 ml-3">{error}</span></Card><DataTable rows={rows} columns={columns} onDelete={remove?async(id:any)=>{if(window.confirm('¿Eliminar registro?')){await remove(id);await refresh();}}:undefined}/></Page>;
}

