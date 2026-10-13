import { useEffect, useState, type FormEvent } from 'react';
import { Building2, LogOut, Plus, RefreshCw, ShieldCheck, Ban, CheckCircle2 } from 'lucide-react';
import { createEmpresaSaaS, getEmpresasSaaS, updateEmpresaSaaS } from '../../shared/api/client.js';
import type { User } from '../../shared/types';

type Empresa = {
  id_empresa: number; nombre: string; correo_contacto: string; telefono?: string;
  cuota_mensual: number; fecha_vencimiento?: string | null; fecha_ultimo_pago?: string | null;
  estado_pago: 'al_dia' | 'pendiente' | 'vencido'; estado_servicio: 'activo' | 'suspendido';
};
type Props = { user: User & { nombre?: string }; onLogout: () => void };

export default function SuperAdmin({ user, onLogout }: Props) {
  const [items, setItems] = useState<Empresa[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ nombre: '', correo_contacto: '', telefono: '', cuota_mensual: '0', fecha_vencimiento: '' });
  const load = async () => { setBusy(true); setError(''); try { setItems(await getEmpresasSaaS()); } catch (e: any) { setError(e.message || 'No se pudieron cargar las empresas'); } finally { setBusy(false); } };
  useEffect(() => { void load(); }, []);
  const create = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setNotice('');
    try { await createEmpresaSaaS({ ...form, cuota_mensual: Number(form.cuota_mensual), fecha_vencimiento: form.fecha_vencimiento || null }); setForm({ nombre: '', correo_contacto: '', telefono: '', cuota_mensual: '0', fecha_vencimiento: '' }); setNotice('Empresa registrada.'); await load(); }
    catch (err: any) { setError(err.message || 'No se pudo registrar la empresa'); }
  };
  const markPaid = async (item: Empresa) => { setError(''); try { await updateEmpresaSaaS(item.id_empresa, { estado_pago: 'al_dia', fecha_ultimo_pago: new Date().toISOString().slice(0, 10) }); setNotice('Pago actualizado y servicio activo.'); await load(); } catch (e: any) { setError(e.message || 'No se pudo actualizar el pago'); } };
  const suspend = async (item: Empresa) => { setError(''); try { await updateEmpresaSaaS(item.id_empresa, { estado_pago: 'vencido', estado_servicio: 'suspendido' }); setNotice('Servicio marcado como suspendido.'); await load(); } catch (e: any) { setError(e.message || 'No se pudo suspender'); } };
  const total = items.reduce((sum, item) => sum + (item.estado_pago === 'al_dia' && item.estado_servicio === 'activo' ? Number(item.cuota_mensual) : 0), 0);
  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-white/10 bg-slate-900/80"><div className="max-w-7xl mx-auto px-5 py-5 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="p-3 bg-sky-500/15 rounded-2xl"><ShieldCheck className="w-7 h-7 text-sky-300"/></div><div><h1 className="text-2xl font-black">OdontoSoft · Control SaaS</h1><p className="text-sm text-slate-400">Superadministración · {user.email}</p></div></div><button onClick={onLogout} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15"><LogOut className="w-4 h-4"/>Salir</button></div></header>
    <main className="max-w-7xl mx-auto p-5 space-y-6">
      <div className="grid md:grid-cols-3 gap-4">{[{label:'Empresas registradas',value:items.length},{label:'Servicios activos y al día',value:items.filter(x=>x.estado_servicio==='activo'&&x.estado_pago==='al_dia').length},{label:'Ingreso mensual al día',value:total.toLocaleString('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0})}].map(k=><div key={k.label} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-400">{k.label}</p><p className="text-2xl font-black mt-2">{k.value}</p></div>)}</div>
      <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
        <form onSubmit={create} className="rounded-2xl bg-white text-slate-900 p-5 space-y-3"><h2 className="font-black text-lg flex items-center gap-2"><Plus className="w-5 h-5"/>Registrar empresa</h2><input required minLength={2} value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} className="w-full border rounded-xl p-3" placeholder="Nombre de la empresa"/><input required type="email" value={form.correo_contacto} onChange={e=>setForm({...form,correo_contacto:e.target.value})} className="w-full border rounded-xl p-3" placeholder="Correo de contacto / admin"/><input value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} className="w-full border rounded-xl p-3" placeholder="Teléfono (opcional)"/><label className="block text-xs font-bold text-slate-500">Cuota mensual (COP)</label><input required type="number" min="0" step="1000" value={form.cuota_mensual} onChange={e=>setForm({...form,cuota_mensual:e.target.value})} className="w-full border rounded-xl p-3"/><label className="block text-xs font-bold text-slate-500">Fecha de vencimiento</label><input type="date" value={form.fecha_vencimiento} onChange={e=>setForm({...form,fecha_vencimiento:e.target.value})} className="w-full border rounded-xl p-3"/><button disabled={busy} className="w-full rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold p-3">Guardar empresa</button><p className="text-xs text-slate-500">Este formulario sólo registra la empresa y sus datos de suscripción; no muestra información clínica.</p></form>
        <section className="rounded-2xl border border-white/10 overflow-hidden"><div className="p-5 flex items-center justify-between"><h2 className="font-black text-lg flex items-center gap-2"><Building2 className="w-5 h-5"/>Empresas y pagos</h2><button onClick={()=>void load()} className="p-2 rounded-lg bg-white/10" title="Actualizar"><RefreshCw className="w-4 h-4"/></button></div>
          {error&&<p className="mx-5 mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-300 text-sm">{error}</p>}{notice&&<p className="mx-5 mb-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-300 text-sm">{notice}</p>}
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-white/5 text-slate-400"><tr>{['Empresa','Contacto','Cuota','Vencimiento','Pago','Servicio','Acciones'].map(x=><th key={x} className="text-left p-3 font-bold whitespace-nowrap">{x}</th>)}</tr></thead><tbody>{items.map(item=><tr key={item.id_empresa} className="border-t border-white/10"><td className="p-3 font-bold">{item.nombre}</td><td className="p-3"><div>{item.correo_contacto}</div><div className="text-xs text-slate-500">{item.telefono}</div></td><td className="p-3 whitespace-nowrap">{Number(item.cuota_mensual).toLocaleString('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0})}</td><td className="p-3 whitespace-nowrap">{item.fecha_vencimiento||'—'}</td><td className="p-3"><span className={'px-2 py-1 rounded-full text-xs font-bold '+(item.estado_pago==='al_dia'?'bg-emerald-500/15 text-emerald-300':'bg-amber-500/15 text-amber-300')}>{item.estado_pago.replace('_',' ')}</span></td><td className="p-3"><span className={item.estado_servicio==='activo'?'text-emerald-300':'text-rose-300'}>{item.estado_servicio}</span></td><td className="p-3"><div className="flex gap-2"><button title="Registrar pago" onClick={()=>void markPaid(item)} className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300"><CheckCircle2 className="w-4 h-4"/></button><button title="Suspender servicio" onClick={()=>void suspend(item)} className="p-2 rounded-lg bg-rose-500/15 text-rose-300"><Ban className="w-4 h-4"/></button></div></td></tr>)}</tbody></table></div>
          {!items.length&&!busy&&<p className="p-8 text-center text-slate-500">Aún no hay empresas registradas.</p>}
        </section>
      </div>
      <p className="text-xs text-slate-500">La consola SuperAdmin no incluye módulos clínicos. El aislamiento de todos los registros por empresa requiere terminar la migración multiempresa de las tablas clínicas existentes.</p>
    </main>
  </div>;
}
