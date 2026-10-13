import { Trash2 } from 'lucide-react';

export function Page({title,children}:any){return <div className="space-y-5"><h2 className="text-2xl font-black">{title}</h2>{children}</div>;}
export function Card({children}:any){return <section className="bg-white border border-slate-200 rounded-2xl p-5">{children}</section>;}
export function DataTable({rows,columns,onDelete}:any){return <Card><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b">{columns.map((c:string)=><th key={c} className="text-left py-3 pr-4 text-xs uppercase text-slate-500">{c}</th>)}{onDelete&&<th/>}</tr></thead><tbody>{rows.map((r:any)=><tr key={String(r[columns[0]])} className="border-b last:border-0">{columns.map((c:string,i:number)=><td key={c} className="py-3 pr-4">{typeof r[c]==='object'?JSON.stringify(r[c]):String(r[c]??'—')}</td>)}{onDelete&&<td><button onClick={()=>void onDelete(r[columns[0]])} className="text-rose-600"><Trash2 className="w-4 h-4"/></button></td>}</tr>)}</tbody></table>{rows.length===0&&<div className="py-8 text-center text-slate-400">Sin registros.</div>}</div></Card>;}


