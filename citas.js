
function normalizarRolNav(rol){return String(rol||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
function aplicarNavegacionPorRol(){
    let u=null; try{u=JSON.parse(localStorage.getItem("usuario_actual")||"null")}catch{}
    if(!u)return;
    const rol=normalizarRolNav(u.rol);
    if(rol!=="odontologo")return;
    document.querySelectorAll('.sidebar-menu a[href="roles.html"], .sidebar-menu a[href="proveedores.html"]').forEach(a=>a.remove());
    const usuarios=document.querySelector('.sidebar-menu a[href="panel.html"]');
    if(usuarios){usuarios.href="panel_odontologo.html";usuarios.querySelectorAll('.material-symbols-outlined').forEach(i=>i.textContent="group");usuarios.lastChild.textContent=" Pacientes";}
}
// ============================================
// CITAS.JS - Gestión de Citas (CORREGIDO FINAL - SIN ERRORES DE COPIA)
// ============================================

console.log("✅ citas.js cargado correctamente");

// ── Variables ──────────────────────────────────────────────────────────────
const API = "http://127.0.0.1:8000";
let usuarios = [];
let pacientes = [];
let odontologos = [];
let tratamientos = [];
let citas = [];
let pacientesData = [];
let odontologosData = [];
let consultorios = [];
let citaAEliminar = null;

// Variable para guardar el tratamiento original al abrir la edición
let tratamientoOriginalId = null;

// ── Toast ──────────────────────────────────────────────────────────────────
function toast(msg, tipo = "success") {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = `toast show ${tipo}`;
    setTimeout(() => t.classList.remove("show"), 3500);
}
window.toast = toast;

// ── API ──────────────────────────────────────────────────────────────────
async function api(method, path, body = null) {
    try {
        const url = `${API}${path}`;
        console.log(`📡 ${method} ${url}`);
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : null,
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error(`❌ Error ${res.status}:`, errorData);
            throw new Error(errorData.detail || `Error ${res.status}`);
        }
        return res.status === 204 ? null : res.json();
    } catch (error) {
        console.error(`❌ Error en API ${method} ${path}:`, error);
        throw error;
    }
}
window.api = api;

// ── Obtener información de paciente ──────────────────────────────────────
function getPacienteInfo(idPaciente) {
    const paciente = pacientesData.find(p => p.id_paciente === idPaciente);
    if (!paciente) return { nombre: '—', correo: '—' };
    
    const usuario = usuarios.find(u => u.correo === paciente.correo);
    return {
        nombre: `${paciente.nombre} ${paciente.apellido}`,
        correo: paciente.correo || usuario?.correo || '—'
    };
}

// ── Obtener información de odontólogo ────────────────────────────────────
function getOdontologoInfo(idOdontologo) {
    const odontologo = odontologosData.find(o => o.id_odontologo === idOdontologo);
    if (!odontologo) return { nombre: '—', correo: '—' };
    
    const usuario = usuarios.find(u => u.correo === odontologo.correo);
    return {
        nombre: `${odontologo.nombre} ${odontologo.apellido}`,
        correo: odontologo.correo || usuario?.correo || '—'
    };
}

// ── Obtener nombre del tratamiento por CITA ──────────────────────────────
function getTratamientoPorCita(cita) {
    // El backend (GET /citas) trae un array 'tratamientos' dentro de cada cita
    if (cita.tratamientos && cita.tratamientos.length > 0) {
        return cita.tratamientos[0].nombre;
    }
    return '—';
}

// ── Colores para estados ──────────────────────────────────────────────────
const coloresEstado = {
    "En Espera": "yellow",
    "En Consulta": "blue",
    "Finalizado": "green",
    "Cancelado": "red"
};

// ── Renderizar tabla ──────────────────────────────────────────────────────
function renderTabla() {
    const tbody = document.getElementById("tablaCitas");
    
    if (!citas || citas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">No hay citas registradas</td></tr>`;
        return;
    }

    tbody.innerHTML = citas.map(c => {
        const paciente = getPacienteInfo(c.id_paciente);
        const odontologo = getOdontologoInfo(c.id_odontologo);
        const tratamiento = getTratamientoPorCita(c);
        const fechaHora = `${c.fecha} ${c.hora}`;
        const estado = c.estado || 'Pendiente';
        const color = coloresEstado[estado] || 'blue';

        return `
            <tr>
                <td>
                    <strong>${paciente.nombre}</strong>
                    <span class="subtext">${paciente.correo}</span>
                </td>
                <td>
                    <strong>${odontologo.nombre}</strong>
                    <span class="subtext">${odontologo.correo}</span>
                </td>
                <td>${tratamiento}</td>
                <td>${fechaHora}</td>
                <td><span class="badge ${color}">${estado}</span></td>
                <td>
                    <button class="btn-icon" title="Editar" onclick="editarCita(${c.id_cita})">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="btn-danger" title="Eliminar" onclick="abrirConfirmModal(${c.id_cita})">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// ── Actualizar métricas ──────────────────────────────────────────────────
function actualizarMetricas() {
    document.getElementById("cntEspera").textContent = citas.filter(c => c.estado === "En Espera").length;
    document.getElementById("cntConsulta").textContent = citas.filter(c => c.estado === "En Consulta").length;
    document.getElementById("cntFinalizado").textContent = citas.filter(c => c.estado === "Finalizado").length;
}

// ── Cargar selectores ─────────────────────────────────────────────────────
function cargarSelectores() {
    const pacienteSelect = document.getElementById("inPaciente");
    pacienteSelect.innerHTML = pacientesData.length > 0
        ? pacientesData.map(p =>
            `<option value="${p.id_paciente}">
                ${p.nombre} ${p.apellido} - ${p.correo}
            </option>`
        ).join("")
        : '<option value="">No hay pacientes registrados</option>';

    const odontologoSelect = document.getElementById("inOdontologo");
    odontologoSelect.innerHTML = odontologosData.length > 0
        ? odontologosData.map(o =>
            `<option value="${o.id_odontologo}">
                ${o.nombre} ${o.apellido}
            </option>`
        ).join("")
        : '<option value="">No hay odontólogos registrados</option>';

    const tratamientoSelect = document.getElementById("inTratamiento");
    tratamientoSelect.innerHTML = tratamientos.length > 0
        ? tratamientos.map(t => `<option value="${t.id_tratamiento}">${t.nombre}</option>`).join("")
        : '<option value="">No hay tratamientos registrados</option>';

    const consultorioSelect = document.getElementById("inConsultorio");
    if (consultorios && consultorios.length > 0) {
        consultorioSelect.innerHTML = consultorios.map(c => 
            `<option value="${c.id_consultorio}">${c.nombre}</option>`
        ).join("");
    } else {
        consultorioSelect.innerHTML = '<option value="1">Consultorio Principal</option>';
    }
}

// ── Cargar datos ──────────────────────────────────────────────────────────
async function cargarDatos() {
    try {
        console.log("🔄 Cargando datos para citas...");

        const resultados = await Promise.all([
            api("GET", "/usuarios"),
            api("GET", "/tratamientos"),
            api("GET", "/citas"),
            api("GET", "/pacientes"),
            api("GET", "/odontologos"),
            api("GET", "/consultorios")
        ]);

        usuarios = resultados[0] || [];
        tratamientos = resultados[1] || [];
        citas = resultados[2] || []; 
        
        pacientesData = resultados[3] || [];
        odontologosData = resultados[4] || [];
        consultorios = resultados[5] || [];

        pacientes = usuarios.filter(u => u.rol === "Paciente");
        odontologos = usuarios.filter(u => u.rol === "Odontologo");

        cargarSelectores();
        renderTabla();
        actualizarMetricas();

    } catch (error) {
        console.error("❌ Error al cargar datos:", error);
        toast(error.message, "error");
    }
}
window.cargarDatos = cargarDatos;

// ── Modal (CORREGIDO - ELIMINADOS RESTOS DE PANEL.JS) ────────────────────
function abrirModal() {
    document.getElementById("editId").value = "";
    document.getElementById("modalTitulo").textContent = "Nueva Cita";
    document.getElementById("inFecha").value = "";
    document.getElementById("inHora").value = "";
    document.getElementById("inEstado").value = "En Espera"; // Estado correcto para citas
    document.getElementById("inMotivo").value = "";
    document.getElementById("inObservaciones").value = "";
    tratamientoOriginalId = null;
    cargarSelectores();
    document.getElementById("btnGuardarCita").disabled = false;
    document.getElementById("btnGuardarCita").innerHTML = '<span class="material-symbols-outlined">save</span> Guardar';
    document.getElementById("modalCita").classList.add("open");
}
window.abrirModal = abrirModal;

function cerrarModal() {
    document.getElementById("modalCita").classList.remove("open");
}
window.cerrarModal = cerrarModal;

// ── Editar cita ──────────────────────────────────────────────────────────
async function editarCita(id) {
    try {
        cargarSelectores();
        const c = await api("GET", `/citas/${id}`);

        document.getElementById("editId").value = c.id_cita;
        document.getElementById("modalTitulo").textContent = "Editar Cita";
        document.getElementById("inPaciente").value = c.id_paciente;
        document.getElementById("inOdontologo").value = c.id_odontologo;
        document.getElementById("inConsultorio").value = c.id_consultorio;
        document.getElementById("inFecha").value = c.fecha;
        document.getElementById("inHora").value = c.hora.substring(0,5);
        document.getElementById("inEstado").value = c.estado;
        document.getElementById("inMotivo").value = c.motivo_consulta || "";
        document.getElementById("inObservaciones").value = c.observaciones || "";

        tratamientoOriginalId = null;

        if (c.tratamientos && c.tratamientos.length > 0) {
            tratamientoOriginalId = c.tratamientos[0].id_tratamiento;
            document.getElementById("inTratamiento").value = tratamientoOriginalId;
        } else {
            document.getElementById("inTratamiento").value = "";
        }

        document.getElementById("btnGuardarCita").disabled = false;
        document.getElementById("btnGuardarCita").innerHTML = '<span class="material-symbols-outlined">save</span> Guardar';
        document.getElementById("modalCita").classList.add("open");

    } catch (error) {
        console.error(error);
        toast("❌ Error al cargar la cita", "error");
    }
}
window.editarCita = editarCita;

// ── Guardar cita (CORREGIDA Y SIN DUPLICADOS) ─────────────────────────────
async function guardarCita() {
    console.log("🚀 Entró a guardar cita");
    const id = document.getElementById("editId").value;
    const id_paciente = parseInt(document.getElementById("inPaciente").value);
    const id_odontologo = parseInt(document.getElementById("inOdontologo").value);
    const id_tratamiento = parseInt(document.getElementById("inTratamiento").value);
    const id_consultorio = parseInt(document.getElementById("inConsultorio").value);
    const fecha = document.getElementById("inFecha").value;
    const horaRaw = document.getElementById("inHora").value;
    const estado = document.getElementById("inEstado").value;
    const motivo_consulta = document.getElementById("inMotivo").value.trim() || null;
    const observaciones = document.getElementById("inObservaciones").value.trim() || null;
    const btn = document.getElementById("btnGuardarCita");

    // Formatear hora correctamente
    let hora = horaRaw;
    if (hora) {
        const partes = hora.split(':');
        if (partes.length === 2) {
            hora = `${partes[0]}:${partes[1]}:00`;
        } else if (partes.length === 3) {
            hora = `${partes[0]}:${partes[1]}:${partes[2]}`;
        } else {
            hora = '00:00:00';
        }
    }

    // Validaciones
    if (!id_paciente || isNaN(id_paciente)) { toast("⚠️ Selecciona un paciente válido", "warning"); return; }
    if (!id_odontologo || isNaN(id_odontologo)) { toast("⚠️ Selecciona un odontólogo válido", "warning"); return; }
    if (!id_tratamiento || isNaN(id_tratamiento)) { toast("⚠️ Selecciona un tratamiento válido", "warning"); return; }
    if (!id_consultorio || isNaN(id_consultorio)) { toast("⚠️ Selecciona un consultorio válido", "warning"); return; }
    if (!fecha) { toast("⚠️ Selecciona una fecha", "warning"); return; }
    if (!hora || hora === '00:00:00') { toast("⚠️ Selecciona una hora válida", "warning"); return; }

    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined spinner">progress_activity</span> Guardando...`;

    try {
        const dataCita = { 
            id_paciente, 
            id_odontologo, 
            id_consultorio,
            fecha, 
            hora,
            estado, 
            motivo_consulta,
            observaciones
        };
        
        console.log("📡 Creando cita:", dataCita);
        
        let citaCreada;

        if (id) {
            // EDICIÓN
            citaCreada = await api("PUT", `/citas/${id}`, dataCita);

            console.log("Tratamiento original:", tratamientoOriginalId);
            console.log("Tratamiento seleccionado:", id_tratamiento);

            if (id_tratamiento !== tratamientoOriginalId) {
                await api("PUT", `/citas/${id}/tratamientos/${id_tratamiento}`);
                console.log("✅ Tratamiento actualizado");
            }

            toast("✅ Cita actualizada correctamente", "success");

        } else {
            // CREACIÓN
            citaCreada = await api("POST", "/citas", dataCita);

            if (citaCreada && citaCreada.id_cita) {
                await api("POST", `/citas/${citaCreada.id_cita}/tratamientos/${id_tratamiento}`);
                console.log("✅ Tratamiento asociado a la cita nueva:", id_tratamiento, "→", citaCreada.id_cita);
            }

            toast("✅ Cita creada correctamente", "success");
        }

        cerrarModal();
        await cargarDatos();

    } catch (error) {
        console.error("❌ Error al guardar:", error);
        toast(`❌ ${error.message || "Error al guardar"}`, "error");

        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined">save</span> Guardar`;
    }
}
window.guardarCita = guardarCita;

// ── ABRIR MODAL DE CONFIRMACIÓN PARA ELIMINAR ──────────────────────────
function abrirConfirmModal(id) {
    const cita = citas.find(c => c.id_cita === id);
    if (!cita) {
        toast("❌ No se encontró la cita", "error");
        return;
    }
    
    citaAEliminar = id;
    
    const paciente = getPacienteInfo(cita.id_paciente);
    const tratamiento = getTratamientoPorCita(cita);
    
    document.getElementById("confirmIcon").textContent = "warning";
    document.getElementById("confirmIcon").className = "material-symbols-outlined confirm-icon warning";
    document.getElementById("confirmTitulo").textContent = "¿Eliminar esta cita?";
    document.getElementById("confirmMensaje").textContent = "Esta acción no se puede deshacer. La cita será eliminada permanentemente del sistema.";
    
    document.getElementById("confirmPaciente").textContent = paciente.nombre;
    document.getElementById("confirmFecha").textContent = cita.fecha || '—';
    document.getElementById("confirmHora").textContent = cita.hora || '—';
    document.getElementById("confirmTratamiento").textContent = tratamiento;
    
    const btn = document.getElementById("btnConfirmEliminar");
    btn.disabled = false;
    btn.className = "btn-confirm-eliminar";
    btn.innerHTML = '<span class="material-symbols-outlined">delete</span> Eliminar';
    btn.onclick = function() { confirmarEliminar(); };
    
    document.getElementById("confirmModal").classList.add("open");
}
window.abrirConfirmModal = abrirConfirmModal;

function cerrarConfirmModal() {
    document.getElementById("confirmModal").classList.remove("open");
    citaAEliminar = null;
}
window.cerrarConfirmModal = cerrarConfirmModal;

// ── CONFIRMAR ELIMINAR CITA ──────────────────────────────────────────────
async function confirmarEliminar() {
    if (!citaAEliminar) return;
    
    const btn = document.getElementById("btnConfirmEliminar");
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined spinner">progress_activity</span> Eliminando...`;

    try {
        await api("DELETE", `/citas/${citaAEliminar}`);
        toast("✅ Cita eliminada correctamente", "success");
        cerrarConfirmModal();
        await cargarDatos();
    } catch (error) {
        console.error("❌ Error al eliminar:", error);
        toast(`❌ ${error.message || "Error al eliminar"}`, "error");
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined">delete</span> Eliminar';
    }
}
window.confirmarEliminar = confirmarEliminar;

// ── Verificar sesión ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
    aplicarNavegacionPorRol();
    console.log("✅ DOM cargado");

    const usuarioActual = JSON.parse(localStorage.getItem("usuario_actual") || "null");

    if (!usuarioActual) {
        window.location.href = "login.html";
        return;
    }

    const btnGuardar = document.getElementById("btnGuardarCita");
    if (btnGuardar) {
        btnGuardar.addEventListener("click", guardarCita);
    } else {
        console.warn("⚠️ Botón btnGuardarCita no encontrado");
    }

    cargarDatos();
});