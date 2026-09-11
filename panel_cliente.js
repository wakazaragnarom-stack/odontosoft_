// ============================================
// PANEL_CLIENTE.JS - Dashboard Cliente
// ============================================

const API = "http://127.0.0.1:8000";
let pacienteActual = null;
let usuarioActual = null;

// ── Toast ──────────────────────────────────────────────────────────────────
function toast(msg, tipo = "success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${tipo}`;
  setTimeout(() => t.classList.remove("show"), 3500);
}
window.toast = toast;

// ── Validar teléfono ──────────────────────────────────────────────────────
function validarTelefono(telefono) {
  const regex = /^[0-9+\-\s]{7,15}$/;
  return regex.test(telefono);
}

// ── Cambiar pestañas ──────────────────────────────────────────────────────
function cambiarTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
  
  const titulos = {
    'servicios': ['Mis Servicios', 'Consulta tus servicios adquiridos'],
    'citas': ['Mis Citas', 'Consulta tus citas programadas']
  };
  document.getElementById('tituloSeccion').textContent = titulos[tab][0];
  document.getElementById('subtituloSeccion').textContent = titulos[tab][1];
  
  document.querySelectorAll('.sidebar-menu a').forEach(el => el.classList.remove('active'));
  if (tab === 'servicios') {
    document.getElementById('menuServicios').classList.add('active');
  } else {
    document.getElementById('menuCitas').classList.add('active');
  }
}
window.cambiarTab = cambiarTab;

// ── API ──────────────────────────────────────────────────────────────────
async function api(method, path, body = null) {
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
}

// ── Cargar perfil del paciente ────────────────────────────────────────────
async function cargarPerfil() {
  try {
    const usuarioStr = localStorage.getItem('usuario_actual');
    if (!usuarioStr) {
      window.location.href = "login.html";
      return;
    }
    usuarioActual = JSON.parse(usuarioStr);

    const pacientes = await api("GET", "/pacientes");
    const paciente = pacientes.find(p => p.correo === usuarioActual.correo);
    
    if (!paciente) {
      toast("❌ No se encontró el perfil del paciente", "error");
      return;
    }

    pacienteActual = paciente;

    await cargarServicios(paciente.id_paciente);
    await cargarCitas(paciente.id_paciente);

  } catch (error) {
    console.error("Error al cargar perfil:", error);
    toast("❌ Error al cargar el perfil", "error");
  }
}

// ── Cargar servicios ──────────────────────────────────────────────────────
async function cargarServicios(pacienteId) {
  try {
    const servicios = await api("GET", `/servicios/paciente/${pacienteId}`).catch(() => []);
    const tbS = document.getElementById("tablaServicios");
    const colCuenta = { "Pagado": "green", "Saldo Pendiente": "yellow" };
    
    if (!servicios.length) {
      tbS.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-muted)">No hay servicios registrados</td></tr>`;
      return;
    }
    
    tbS.innerHTML = servicios.map(s => `
      <tr>
        <td><strong>${s.tratamiento_nombre || 'Tratamiento #' + s.id_tratamiento}</strong></td>
        <td>${s.odontologo_nombre || s.id_odontologo || '—'}</td>
        <td>${s.proxima_cita || 'Por definir'}</td>
        <td><span class="badge ${colCuenta[s.estado_cuenta] || 'yellow'}">${s.estado_cuenta || 'Pendiente'}</span></td>
      </tr>
    `).join("");
  } catch {
    document.getElementById("tablaServicios").innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-muted)">Error al cargar servicios</td></tr>`;
  }
}

// ── Cargar citas ──────────────────────────────────────────────────────────
async function cargarCitas(pacienteId) {
  try {
    const citas = await api("GET", `/citas/paciente/${pacienteId}`).catch(() => []);
    const tbC = document.getElementById("tablaCitas");
    const colEstado = { "En Espera": "yellow", "En Consulta": "blue", "Finalizado": "green" };
    
    if (!citas.length) {
      tbC.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-muted)">No hay citas registradas</td></tr>`;
      return;
    }
    
    tbC.innerHTML = citas.map(c => `
      <tr>
        <td>${c.tratamiento_nombre || c.id_tratamiento || '—'}</td>
        <td>${c.odontologo_nombre || c.id_odontologo || '—'}</td>
        <td>${c.fecha || '—'} ${c.hora || ''}</td>
        <td><span class="badge ${colEstado[c.estado] || 'blue'}">${c.estado || 'Pendiente'}</span></td>
      </tr>
    `).join("");
  } catch {
    document.getElementById("tablaCitas").innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-muted)">Error al cargar citas</td></tr>`;
  }
}

// ── Modal Editar Perfil ────────────────────────────────────────────────────
function abrirModalEditar() {
  if (!pacienteActual) {
    toast("❌ No hay perfil para editar", "error");
    return;
  }
  
  document.getElementById("editPacienteId").value = pacienteActual.id_paciente;
  document.getElementById("inNombre").value = pacienteActual.nombre || "";
  document.getElementById("inApellido").value = pacienteActual.apellido || "";
  document.getElementById("inTelefono").value = pacienteActual.telefono || "";
  document.getElementById("inCorreo").value = pacienteActual.correo || "";
  
  document.getElementById("telefonoError").classList.remove('show');
  document.getElementById("inTelefono").classList.remove('input-error');
  
  document.getElementById("btnGuardarPerfil").disabled = false;
  document.getElementById("btnGuardarPerfil").innerHTML = '<span class="material-symbols-outlined">save</span> Guardar';
  document.getElementById("modalEditarPerfil").classList.add("open");
}
window.abrirModalEditar = abrirModalEditar;

function cerrarModalEditar() {
  document.getElementById("modalEditarPerfil").classList.remove("open");
}
window.cerrarModalEditar = cerrarModalEditar;

// ── Guardar Perfil ──────────────────────────────────────────────────────────
async function guardarPerfil() {
  const id = document.getElementById("editPacienteId").value;
  const nombre = document.getElementById("inNombre").value.trim();
  const apellido = document.getElementById("inApellido").value.trim();
  const telefono = document.getElementById("inTelefono").value.trim();
  const btn = document.getElementById("btnGuardarPerfil");

  if (!nombre) {
    toast("👤 Por favor, ingresa tu nombre", "warning");
    document.getElementById("inNombre").focus();
    return;
  }
  if (!apellido) {
    toast("👤 Por favor, ingresa tu apellido", "warning");
    document.getElementById("inApellido").focus();
    return;
  }
  if (!telefono) {
    toast("📱 Por favor, ingresa tu teléfono", "warning");
    document.getElementById("inTelefono").focus();
    return;
  }
  if (!validarTelefono(telefono)) {
    toast("📱 Ingresa un número de teléfono válido", "error");
    document.getElementById("inTelefono").focus();
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined spinner">progress_activity</span> Guardando...`;

  try {
    const data = { 
      nombre, 
      apellido, 
      telefono,
      documento: pacienteActual.documento,
      correo: pacienteActual.correo
    };
    await api("PUT", `/pacientes/${id}`, data);
    
    pacienteActual.nombre = nombre;
    pacienteActual.apellido = apellido;
    pacienteActual.telefono = telefono;
    
    toast("✅ Perfil actualizado correctamente", "success");
    cerrarModalEditar();
    
  } catch (error) {
    console.error("Error al guardar:", error);
    toast(`❌ ${error.message || "Error al guardar"}`, "error");
    btn.disabled = false;
    btn.innerHTML = `<span class="material-symbols-outlined">save</span> Guardar`;
  }
}
window.guardarPerfil = guardarPerfil;

// ── Validación de teléfono en tiempo real ────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // Verificar sesión
  const usuarioActualStr = localStorage.getItem('usuario_actual');
  if (!usuarioActualStr) {
    window.location.href = "login.html";
  }

  // Cargar perfil
  cargarPerfil();

  // Validación teléfono en modal
  document.getElementById('inTelefono')?.addEventListener('input', function() {
    const telefono = this.value.trim();
    const error = document.getElementById('telefonoError');
    if (telefono.length > 0 && !validarTelefono(telefono)) {
      this.classList.add('input-error');
      error.classList.add('show');
    } else {
      this.classList.remove('input-error');
      error.classList.remove('show');
    }
  });

  // Evento guardar perfil
  document.getElementById('btnGuardarPerfil')?.addEventListener('click', guardarPerfil);
});