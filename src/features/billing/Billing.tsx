import { useEffect, useState } from 'react';
import { Plus, WalletCards } from 'lucide-react';
import { createFactura, createPago, getCitas, getFacturas, getPagos } from '../../shared/api/client.js';
import { Card, DataTable, Page } from '../../shared/components/ui';

export default function Billing({role}:{role:string}){
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

