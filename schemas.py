# schemas.py
# ============================================================
# SCHEMAS COMPLETOS - ODONTOSOFT
# ============================================================

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import date, time, datetime
from decimal import Decimal


# ============================================================
# USUARIO
# ============================================================

class UsuarioBase(BaseModel):
    correo: EmailStr
    rol: str = "Paciente"
    estado: str = "Activo"

    # Datos personales del usuario
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    documento: Optional[str] = None
    telefono: Optional[str] = None


class UsuarioCreate(UsuarioBase):
    contrasena: str = Field(
        ...,
        min_length=6,
        description="Contraseña de mínimo 6 caracteres"
    )


class UsuarioUpdate(BaseModel):
    """
    Schema para actualizar usuario.
    Todos los campos son opcionales.
    """

    correo: Optional[EmailStr] = None

    contrasena: Optional[str] = Field(
        None,
        min_length=6,
        description="Contraseña de mínimo 6 caracteres"
    )

    rol: Optional[str] = None
    estado: Optional[str] = None

    # Datos personales
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    documento: Optional[str] = None
    telefono: Optional[str] = None


class UsuarioOut(UsuarioBase):
    id_usuario: int

    fecha_registro: Optional[datetime] = None
    ultimo_acceso: Optional[datetime] = None

    contrasena_plano: Optional[str] = None

    # Contraseña almacenada
    contrasena: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True
    )

# ============================================================
# PACIENTE
# ============================================================

class PacienteBase(BaseModel):
    nombre: str = Field(..., min_length=1)
    apellido: str = Field(..., min_length=1)
    documento: str = Field(..., min_length=1)

    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None

    correo: Optional[EmailStr] = None

    eps: Optional[str] = None
    alergias: Optional[str] = None

class PacienteCreate(PacienteBase):
    # Se utiliza para registrar contraseña cuando
    # el paciente se crea desde el sistema.
    contrasena_plano: Optional[str] = Field(
        None,
        min_length=6
    )


class PacienteUpdate(BaseModel):
    """
    Schema para actualizar paciente.
    Todos los campos son opcionales.
    """

    nombre: Optional[str] = Field(None, min_length=1)
    apellido: Optional[str] = Field(None, min_length=1)
    documento: Optional[str] = Field(None, min_length=1)

    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None

    correo: Optional[EmailStr] = None

    eps: Optional[str] = None
    alergias: Optional[str] = None

    # Contraseña utilizada por el panel
    contrasena_plano: Optional[str] = Field(
        None,
        min_length=6
    )


class PacienteOut(PacienteBase):
    id_paciente: int

    contrasena_plano: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# LOGIN
# ============================================================

class LoginRequest(BaseModel):
    """
    Datos necesarios para iniciar sesión.
    """

    correo: EmailStr
    contrasena: str


class LoginResponse(BaseModel):
    """
    Respuesta del login.
    """

    id_usuario: int
    correo: str
    rol: str
    estado: str
    mensaje: str


# ============================================================
# REGISTRO COMPLETO
# ============================================================

class RegistroRequest(BaseModel):
    """
    Registro completo de un usuario.

    Dependiendo del rol puede crear:
    - Paciente
    - Odontólogo
    - Administrador
    """

    correo: EmailStr

    contrasena: str = Field(
        ...,
        min_length=6
    )

    rol: str = "Paciente"
    estado: str = "Activo"

    # --------------------------------------------------------
    # Datos comunes
    # --------------------------------------------------------

    nombre: Optional[str] = None
    apellido: Optional[str] = None
    documento: Optional[str] = None
    telefono: Optional[str] = None

    # --------------------------------------------------------
    # Datos del paciente
    # --------------------------------------------------------

    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    direccion: Optional[str] = None
    eps: Optional[str] = None
    alergias: Optional[str] = None

    # --------------------------------------------------------
    # Datos del odontólogo
    # --------------------------------------------------------

    especialidad: Optional[str] = None

    # Consultorio del odontólogo
    id_consultorio: Optional[int] = None


class RegistroResponse(BaseModel):
    """
    Respuesta del registro completo.
    """

    mensaje: str

    id_usuario: int

    id_paciente: Optional[int] = None
    id_odontologo: Optional[int] = None

    correo: str
    rol: str


# ============================================================
# CONSULTORIO
# ============================================================

class ConsultorioBase(BaseModel):
    nombre: str = Field(..., min_length=1)

    ubicacion: Optional[str] = None
    numero_sala: Optional[str] = None


class ConsultorioCreate(ConsultorioBase):
    pass


class ConsultorioUpdate(BaseModel):
    """
    Actualización de consultorio.
    """

    nombre: Optional[str] = Field(None, min_length=1)
    ubicacion: Optional[str] = None
    numero_sala: Optional[str] = None


class ConsultorioOut(ConsultorioBase):
    id_consultorio: int

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# ODONTOLOGO
# ============================================================

class OdontologoBase(BaseModel):
    nombre: str = Field(..., min_length=1)
    apellido: str = Field(..., min_length=1)
    documento: str = Field(..., min_length=1)

    telefono: Optional[str] = None
    correo: Optional[EmailStr] = None
    especialidad: Optional[str] = None

    id_consultorio: int


class OdontologoCreate(OdontologoBase):
    pass


class OdontologoUpdate(BaseModel):
    """
    Actualización de odontólogo.
    Todos los campos son opcionales.
    """

    nombre: Optional[str] = Field(None, min_length=1)
    apellido: Optional[str] = Field(None, min_length=1)
    documento: Optional[str] = Field(None, min_length=1)

    telefono: Optional[str] = None
    correo: Optional[EmailStr] = None
    especialidad: Optional[str] = None

    registro_profesional: Optional[str] = None
    horario: Optional[str] = None

    id_consultorio: Optional[int] = None


class OdontologoOut(OdontologoBase):
    id_odontologo: int

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# HISTORIA CLÍNICA
# ============================================================

class HistoriaClinicaBase(BaseModel):
    fecha_apertura: date

    antecedentes: Optional[str] = None
    diagnostico_general: Optional[str] = None
    observaciones: Optional[str] = None

    id_paciente: int


class HistoriaClinicaCreate(HistoriaClinicaBase):
    pass


class HistoriaClinicaUpdate(BaseModel):
    """
    Actualización de historia clínica.
    """

    fecha_apertura: Optional[date] = None
    antecedentes: Optional[str] = None
    diagnostico_general: Optional[str] = None
    observaciones: Optional[str] = None

    id_paciente: Optional[int] = None


class HistoriaClinicaOut(HistoriaClinicaBase):
    id_historia: int

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# TRATAMIENTO
# ============================================================

class TratamientoBase(BaseModel):
    nombre: str = Field(..., min_length=1)

    descripcion: Optional[str] = None

    costo: Optional[Decimal] = Field(
        None,
        gt=0
    )

    duracion_estimada: Optional[str] = None


class TratamientoCreate(TratamientoBase):
    pass


class TratamientoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1)

    descripcion: Optional[str] = None

    costo: Optional[Decimal] = Field(
        None,
        gt=0
    )

    duracion_estimada: Optional[str] = None


class TratamientoOut(TratamientoBase):
    id_tratamiento: int

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# CITA
# ============================================================

class CitaBase(BaseModel):
    fecha: date
    hora: time

    estado: Optional[str] = "Pendiente"

    motivo_consulta: Optional[str] = None
    observaciones: Optional[str] = None

    id_paciente: int
    id_odontologo: int
    id_consultorio: int


class CitaCreate(CitaBase):
    pass


class CitaUpdate(BaseModel):
    """
    Actualización de cita.
    Todos los campos son opcionales.
    """

    fecha: Optional[date] = None
    hora: Optional[time] = None

    estado: Optional[str] = None

    motivo_consulta: Optional[str] = None
    observaciones: Optional[str] = None

    id_paciente: Optional[int] = None
    id_odontologo: Optional[int] = None
    id_consultorio: Optional[int] = None


# ============================================================
# ODONTÓLOGO PARA MOSTRAR EN UNA CITA
# ============================================================

class OdontologoCitaOut(BaseModel):

    id_odontologo: int

    nombre: str

    apellido: str

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# RESPUESTA DE CITA
# ============================================================

class CitaOut(CitaBase):

    id_cita: int

    # --------------------------------------------------------
    # Odontólogo asignado
    # --------------------------------------------------------

    odontologo: Optional[OdontologoCitaOut] = None

    # --------------------------------------------------------
    # Tratamientos asignados
    #
    # Una cita puede tener uno o varios tratamientos.
    # --------------------------------------------------------

    tratamientos: List[TratamientoOut] = Field(
        default_factory=list
    )

    model_config = ConfigDict(
        from_attributes=True
    )

# ============================================================
# RECORDATORIO
# ============================================================

class RecordatorioBase(BaseModel):
    tipo: Optional[str] = None

    fecha_envio: Optional[datetime] = None

    estado: Optional[str] = "Pendiente"

    id_cita: int


class RecordatorioCreate(RecordatorioBase):
    pass


class RecordatorioUpdate(BaseModel):
    """
    Actualización de recordatorio.
    """

    tipo: Optional[str] = None
    fecha_envio: Optional[datetime] = None
    estado: Optional[str] = None
    id_cita: Optional[int] = None


class RecordatorioOut(RecordatorioBase):
    id_recordatorio: int

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# PAGO
# ============================================================

class PagoBase(BaseModel):
    fecha_pago: date

    monto: Decimal = Field(
        ...,
        gt=0
    )

    metodo_pago: Optional[str] = None

    estado_pago: Optional[str] = "Pendiente"

    referencia: Optional[str] = None

    id_cita: int


class PagoCreate(PagoBase):
    pass


class PagoUpdate(BaseModel):
    """
    Actualización de pago.
    """

    fecha_pago: Optional[date] = None

    monto: Optional[Decimal] = Field(
        None,
        gt=0
    )

    metodo_pago: Optional[str] = None
    estado_pago: Optional[str] = None
    referencia: Optional[str] = None

    id_cita: Optional[int] = None


class PagoOut(PagoBase):
    id_pago: int

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# FACTURA
# ============================================================

class FacturaBase(BaseModel):
    fecha_emision: date

    subtotal: Optional[Decimal] = Field(
        None,
        ge=0
    )

    impuesto: Optional[Decimal] = Field(
        None,
        ge=0
    )

    total: Optional[Decimal] = Field(
        None,
        ge=0
    )

    id_pago: int


class FacturaCreate(FacturaBase):
    pass


class FacturaUpdate(BaseModel):
    """
    Actualización de factura.
    """

    fecha_emision: Optional[date] = None

    subtotal: Optional[Decimal] = Field(
        None,
        ge=0
    )

    impuesto: Optional[Decimal] = Field(
        None,
        ge=0
    )

    total: Optional[Decimal] = Field(
        None,
        ge=0
    )

    id_pago: Optional[int] = None


class FacturaOut(FacturaBase):
    id_factura: int

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# ROL
# ============================================================

class RolBase(BaseModel):
    nombre: str = Field(..., min_length=1)

    descripcion: Optional[str] = None

    permisos: Optional[str] = "READ ONLY"


class RolCreate(RolBase):
    pass


class RolUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1)

    descripcion: Optional[str] = None

    permisos: Optional[str] = None


class RolOut(RolBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# PROVEEDOR
# ============================================================

class ProveedorBase(BaseModel):
    empresa: str = Field(..., min_length=1)

    contacto_asesor: Optional[str] = None
    telefono: Optional[str] = None
    suministro: Optional[str] = None

    estado_convenio: Optional[str] = "Vigente"


class ProveedorCreate(ProveedorBase):
    pass


class ProveedorUpdate(BaseModel):
    empresa: Optional[str] = Field(None, min_length=1)

    contacto_asesor: Optional[str] = None
    telefono: Optional[str] = None
    suministro: Optional[str] = None
    estado_convenio: Optional[str] = None


class ProveedorOut(ProveedorBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# SERVICIO
# ============================================================

class ServicioBase(BaseModel):
    paciente_id: int

    tratamiento_nombre: str = Field(
        ...,
        min_length=1
    )

    odontologo_nombre: Optional[str] = None

    proxima_cita: Optional[str] = None

    estado_cuenta: Optional[str] = "Pendiente"


class ServicioCreate(ServicioBase):
    pass


class ServicioUpdate(BaseModel):
    paciente_id: Optional[int] = None

    tratamiento_nombre: Optional[str] = Field(
        None,
        min_length=1
    )

    odontologo_nombre: Optional[str] = None
    proxima_cita: Optional[str] = None
    estado_cuenta: Optional[str] = None


class ServicioOut(ServicioBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# RESOLVER REFERENCIAS ADELANTADAS
# ============================================================

CitaOut.model_rebuild()

# ============================================================
# HISTORIA CLÍNICA DETALLADA
# ============================================================

class HistoriaClinicaDetalladaBase(BaseModel):
    id_paciente: int
    datos_clinicos: dict = {}


class HistoriaClinicaDetalladaCreate(HistoriaClinicaDetalladaBase):
    pass


class HistoriaClinicaDetalladaOut(HistoriaClinicaDetalladaBase):
    id_historia_detallada: int
    fecha_actualizacion: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# ODONTOGRAMA
# ============================================================

class OdontogramaBase(BaseModel):
    id_paciente: int
    dientes: dict = {}

class OdontogramaCreate(OdontogramaBase):
    pass

class OdontogramaOut(OdontogramaBase):
    id_odontograma: int
    fecha_actualizacion: datetime
    model_config = ConfigDict(from_attributes=True)


# ============================================================

#recuperarcontraseña

class SolicitarResetRequest(BaseModel):
    """Datos para solicitar el restablecimiento de contraseña."""
    correo: EmailStr


class ResetPasswordRequest(BaseModel):
    """Datos para confirmar el restablecimiento con el token recibido."""
    token: str
    nueva_contrasena: str = Field(
        ...,
        min_length=6,
        description="Contraseña de mínimo 6 caracteres"
    )


class MensajeResponse(BaseModel):
    """Respuesta genérica con un mensaje informativo."""
    mensaje: str