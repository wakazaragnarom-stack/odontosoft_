// DIRECT_ROLE_GUARD
document.addEventListener("DOMContentLoaded",()=>{try{const u=JSON.parse(localStorage.getItem("usuario_actual")||"null");const r=String(u?.rol||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();if(r==="odontologo"){location.href="panel_odontologo.html";return;}}catch{}});
// ============================================
// PROVEEDORES.JS - Gestión de Proveedores (CORREGIDO)
// ============================================

const API = "http://127.0.0.1:8000";

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
        const res = await fetch(`${API}${path}`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : null,
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error ${res.status}`);
        }
        return res.status === 204 ? null : res.json();
    } catch (error) {
        console.error(`❌ Error en API ${method} ${path}:`, error);
        throw error;
    }
}

// ── Cargar proveedores ──────────────────────────────────────────────────
async function cargarProveedores() {
    try {
        console.log("🔄 Cargando proveedores...");
        const lista = await api("GET", "/proveedores");
        console.log("✅ Proveedores cargados:", lista.length);
        renderTabla(lista);
    } catch (error) {
        console.error("❌ Error al cargar proveedores:", error);
        toast("❌ No se pudo conectar con el servidor", "error");
        document.getElementById("tablaProveedores").innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">
                    ❌ Error de conexión: ${error.message}
                </td>
            </tr>
        `;
    }
}

// ── Renderizar tabla ──────────────────────────────────────────────────────
function renderTabla(lista) {
    const tbody = document.getElementById("tablaProveedores");
    const colores = { "Vigente": "green", "Vencido": "red", "Suspendido": "yellow" };
    
    if (!lista || !lista.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">Sin proveedores registrados</td></tr>`;
        return;
    }
    
    tbody.innerHTML = lista.map(p => `
        <tr>
            <td><strong>${p.empresa}</strong></td>
            <td>${p.contacto_asesor || '—'}</td>
            <td>${p.telefono || '—'}</td>
            <td>${p.suministro || '—'}</td>
            <td><span class="badge ${colores[p.estado_convenio] || 'green'}">${p.estado_convenio}</span></td>
            <td>
                <button class="btn-icon" title="Editar" onclick="editarProveedor(${p.id})">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="btn-danger" title="Eliminar" onclick="eliminarProveedor(${p.id})">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </td>
        </tr>
    `).join("");
}

// ── Modal ──────────────────────────────────────────────────────────────────
function abrirModal() {
    document.getElementById("editId").value = "";
    document.getElementById("modalTitulo").textContent = "Nuevo Proveedor";
    document.getElementById("inEmpresa").value = "";
    document.getElementById("inContacto").value = "";
    document.getElementById("inTelefono").value = "";
    document.getElementById("inSuministro").value = "";
    document.getElementById("inEstado").value = "Vigente";
    document.getElementById("modalProveedor").classList.add("open");
}
window.abrirModal = abrirModal;

function cerrarModal() {
    document.getElementById("modalProveedor").classList.remove("open");
}
window.cerrarModal = cerrarModal;

// ── Editar proveedor ──────────────────────────────────────────────────────
async function editarProveedor(id) {
    try {
        const p = await api("GET", `/proveedores/${id}`);
        document.getElementById("editId").value = p.id;
        document.getElementById("modalTitulo").textContent = "Editar Proveedor";
        document.getElementById("inEmpresa").value = p.empresa;
        document.getElementById("inContacto").value = p.contacto_asesor || "";
        document.getElementById("inTelefono").value = p.telefono || "";
        document.getElementById("inSuministro").value = p.suministro || "";
        document.getElementById("inEstado").value = p.estado_convenio;
        document.getElementById("modalProveedor").classList.add("open");
    } catch (error) {
        toast("❌ Error al cargar el proveedor", "error");
        console.error(error);
    }
}
window.editarProveedor = editarProveedor;

// ── Guardar proveedor ──────────────────────────────────────────────────────
async function guardarProveedor() {
    const id = document.getElementById("editId").value;
    const empresa = document.getElementById("inEmpresa").value.trim();
    const contacto_asesor = document.getElementById("inContacto").value.trim();
    const telefono = document.getElementById("inTelefono").value.trim();
    const suministro = document.getElementById("inSuministro").value.trim();
    const estado_convenio = document.getElementById("inEstado").value;
    const btn = document.getElementById("btnGuardarProveedor");

    if (!empresa) {
        toast("⚠️ Por favor, ingresa el nombre de la empresa", "warning");
        document.getElementById("inEmpresa").focus();
        return;
    }
    if (!telefono) {
        toast("⚠️ Por favor, ingresa el teléfono del proveedor", "warning");
        document.getElementById("inTelefono").focus();
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined spinner">progress_activity</span> Guardando...`;

    try {
        const data = { empresa, contacto_asesor, telefono, suministro, estado_convenio };
        
        if (id) {
            await api("PUT", `/proveedores/${id}`, data);
            toast("✅ Proveedor actualizado correctamente", "success");
        } else {
            await api("POST", "/proveedores", data);
            toast("✅ Proveedor registrado correctamente", "success");
        }
        cerrarModal();
        cargarProveedores();
    } catch(error) {
        toast(`❌ ${error.message || "Error al guardar"}`, "error");
        console.error(error);
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined">save</span> Guardar`;
    }
}
window.guardarProveedor = guardarProveedor;

// ── Eliminar proveedor ──────────────────────────────────────────────────
async function eliminarProveedor(id) {
    if (!confirm("¿Estás seguro de que quieres eliminar este proveedor? Esta acción no se puede deshacer.")) return;
    try {
        await api("DELETE", `/proveedores/${id}`);
        toast("✅ Proveedor eliminado correctamente", "success");
        cargarProveedores();
    } catch(error) {
        toast(`❌ ${error.message || "Error al eliminar"}`, "error");
        console.error(error);
    }
}
window.eliminarProveedor = eliminarProveedor;

// ── Inicio ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    const usuarioActual = JSON.parse(localStorage.getItem('usuario_actual') || 'null');
    if (!usuarioActual) {
        window.location.href = "login.html";
        return;
    }
    cargarProveedores();

    // Agregar evento al botón guardar
    document.getElementById('btnGuardarProveedor')?.addEventListener('click', guardarProveedor);
});