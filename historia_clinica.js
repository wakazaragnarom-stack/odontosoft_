const API="http://127.0.0.1:8000";let pacienteId=null,datos={},pasoActual=1;const totalPasos=6;
function toast(m,t="success"){const x=document.getElementById("toast");if(!x)return;x.textContent=m;x.className=`toast show ${t}`;setTimeout(()=>x.classList.remove("show"),3000)}
async function api(url,opt={}){const r=await fetch(API+url,{headers:{"Content-Type":"application/json","X-User-Role":"odontologo"},...opt});if(!r.ok){const e=await r.json().catch(()=>({}));throw Error(e.detail||`Error ${r.status}`)}return r.json()}
function qp(){return new URLSearchParams(location.search).get("paciente")||localStorage.getItem("paciente_clinico_id")}
function set(id,v){const e=document.getElementById(id);if(e)e.value=v??""}function cargarDatos(d){document.querySelectorAll("[data-key]").forEach(e=>e.value=d[e.dataset.key]??"")}
function recoger(){const out={...datos};document.querySelectorAll("[data-key]").forEach(e=>out[e.dataset.key]=e.value.trim());return out}
function edad(fecha){if(!fecha)return"";const n=new Date(fecha),h=new Date();let a=h.getFullYear()-n.getFullYear();const m=h.getMonth()-n.getMonth();if(m<0||(m===0&&h.getDate()<n.getDate()))a--;return a>=0?a:""}
function crearPasos(){const c=document.getElementById("hcSteps");c.innerHTML=[...document.querySelectorAll(".hc-card")].map((s,i)=>`<button type="button" class="hc-step ${i===0?'active':''}" data-step="${i+1}">${i+1}. ${s.dataset.title.split(' ')[0]}${i===0?'ificación':''}</button>`).join("");c.querySelectorAll("button").forEach(b=>b.onclick=()=>mostrarPaso(Number(b.dataset.step)))}
function mostrarPaso(n){pasoActual=Math.max(1,Math.min(totalPasos,n));document.querySelectorAll(".hc-card").forEach(s=>s.classList.toggle("active",Number(s.dataset.step)===pasoActual));document.querySelectorAll(".hc-step").forEach((b,i)=>{b.classList.toggle("active",i+1===pasoActual);b.classList.toggle("done",i+1<pasoActual)});const card=document.querySelector(`.hc-card[data-step="${pasoActual}"]`);document.getElementById("pasoTitulo").textContent=`Parte ${pasoActual} de ${totalPasos}`;document.getElementById("pasoTexto").textContent=card.dataset.title;document.getElementById("progressBar").style.width=`${pasoActual/totalPasos*100}%`;document.getElementById("btnAnterior").disabled=pasoActual===1;document.getElementById("btnSiguiente").textContent=pasoActual===totalPasos?"Finalizar ✓":"Siguiente →";window.scrollTo({top:0,behavior:"smooth"})}
async function iniciar(){pacienteId=qp();if(!pacienteId){location.href="panel_odontologo.html";return}try{const p=await api(`/pacientes/${pacienteId}`);document.getElementById("pacienteNombre").textContent=`${p.nombre} ${p.apellido} · Documento ${p.documento}`;set("personalNombre",`${p.nombre} ${p.apellido}`);set("personalDocumento",p.documento);set("personalNacimiento",p.fecha_nacimiento||"");set("personalEdad",edad(p.fecha_nacimiento));set("personalGenero",p.genero);set("personalDireccion",p.direccion);set("personalTelefono",p.telefono);set("personalCorreo",p.correo);set("personalEps",p.eps);const h=await api(`/historias-clinicas-detalladas/paciente/${pacienteId}`);datos=h.datos_clinicos||{};cargarDatos(datos)}catch(e){toast(e.message,"error")}}
async function guardar(){const b=document.getElementById("btnGuardar");b.disabled=true;try{datos=recoger();await api(`/historias-clinicas-detalladas/paciente/${pacienteId}`,{method:"PUT",body:JSON.stringify({id_paciente:Number(pacienteId),datos_clinicos:datos})});toast("Historia clínica guardada correctamente")}catch(e){toast(e.message,"error")}finally{b.disabled=false}}
function pdfBase(){const nombre=(document.getElementById("pacienteNombre")?.textContent||"paciente").replace(/[^a-z0-9áéíóúñ ]/gi," ").trim().replace(/\s+/g,"_");return nombre||"paciente"}
function valorControl(control){if(!control)return"—";if(control.tagName==='SELECT'){return control.options[control.selectedIndex]?.text||"—"}return (control.value||"").trim()||"—"}
function escaparPdf(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\n/g,'<br>')}
function crearEncabezadoPdf(titulo){
 const h=document.createElement('div');h.className='pdf-medical-header';
 const paciente=document.getElementById('pacienteNombre')?.textContent||'Paciente';
 h.innerHTML=`<div class="pdf-brand"><div class="pdf-logo-svg"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 7c4-3 7 0 11 0s7-3 11 0c5 4 4 11 2 16-2 5-2 14-7 19-3 3-5-1-6-7-1-5-2-5-3 0-1 6-3 10-6 7-5-5-5-14-7-19C6 18 5 11 13 7Z" fill="none" stroke="#0284c7" stroke-width="2.7"/><path d="M16 13c3-2 5-1 8 0 3-1 5-2 8 0" fill="none" stroke="#7dd3fc" stroke-width="2" stroke-linecap="round"/></svg></div><div><div class="pdf-brand-name">ODONTOSOFT</div><div class="pdf-brand-sub">Clínica odontológica · Historia clínica</div></div><div class="pdf-date">Fecha de emisión<br><strong>${new Date().toLocaleString('es-CO')}</strong></div></div><div class="pdf-rule"></div><div class="pdf-title">${escaparPdf(titulo)}</div><div class="pdf-patient"><strong>Paciente:</strong> ${escaparPdf(paciente)}</div>`;
 return h;
}
function convertirCardAPdf(card){
 const out=document.createElement('div');out.className='pdf-medical-document';
 const titulo=card.dataset.title||'Historia clínica';out.appendChild(crearEncabezadoPdf(titulo));
 const h2=card.querySelector('h2');if(h2){const x=document.createElement('div');x.className='pdf-section-title';x.textContent=h2.textContent.replace(/^\d+\.\s*/,'');out.appendChild(x)}
 const seen=new Set();
 card.querySelectorAll('label').forEach(label=>{
   let control=label.nextElementSibling;
   if(!control||!/^(INPUT|TEXTAREA|SELECT)$/.test(control.tagName)) control=label.parentElement?.querySelector('input,textarea,select');
   if(!control||seen.has(control)) return;seen.add(control);
   const row=document.createElement('div');row.className='pdf-field';
   const value=valorControl(control);
   row.innerHTML=`<div class="pdf-label">${escaparPdf(label.textContent.trim())}</div><div class="pdf-value">${escaparPdf(value)}</div>`;
   out.appendChild(row);
 });
 const foot=document.createElement('div');foot.className='pdf-footer';foot.innerHTML='<span>ODONTOSOFT · Documento clínico</span><span>Paciente · Historia clínica</span>';out.appendChild(foot);return out;
}
async function generarPdfElemento(el,nombre){
 if(typeof html2pdf==='undefined'){toast('No se pudo cargar el generador PDF. Revisa tu conexión a internet.','error');return}
 const holder=document.createElement('div');holder.className='pdf-render-holder';holder.appendChild(el);document.body.appendChild(holder);
 const opt={margin:[7,8,10,8],filename:nombre,image:{type:'jpeg',quality:.98},html2canvas:{scale:2,useCORS:true,allowTaint:true,backgroundColor:'#fff',logging:false},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy']}};
 try{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await html2pdf().set(opt).from(el).save()}finally{holder.remove()}
}
async function generarPdfParte(n){const card=document.querySelector(`.hc-card[data-step="${n}"]`);if(!card)return;try{await guardar();await generarPdfElemento(convertirCardAPdf(card),`Historia_Clinica_${pdfBase()}_Parte_${n}.pdf`)}catch(e){toast(e.message||'No se pudo generar el PDF','error')}}
async function generarPdfCompleta(){try{await guardar();const wrap=document.createElement('div');wrap.className='pdf-complete';[...document.querySelectorAll('.hc-card')].forEach((c,i)=>{const page=convertirCardAPdf(c);if(i<5)page.style.pageBreakAfter='always';wrap.appendChild(page)});await generarPdfElemento(wrap,`Historia_Clinica_${pdfBase()}_Completa.pdf`)}catch(e){toast(e.message||'No se pudo generar el PDF','error')}}
window.generarPdfParte=generarPdfParte;
document.addEventListener("DOMContentLoaded",()=>{const u=JSON.parse(localStorage.getItem("usuario_actual")||"null");if(!u){location.href="login.html";return}if(String(u.rol||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()!=="odontologo"){location.href="panel.html";return}crearPasos();document.getElementById("btnGuardar").onclick=guardar;document.getElementById("btnPdfCompleta").onclick=generarPdfCompleta;document.getElementById("btnAnterior").onclick=()=>mostrarPaso(pasoActual-1);document.getElementById("btnSiguiente").onclick=()=>pasoActual<totalPasos?mostrarPaso(pasoActual+1):guardar();mostrarPaso(1);iniciar()});
window.generarPdfParte=generarPdfParte;
