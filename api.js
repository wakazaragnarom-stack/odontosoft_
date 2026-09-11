// ── Configuración base ────────────────────────────────────────────────────────
const API_BASE = "http://127.0.0.1:8000";

async function request(method, path, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

// ── AUTH (Autenticación) ──────────────────────────────────────────────────────
export const login = (data) => request("POST", "/auth/login", data);

// ── Usuarios ──────────────────────────────────────────────────────────────────
export const getUsuarios      = ()           => request("GET",    "/usuarios");
export const getUsuario       = (id)         => request("GET",    `/usuarios/${id}`);
export const getUsuarioByCorreo = (correo)   => request("GET",    `/usuarios/correo/${correo}`);
export const createUsuario    = (data)       => request("POST",   "/usuarios", data);
export const updateUsuario    = (id, data)   => request("PUT",    `/usuarios/${id}`, data);
export const updateEstadoUsuario = (id, estado) => request("PATCH", `/usuarios/${id}/estado`, { estado });
export const deleteUsuario    = (id)         => request("DELETE", `/usuarios/${id}`);
export const registroUsuario  = (data)       => request("POST",   "/usuarios/registro", data);

// ── Pacientes ─────────────────────────────────────────────────────────────────
export const getPacientes     = ()           => request("GET",    "/pacientes");
export const getPaciente      = (id)         => request("GET",    `/pacientes/${id}`);
export const createPaciente   = (data)       => request("POST",   "/pacientes", data);
export const updatePaciente   = (id, data)   => request("PUT",    `/pacientes/${id}`, data);
export const deletePaciente   = (id)         => request("DELETE", `/pacientes/${id}`);

// ── Odontólogos ──────────────────────────────────────────────────────────────
export const getOdontologos   = ()           => request("GET",    "/odontologos");
export const getOdontologo    = (id)         => request("GET",    `/odontologos/${id}`);
export const createOdontologo = (data)       => request("POST",   "/odontologos", data);
export const updateOdontologo = (id, data)   => request("PUT",    `/odontologos/${id}`, data);
export const deleteOdontologo = (id)         => request("DELETE", `/odontologos/${id}`);

// ── Consultorios ─────────────────────────────────────────────────────────────
export const getConsultorios  = ()           => request("GET",    "/consultorios");
export const getConsultorio   = (id)         => request("GET",    `/consultorios/${id}`);
export const createConsultorio= (data)       => request("POST",   "/consultorios", data);
export const updateConsultorio= (id, data)   => request("PUT",    `/consultorios/${id}`, data);
export const deleteConsultorio= (id)         => request("DELETE", `/consultorios/${id}`);

// ── Historias Clínicas ──────────────────────────────────────────────────────
export const getHistorias     = ()           => request("GET",    "/historias-clinicas");
export const getHistoria      = (id)         => request("GET",    `/historias-clinicas/${id}`);
export const getHistoriasPac  = (pid)        => request("GET",    `/historias-clinicas/paciente/${pid}`);
export const createHistoria   = (data)       => request("POST",   "/historias-clinicas", data);
export const updateHistoria   = (id, data)   => request("PUT",    `/historias-clinicas/${id}`, data);
export const deleteHistoria   = (id)         => request("DELETE", `/historias-clinicas/${id}`);

// ── Citas ─────────────────────────────────────────────────────────────────────
export const getCitas         = ()           => request("GET",    "/citas");
export const getCita          = (id)         => request("GET",    `/citas/${id}`);
export const getCitasPaciente = (pid)        => request("GET",    `/citas/paciente/${pid}`);
export const getCitasOdont    = (oid)        => request("GET",    `/citas/odontologo/${oid}`);
export const createCita       = (data)       => request("POST",   "/citas", data);
export const updateCita       = (id, data)   => request("PUT",    `/citas/${id}`, data);
export const updateEstadoCita = (id, estado) => request("PATCH",  `/citas/${id}/estado`, { estado });
export const deleteCita       = (id)         => request("DELETE", `/citas/${id}`);

// ── Tratamientos ──────────────────────────────────────────────────────────────
export const getTratamientos  = ()           => request("GET",    "/tratamientos");
export const getTratamiento   = (id)         => request("GET",    `/tratamientos/${id}`);
export const createTratamiento= (data)       => request("POST",   "/tratamientos", data);
export const updateTratamiento= (id, data)   => request("PUT",    `/tratamientos/${id}`, data);
export const deleteTratamiento= (id)         => request("DELETE", `/tratamientos/${id}`);

// ── Recordatorios ────────────────────────────────────────────────────────────
export const getRecordatorios = ()           => request("GET",    "/recordatorios");
export const getRecordatoriosCita = (cid)    => request("GET",    `/recordatorios/cita/${cid}`);
export const createRecordatorio= (data)      => request("POST",   "/recordatorios", data);
export const updateRecordatorio= (id, data)  => request("PUT",    `/recordatorios/${id}`, data);
export const deleteRecordatorio= (id)        => request("DELETE", `/recordatorios/${id}`);

// ── Pagos ─────────────────────────────────────────────────────────────────────
export const getPagos         = ()           => request("GET",    "/pagos");
export const getPagosCita     = (cid)        => request("GET",    `/pagos/cita/${cid}`);
export const createPago       = (data)       => request("POST",   "/pagos", data);
export const updatePago       = (id, data)   => request("PUT",    `/pagos/${id}`, data);
export const deletePago       = (id)         => request("DELETE", `/pagos/${id}`);

// ── Facturas ──────────────────────────────────────────────────────────────────
export const getFacturas      = ()           => request("GET",    "/facturas");
export const getFactura       = (id)         => request("GET",    `/facturas/${id}`);
export const createFactura    = (data)       => request("POST",   "/facturas", data);
export const updateFactura    = (id, data)   => request("PUT",    `/facturas/${id}`, data);
export const deleteFactura    = (id)         => request("DELETE", `/facturas/${id}`);

// ── Roles ────────────────────────────────────────────────────────────────────
export const getRoles         = ()           => request("GET",    "/roles");
export const getRol           = (id)         => request("GET",    `/roles/${id}`);
export const createRol        = (data)       => request("POST",   "/roles", data);
export const updateRol        = (id, data)   => request("PUT",    `/roles/${id}`, data);
export const deleteRol        = (id)         => request("DELETE", `/roles/${id}`);

// ── Proveedores ──────────────────────────────────────────────────────────────
export const getProveedores   = ()           => request("GET",    "/proveedores");
export const getProveedor     = (id)         => request("GET",    `/proveedores/${id}`);
export const createProveedor  = (data)       => request("POST",   "/proveedores", data);
export const updateProveedor  = (id, data)   => request("PUT",    `/proveedores/${id}`, data);
export const deleteProveedor  = (id)         => request("DELETE", `/proveedores/${id}`);

// ── Servicios (para panel_cliente) ──────────────────────────────────────────
export const getServicios     = ()           => request("GET",    "/servicios");
export const getServiciosPaciente = (pid)    => request("GET",    `/servicios/paciente/${pid}`);
export const createServicio   = (data)       => request("POST",   "/servicios", data);
export const updateServicio   = (id, data)   => request("PUT",    `/servicios/${id}`, data);
export const deleteServicio   = (id)         => request("DELETE", `/servicios/${id}`);