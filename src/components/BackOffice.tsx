import { useEffect, useState } from 'react';
import { Activity, CalendarDays, ClipboardList, LayoutDashboard, LogOut, Package, Plus, Stethoscope, WalletCards, Building2, ShieldCheck, BellRing, UserCog, Trash2, Save } from 'lucide-react';
import {
  createCita, createConsultorio, createOdontologo, createPaciente, createProveedor, createRecordatorio,
  createRol, createServicio, createTratamiento, createUsuario, createPago,
  deleteOdontologo, deleteProveedor, deleteRecordatorio, deleteRol, deleteUsuario,
  getConsultorios, getCitas, getCitasPaciente, getFacturas, getHistoriaDetallada,
  getOdontograma, getOdontologos, getPacientes, getPagos, getProveedores, getRecordatorios,
  getRoles, getServicios, getTratamientos, getUsuarios, updateEstadoCita, updateHistoriaDetallada,
  updateOdontograma
} from '../api.js';
import type { User } from '../types';

type Section = 'dashboard'|'users'|'patients'|'appointments'|'clinical'|'treatments'|'billing'|'suppliers'|'consultorios'|'dentists'|'roles'|'reminders'|'services';
type Props = { user: User & { id_paciente?: number; id_odontologo?: number; nombre?: string }; onLogout: () => void };

const roleNames: Record<string,string> = { superadmin:'Superadministrador', clinic_admin:'Administrador', dentist:'Odontólogo', patient:'Paciente' };
const sections: Record<string,Section[]> = {
  patient:['dashboard','appointments','clinical','services','billing'],
  dentist:['dashboard','appointments','patients','clinical','treatments','services','consultorios'],
  clinic_admin:['dashboard','users','patients','appointments','clinical','treatments','billing','suppliers','consultorios','dentists','roles','reminders','services'],
  superadmin:['dashboard','users','patients','appointments','clinical','treatments','billing','suppliers','consultorios','dentists','roles','reminders','services'],
};
const labels: Record<Section,string> = {
  dashboard:'Resumen', users:'Usuarios', patients:'Pacientes', appointments:'Citas',
  clinical:'Historia clínica', treatments:'Tratamientos', billing:'Pagos y facturas',
  suppliers:'Proveedores', consultorios:'Consultorios', dentists:'Odontólogos',
  roles:'Roles', reminders:'Recordatorios', services:'Servicios',
};

export default function BackOffice({user,onLogout}: Props){
  const available = sections[user.role] || sections.patient;
  const [section,setSection]=useState<Section>('dashboard');
  const [mobile,setMobile]=useState(false);
  const go=(next:Section)=>{setSection(next);setMobile(false);};
  return <div className="min-h-screen bg-slate-100 flex">
    <aside className={'fixed inset-y-0 left-0 z-40 w-72 bg-slate-950 text-white flex flex-col md:static transform transition-transform ' + (mobile?'translate-x-0':'-translate-x-full md:translate-x-0')}>
      <div className="p-6 border-b border-white/10"><div className="text-2xl font-black">OdontoSoft</div><div className="text-xs text-slate-400 mt-1">{roleNames[user.role]}</div></div>
      <nav className="p-3 flex-1 overflow-y-auto space-y-1">{available.map(function(id){return <button key={id} onClick={()=>go(id)} className={'w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold ' + (section===id?'bg-sky-600':'text-slate-300 hover:bg-white/5')}>{labels[id]}</button>;})}</nav>
      <div className="p-4 border-t border-white/10"><div className="text-sm font-bold">{user.nombre || user.email}</div><button onClick={onLogout} className="mt-3 w-full flex gap-2 justify-center bg-white/10 rounded-xl py-2.5 text-xs font-bold"><LogOut className="w-4 h-4"/>Salir</button></div>
    </aside>
    <main className="flex-1 min-w-0"><header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20"><div className="flex items-center gap-3"><button className="md:hidden border rounded-lg p-2" onClick={()=>setMobile(true)}><LayoutDashboard className="w-4 h-4"/></button><div><h1 className="font-black">{labels[section]}</h1><p className="text-[11px] text-slate-500">{user.email}</p></div></div><div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">API conectada</div></header><div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {section==='dashboard' && <Dashboard user={user} go={go}/>}
      {section==='users' && <SimpleCrud title="Usuarios" load={getUsuarios} create={createUsuario} remove={deleteUsuario} columns={['id_usuario','nombre','apellido','correo','rol','estado']} fields={['correo','contrasena','rol','estado','nombre','apellido','documento','telefono']}/>}
      {section==='patients' && <SimpleCrud title="Pacientes" load={getPacientes} create={createPaciente} columns={['id_paciente','nombre','apellido','documento','correo','telefono']} fields={['nombre','apellido','documento','correo','telefono','fecha_nacimiento','genero','direccion','eps','alergias']}/>}
      {section==='appointments' && <Appointments user={user}/>}
      {section==='clinical' && <Clinical user={user}/>}
      {section==='treatments' && <SimpleCrud title="Tratamientos" load={getTratamientos} create={createTratamiento} columns={['id_tratamiento','nombre','descripcion','costo','duracion_estimada']} fields={['nombre','descripcion','costo','duracion_estimada']}/>}
      {section==='billing' && <Billing role={user.role} />}
      {section==='suppliers' && <SimpleCrud title="Proveedores" load={getProveedores} create={createProveedor} remove={deleteProveedor} columns={['id','empresa','contacto_asesor','telefono','suministro','estado_convenio']} fields={['empresa','contacto_asesor','telefono','suministro','estado_convenio']}/>}
      {section==='consultorios' && <SimpleCrud title="Consultorios" load={getConsultorios} create={createConsultorio} remove={deleteConsultorio} columns={['id_consultorio','nombre','ubicacion','numero_sala']} fields={['nombre','ubicacion','numero_sala']}/>}
      {section==='dentists' && <SimpleCrud title="Odontólogos" load={getOdontologos} create={createOdontologo} remove={deleteOdontologo} columns={['id_odontologo','nombre','apellido','documento','correo','especialidad','id_consultorio']} fields={['nombre','apellido','documento','telefono','correo','especialidad','id_consultorio']}/>}
      {section==='roles' && <SimpleCrud title="Roles" load={getRoles} create={createRol} remove={deleteRol} columns={['id','nombre','descripcion','permisos']} fields={['nombre','descripcion','permisos']}/>}
      {section==='reminders' && <SimpleCrud title="Recordatorios" load={getRecordatorios} create={createRecordatorio} remove={deleteRecordatorio} columns={['id_recordatorio','tipo','fecha_envio','estado','id_cita']} fields={['tipo','fecha_envio','estado','id_cita']}/>}
      {section==='services' && <SimpleCrud title={user.role==='patient'?'Mis servicios':'Servicios'} load={getServicios} create={user.role==='patient'?undefined:createServicio} columns={['id','paciente_id','tratamiento_nombre','odontologo_nombre','proxima_cita','estado_cuenta']} fields={['paciente_id','tratamiento_nombre','odontologo_nombre','proxima_cita','estado_cuenta']}/>}
    </div></main>{mobile&&<button aria-label="Cerrar" onClick={()=>setMobile(false)} className="fixed inset-0 bg-slate-950/50 z-30 md:hidden"/>}</div>;
}

function Dashboard({user,go}:any){
  const [counts,setCounts]=useState<any>({a:0,p:0,d:0,t:0,f:0,s:0});
  useEffect(()=>{(async()=>{const role=user.role;const a=role==='patient'?await getCitasPaciente(user.id_paciente).catch(()=>[]):await getCitas().catch(()=>[]);const p=role==='patient'?[]:await getPacientes().catch(()=>[]);const d=role==='patient'?[]:await getOdontologos().catch(()=>[]);const t=role==='patient'?[]:await getTratamientos().catch(()=>[]);const f=await getFacturas().catch(()=>[]);const s=await getServicios().catch(()=>[]);setCounts({a:a.length,p:p.length,d:d.length,t:t.length,f:f.length,s:s.length});})();},[user]);return <div className="space-y-5"><section className="rounded-3xl p-7 bg-slate-950 text-white"><div className="text-sky-300 text-xs font-bold uppercase">Panel principal</div><h2 className="text-3xl font-black mt-2">Bienvenido a OdontoSoft</h2><p className="text-slate-300 mt-2">Acceso según rol: {roleNames[user.role]}.</p></section><div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4"><Metric label={user.role==='patient'?'Mis citas':'Citas'} value={counts.a} icon={CalendarDays}/><Metric label="Pacientes" value={counts.p} icon={UserCog}/><Metric label="Odontólogos" value={counts.d} icon={Stethoscope}/><Metric label={user.role==='patient'?'Mis facturas':'Facturas'} value={counts.f} icon={WalletCards}/><Metric label={user.role==='patient'?'Mis servicios':'Servicios'} value={counts.s} icon={Activity}/></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3"><button onClick={()=>go('appointments')} className="p-4 rounded-2xl bg-sky-50 font-bold text-left">Agenda →</button><button onClick={()=>go('clinical')} className="p-4 rounded-2xl bg-indigo-50 font-bold text-left">Historia clínica →</button><button onClick={()=>go('billing')} className="p-4 rounded-2xl bg-amber-50 font-bold text-left">Facturación →</button>{user.role!=='patient'&&<button onClick={()=>go('users')} className="p-4 rounded-2xl bg-slate-50 font-bold text-left">Administración →</button>}</div></div>;
}
function Metric({label,value,icon:Icon}:any){return <div className="bg-white border rounded-2xl p-5"><div className="flex justify-between text-xs font-bold text-slate-500"><span>{label}</span><Icon className="w-4 h-4"/></div><div className="text-2xl font-black mt-2">{value}</div></div>;}

function SimpleCrud({title,load,create,remove,columns,fields}:any){
  const [rows,setRows]=useState<any[]>([]);const [form,setForm]=useState<any>({});const [error,setError]=useState('');
  const refresh=async()=>{try{setRows(await load());}catch(e:any){setError(e.message||'No se pudo cargar.');}};useEffect(()=>{void refresh();},[]);
  return <Page title={title}><Card><div className="grid md:grid-cols-4 gap-3">{fields.map((f:string)=><input key={f} className="field" placeholder={f} value={form[f]||''} onChange={e=>setForm({...form,[f]:e.target.value})}/>)}</div>{create&&<button onClick={async()=>{try{const payload={...form};['id_consultorio','id_cita','paciente_id'].forEach(k=>{if(payload[k])payload[k]=Number(payload[k]);});if(payload.costo)payload.costo=Number(payload.costo);await create(payload);setForm({});await refresh();}catch(e:any){setError(e.message||'No se pudo guardar.');}}} className="btn mt-3"><Plus className="w-4 h-4"/>Crear</button>}<span className="text-sm text-slate-500 ml-3">{error}</span></Card><DataTable rows={rows} columns={columns} onDelete={remove?async(id:any)=>{if(window.confirm('¿Eliminar registro?')){await remove(id);await refresh();}}:undefined}/></Page>;
}
function Page({title,children}:any){return <div className="space-y-5"><h2 className="text-2xl font-black">{title}</h2>{children}</div>;}
function Card({children}:any){return <section className="bg-white border border-slate-200 rounded-2xl p-5">{children}</section>;}
function DataTable({rows,columns,onDelete}:any){return <Card><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b">{columns.map((c:string)=><th key={c} className="text-left py-3 pr-4 text-xs uppercase text-slate-500">{c}</th>)}{onDelete&&<th/>}</tr></thead><tbody>{rows.map((r:any)=><tr key={String(r[columns[0]])} className="border-b last:border-0">{columns.map((c:string,i:number)=><td key={c} className="py-3 pr-4">{typeof r[c]==='object'?JSON.stringify(r[c]):String(r[c]??'—')}</td>)}{onDelete&&<td><button onClick={()=>void onDelete(r[columns[0]])} className="text-rose-600"><Trash2 className="w-4 h-4"/></button></td>}</tr>)}</tbody></table>{rows.length===0&&<div className="py-8 text-center text-slate-400">Sin registros.</div>}</div></Card>;}

function Appointments({user}:any){
  const [rows,setRows]=useState<any[]>([]);
  const [patients,setPatients]=useState<any[]>([]);
  const [dentists,setDentists]=useState<any[]>([]);
  const [clinics,setClinics]=useState<any[]>([]);
  const [form,setForm]=useState({fecha:'',hora:'',id_paciente:'',id_odontologo:'',id_consultorio:'',motivo_consulta:'',observaciones:''});
  const [error,setError]=useState('');
  const load=async()=>{
    try{
      setRows(user.role==='patient'?await getCitasPaciente(user.id_paciente):await getCitas());
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


function Clinical({user}:any){
  const [patients,setPatients]=useState<any[]>([]);const [patient,setPatient]=useState<any>(null);const [odonto,setOdonto]=useState<any>({dientes:{}});const [detail,setDetail]=useState<any>({datos_clinicos:{}});const [tooth,setTooth]=useState('11');const [state,setState]=useState('healthy');const select=async(id:number)=>{const p=await (await import('../api.js')).getPaciente(id);const v=await Promise.all([getOdontograma(id),getHistoriaDetallada(id)]);setPatient(p);setOdonto(v[0]||{dientes:{}});setDetail(v[1]||{datos_clinicos:{}});};useEffect(()=>{if(user.role==='patient'){if(user.id_paciente)void select(user.id_paciente);}else getPacientes().then(setPatients).catch(()=>{});},[user]);return <Page title={user.role==='patient'?'Mi historia clínica':'Historia clínica'}>{user.role!=='patient'&&<Card><select className="field" value={patient?.id_paciente||''} onChange={e=>void select(Number(e.target.value))}><option value="">Selecciona paciente</option>{patients.map(p=><option key={p.id_paciente} value={p.id_paciente}>{p.nombre} {p.apellido}</option>)}</select></Card>}{patient&&<div className="grid xl:grid-cols-2 gap-5"><Card><h3 className="font-black">{patient.nombre} {patient.apellido}</h3><div className="grid grid-cols-3 gap-2 mt-4"><input className="field" type="number" value={tooth} onChange={e=>setTooth(e.target.value)}/><select className="field" value={state} onChange={e=>setState(e.target.value)}><option value="healthy">Sano</option><option value="caries">Caries</option><option value="filled">Obturado</option><option value="crown">Corona</option><option value="missing">Ausente</option><option value="implant">Implante</option><option value="root_canal">Endodoncia</option></select><button onClick={async()=>{const dientes={...(odonto.dientes||{}),[tooth]:{status:state}};setOdonto(await updateOdontograma(patient.id_paciente,{id_paciente:patient.id_paciente,dientes}));}} className="btn">Guardar diente</button></div><div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-4">{Object.entries(odonto.dientes||{}).map((v:any)=><div key={v[0]} className="border rounded-lg p-2 text-center text-xs"><b>{v[0]}</b><div>{v[1]?.status||v[1]?.estado}</div></div>)}</div></Card><Card><h3 className="font-black">Datos clínicos</h3><div className="space-y-2 mt-3">{['motivo_consulta','antecedentes_medicos','alergias_especificas','presion_arterial','enfermedades_sistemicas','medicacion_actual','habitos','diagnostico_periodontal','observaciones_generales'].map(k=><textarea key={k} className="field min-h-16" placeholder={k.replaceAll('_',' ')} value={detail.datos_clinicos?.[k]||''} onChange={e=>setDetail({...detail,datos_clinicos:{...(detail.datos_clinicos||{}),[k]:e.target.value}})}/>)}</div><button onClick={async()=>setDetail(await updateHistoriaDetallada(patient.id_paciente,{id_paciente:patient.id_paciente,datos_clinicos:detail.datos_clinicos||{}}))} className="btn mt-3"><Save className="w-4 h-4"/>Guardar</button></Card></div>}{!patient&&<Card><div className="py-10 text-center text-slate-400">Selecciona un paciente.</div></Card>}</Page>;
}

function Billing({role}:{role:string}){
  const [invoices,setInvoices]=useState<any[]>([]);
  const [payments,setPayments]=useState<any[]>([]);
  const [appointments,setAppointments]=useState<any[]>([]);
  const [form,setForm]=useState({fecha_pago:new Date().toISOString().slice(0,10),monto:'',metodo_pago:'Efectivo',estado_pago:'Completado',referencia:'',id_cita:''});
  const [invoice,setInvoice]=useState({fecha_emision:new Date().toISOString().slice(0,10),subtotal:'',impuesto:'',total:'',id_pago:''});
  const [error,setError]=useState('');
  const load=async()=>{
    try{
      setInvoices((await getFacturas())||[]);
      if(role!=='patient'){
        const v=await Promise.all([getPagos(),getCitas()]);
        setPayments(v[0]||[]);setAppointments(v[1]||[]);
      }
    }catch(e:any){setError(e.message||'No se pudo cargar facturación.');}
  };
  useEffect(()=>{void load();},[role]);
  const savePayment=async()=>{
    try{
      await createPago({...form,monto:Number(form.monto),id_cita:Number(form.id_cita)});
      setForm({fecha_pago:new Date().toISOString().slice(0,10),monto:'',metodo_pago:'Efectivo',estado_pago:'Completado',referencia:'',id_cita:''});
      await load();
    }catch(e:any){setError(e.message||'No se pudo registrar el pago.');}
  };
  const saveInvoice=async()=>{
    try{
      await createFactura({...invoice,subtotal:Number(invoice.subtotal||0),impuesto:Number(invoice.impuesto||0),total:Number(invoice.total||0),id_pago:Number(invoice.id_pago)});
      setInvoice({fecha_emision:new Date().toISOString().slice(0,10),subtotal:'',impuesto:'',total:'',id_pago:''});
      await load();
    }catch(e:any){setError(e.message||'No se pudo crear la factura.');}
  };
  return <Page title={role==='patient'?'Mis facturas':'Pagos y facturas'}>
    {role!=='patient'&&<><Card><h3 className="font-black">Registrar pago</h3><div className="grid md:grid-cols-6 gap-3 mt-3">
      <input className="field" type="date" value={form.fecha_pago} onChange={e=>setForm({...form,fecha_pago:e.target.value})}/>
      <input className="field" type="number" min="0" placeholder="Monto" value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})}/>
      <select className="field" value={form.metodo_pago} onChange={e=>setForm({...form,metodo_pago:e.target.value})}><option>Efectivo</option><option>Tarjeta de Crédito/Débito</option><option>Transferencia Bancaria</option><option>MercadoPago / PSE</option></select>
      <input className="field" placeholder="Referencia" value={form.referencia} onChange={e=>setForm({...form,referencia:e.target.value})}/>
      <select className="field" value={form.id_cita} onChange={e=>setForm({...form,id_cita:e.target.value})}><option value="">Cita</option>{appointments.map(a=><option key={a.id_cita} value={a.id_cita}>Cita #{a.id_cita}</option>)}</select>
      <select className="field" value={form.estado_pago} onChange={e=>setForm({...form,estado_pago:e.target.value})}><option>Completado</option><option>Pendiente</option><option>Anulado</option></select>
    </div><button onClick={()=>void savePayment()} disabled={!form.monto||!form.id_cita} className="btn mt-3"><WalletCards className="w-4 h-4"/>Registrar pago</button></Card>
    <Card><h3 className="font-black">Crear factura</h3><div className="grid md:grid-cols-5 gap-3 mt-3">
      <input className="field" type="date" value={invoice.fecha_emision} onChange={e=>setInvoice({...invoice,fecha_emision:e.target.value})}/>
      <input className="field" type="number" placeholder="Subtotal" value={invoice.subtotal} onChange={e=>setInvoice({...invoice,subtotal:e.target.value})}/>
      <input className="field" type="number" placeholder="Impuesto" value={invoice.impuesto} onChange={e=>setInvoice({...invoice,impuesto:e.target.value})}/>
      <input className="field" type="number" placeholder="Total" value={invoice.total} onChange={e=>setInvoice({...invoice,total:e.target.value})}/>
      <select className="field" value={invoice.id_pago} onChange={e=>setInvoice({...invoice,id_pago:e.target.value})}><option value="">Pago</option>{payments.map(p=><option key={p.id_pago} value={p.id_pago}>Pago #{p.id_pago} · {p.monto}</option>)}</select>
    </div><button onClick={()=>void saveInvoice()} disabled={!invoice.id_pago} className="btn mt-3"><Plus className="w-4 h-4"/>Crear factura</button></Card></>}
    <DataTable rows={invoices} columns={['id_factura','fecha_emision','subtotal','impuesto','total','id_pago']}/>
    {error&&<p className="text-sm text-rose-600">{error}</p>}
  </Page>;
}
