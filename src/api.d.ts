export interface AuthLoginResponse {
  id_usuario: number;
  correo: string;
  rol: string;
  estado: string;
  mensaje: string;
  access_token: string;
  token_type: string;
  expires_at: string;
}

export function getAccessToken(): string | null;
export function setAccessToken(token: string): void;
export function clearAccessToken(): void;
export function login(data: { correo: string; contrasena: string }): Promise<AuthLoginResponse>;
export function getCurrentUser(): Promise<Record<string, unknown>>;
export function solicitarReset(correo: string): Promise<Record<string, unknown>>;
export function registroUsuario(data: Record<string, unknown>): Promise<Record<string, unknown>>;
export function logout(): void;

export function getUsuarios(): Promise<any[]>;
export function getUsuario(id: number | string): Promise<any>;
export function getUsuarioByCorreo(correo: string): Promise<any>;
export function createUsuario(data: any): Promise<any>;
export function updateUsuario(id: number | string, data: any): Promise<any>;
export function updateEstadoUsuario(id: number | string, estado: string): Promise<any>;
export function deleteUsuario(id: number | string): Promise<any>;

export function getPacientes(): Promise<any[]>;
export function getPaciente(id: number | string): Promise<any>;
export function createPaciente(data: any): Promise<any>;
export function updatePaciente(id: number | string, data: any): Promise<any>;
export function deletePaciente(id: number | string): Promise<any>;

export function getOdontologos(): Promise<any[]>;
export function getOdontologo(id: number | string): Promise<any>;
export function createOdontologo(data: any): Promise<any>;
export function updateOdontologo(id: number | string, data: any): Promise<any>;
export function deleteOdontologo(id: number | string): Promise<any>;

export function getConsultorios(): Promise<any[]>;
export function getConsultorio(id: number | string): Promise<any>;
export function createConsultorio(data: any): Promise<any>;
export function updateConsultorio(id: number | string, data: any): Promise<any>;
export function deleteConsultorio(id: number | string): Promise<any>;

export function getHistorias(): Promise<any[]>;
export function getHistoria(id: number | string): Promise<any>;
export function getHistoriasPac(pid: number | string): Promise<any[]>;
export function createHistoria(data: any): Promise<any>;
export function updateHistoria(id: number | string, data: any): Promise<any>;
export function deleteHistoria(id: number | string): Promise<any>;
export function getHistoriaDetallada(pid: number | string): Promise<any>;
export function updateHistoriaDetallada(pid: number | string, data: any): Promise<any>;
export function getOdontograma(pid: number | string): Promise<any>;
export function updateOdontograma(pid: number | string, data: any): Promise<any>;

export function getCitas(): Promise<any[]>;
export function getCita(id: number | string): Promise<any>;
export function getCitasPaciente(pid: number | string): Promise<any[]>;
export function getCitasOdont(oid: number | string): Promise<any[]>;
export function createCita(data: any): Promise<any>;
export function updateCita(id: number | string, data: any): Promise<any>;
export function updateEstadoCita(id: number | string, estado: string): Promise<any>;
export function deleteCita(id: number | string): Promise<any>;

export function getTratamientos(): Promise<any[]>;
export function getTratamiento(id: number | string): Promise<any>;
export function createTratamiento(data: any): Promise<any>;
export function updateTratamiento(id: number | string, data: any): Promise<any>;
export function deleteTratamiento(id: number | string): Promise<any>;

export function getRecordatorios(): Promise<any[]>;
export function getRecordatoriosCita(cid: number | string): Promise<any[]>;
export function createRecordatorio(data: any): Promise<any>;
export function updateRecordatorio(id: number | string, data: any): Promise<any>;
export function deleteRecordatorio(id: number | string): Promise<any>;

export function getPagos(): Promise<any[]>;
export function getPagosCita(cid: number | string): Promise<any[]>;
export function createPago(data: any): Promise<any>;
export function updatePago(id: number | string, data: any): Promise<any>;
export function deletePago(id: number | string): Promise<any>;

export function getFacturas(): Promise<any[]>;
export function getFactura(id: number | string): Promise<any>;
export function createFactura(data: any): Promise<any>;
export function updateFactura(id: number | string, data: any): Promise<any>;
export function deleteFactura(id: number | string): Promise<any>;

export function getRoles(): Promise<any[]>;
export function getRol(id: number | string): Promise<any>;
export function createRol(data: any): Promise<any>;
export function updateRol(id: number | string, data: any): Promise<any>;
export function deleteRol(id: number | string): Promise<any>;

export function getProveedores(): Promise<any[]>;
export function getProveedor(id: number | string): Promise<any>;
export function createProveedor(data: any): Promise<any>;
export function updateProveedor(id: number | string, data: any): Promise<any>;
export function deleteProveedor(id: number | string): Promise<any>;

export function getServicios(): Promise<any[]>;
export function getServiciosPaciente(pid: number | string): Promise<any[]>;
export function createServicio(data: any): Promise<any>;
export function updateServicio(id: number | string, data: any): Promise<any>;
export function deleteServicio(id: number | string): Promise<any>;
