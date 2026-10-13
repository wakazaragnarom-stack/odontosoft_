import { LayoutDashboard, LogOut } from 'lucide-react';
import {
  createConsultorio, createOdontologo, createPaciente, createProveedor, createRecordatorio,
  createRol, createServicio, createTratamiento, createUsuario,
  deleteConsultorio, deleteOdontologo, deleteProveedor, deleteRecordatorio, deleteRol, deleteUsuario,
  getConsultorios, getOdontologos, getPacientes, getProveedores, getRecordatorios,
  getRoles, getServicios, getTratamientos, getUsuarios
} from '../../shared/api/client.js';
import type { User } from '../../shared/types';
import Appointments from '../appointments/Appointments';
import Billing from '../billing/Billing';
import Clinical from '../clinical/Clinical';
import Dashboard from '../dashboard/Dashboard';
import Odontogram from '../odontogram/Odontogram';
import SimpleCrud from '../../shared/components/SimpleCrud';

type Section = 'dashboard'|'users'|'patients'|'appointments'|'clinical'|'odontogram'|'treatments'|'billing'|'suppliers'|'consultorios'|'dentists'|'roles'|'reminders'|'services';
type Props = { user: User & { id_paciente?: number; id_odontologo?: number; nombre?: string }; onLogout: () => void };

const roleNames: Record<string,string> = { superadmin:'Superadministrador', clinic_admin:'Administrador', dentist:'Odontólogo', patient:'Paciente' };
const sections: Record<string,Section[]> = {
  patient:['dashboard','appointments','clinical','odontogram','services','billing'],
  dentist:['dashboard','appointments','patients','clinical','odontogram','treatments','services','consultorios'],
  clinic_admin:['dashboard','users','patients','appointments','clinical','odontogram','treatments','billing','suppliers','consultorios','dentists','roles','reminders','services'],
  superadmin:['dashboard','users','patients','appointments','clinical','odontogram','treatments','billing','suppliers','consultorios','dentists','roles','reminders','services'],
};
const labels: Record<Section,string> = {
  dashboard:'Resumen', users:'Usuarios', patients:'Pacientes', appointments:'Citas',
  clinical:'Historia clínica', odontogram:'Odontograma', treatments:'Tratamientos', billing:'Pagos y facturas',
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
      {section==='odontogram' && <Odontogram user={user}/>}
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

