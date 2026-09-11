// DIRECT_ROLE_GUARD
document.addEventListener("DOMContentLoaded",()=>{try{const u=JSON.parse(localStorage.getItem("usuario_actual")||"null");const r=String(u?.rol||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();if(r==="odontologo"){location.href="panel_odontologo.html";return;}}catch{}});
// ============================================
// ROLES.JS - Gestión de Roles (CORREGIDO Y FUNCIONAL)
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

// ── Cargar roles ──────────────────────────────────────────────────────────
async function cargarRoles() {
    try {
        console.log("🔄 Cargando roles...");
        const roles = await api("GET", "/roles");
        console.log("✅ Roles cargados:", roles.length);
        renderTabla(roles);
    } catch (error) {
        console.error("❌ Error al cargar roles:", error);
        toast("❌ No se pudo conectar con el servidor", "error");
        document.getElementById("tablaRoles").innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:30px;color:var(--text-muted)">
                    ❌ Error de conexión: ${error.message}
                </td>
            </tr>
        `;
    }
}

// ── Renderizar tabla ──────────────────────────────────────────────────────
function renderTabla(roles) {
    const tbody = document.getElementById("tablaRoles");
    const coloresPermisos = { 
        "FULL ACCESS": "red", 
        "READ / UPDATE": "blue", 
        "READ ONLY": "green" 
    };
    
    if (!roles || !roles.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-muted)">Sin roles. Crea el primero.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = roles.map(r => `
        <tr>
            <td><strong>${r.id}</strong></td>
            <td><strong>${r.nombre}</strong></td>
            <td>${r.descripcion || '—'}</td>
            <td><span class="badge ${coloresPermisos[r.permisos] || 'blue'}">${r.permisos || '—'}</span></td>
            <td>
                <button class="btn-icon" title="Editar" onclick="editarRol(${r.id})">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="btn-danger" title="Eliminar" onclick="eliminarRol(${r.id})">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </td>
        </tr>
    `).join("");
}

// ── Modal ──────────────────────────────────────────────────────────────────
function abrirModal() {
    document.getElementById("editId").value = "";
    document.getElementById("modalTitulo").textContent = "Nuevo Rol";
    document.getElementById("inNombre").value = "";
    document.getElementById("inDescripcion").value = "";
    document.getElementById("inPermisos").value = "READ ONLY";
    document.getElementById("modalRol").classList.add("open");
}
window.abrirModal = abrirModal;

function cerrarModal() {
    document.getElementById("modalRol").classList.remove("open");
}
window.cerrarModal = cerrarModal;

// ── Editar rol ────────────────────────────────────────────────────────────
async function editarRol(id) {
    try {
        const r = await api("GET", `/roles/${id}`);
        document.getElementById("editId").value = r.id;
        document.getElementById("modalTitulo").textContent = "Editar Rol";
        document.getElementById("inNombre").value = r.nombre;
        document.getElementById("inDescripcion").value = r.descripcion || "";
        document.getElementById("inPermisos").value = r.permisos || "READ ONLY";
        document.getElementById("modalRol").classList.add("open");
    } catch (error) {
        toast("❌ Error al cargar el rol", "error");
        console.error(error);
    }
}
window.editarRol = editarRol;

// ── Guardar rol ────────────────────────────────────────────────────────────
async function guardarRol() {
    const id = document.getElementById("editId").value;
    const nombre = document.getElementById("inNombre").value.trim();
    const descripcion = document.getElementById("inDescripcion").value.trim();
    const permisos = document.getElementById("inPermisos").value;
    const btn = document.getElementById("btnGuardarRol");

    if (!nombre) {
        toast("⚠️ Por favor, ingresa el nombre del rol", "warning");
        document.getElementById("inNombre").focus();
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined spinner">progress_activity</span> Guardando...`;

    try {
        const data = { nombre, descripcion, permisos };
        
        if (id) {
            await api("PUT", `/roles/${id}`, data);
            toast("✅ Rol actualizado correctamente", "success");
        } else {
            await api("POST", "/roles", data);
            toast("✅ Rol creado correctamente", "success");
        }
        cerrarModal();
        cargarRoles();
    } catch (error) {
        toast(`❌ ${error.message || "Error al guardar"}`, "error");
        console.error(error);
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined">save</span> Guardar`;
    }
}
window.guardarRol = guardarRol;

// ── Eliminar rol ──────────────────────────────────────────────────────────
async function eliminarRol(id) {
    if (!confirm("¿Estás seguro de que quieres eliminar este rol? Esta acción no se puede deshacer.")) return;
    try {
        await api("DELETE", `/roles/${id}`);
        toast("✅ Rol eliminado correctamente", "success");
        cargarRoles();
    } catch (error) {
        toast(`❌ ${error.message || "Error al eliminar"}`, "error");
        console.error(error);
    }
}
window.eliminarRol = eliminarRol;

// ── Inicio ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    const usuarioActual = JSON.parse(localStorage.getItem('usuario_actual') || 'null');
    if (!usuarioActual) {
        window.location.href = "login.html";
        return;
    }
    cargarRoles();

    // Agregar evento al botón guardar
    document.getElementById('btnGuardarRol')?.addEventListener('click', guardarRol);
});