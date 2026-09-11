# models.py
# ============================================================
# MODELOS COMPLETOS - ODONTOSOFT
# ============================================================

from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Text,
    Date,
    Time,
    Numeric,
    TIMESTAMP,
    Table,
    JSON,
    Boolean,
)
from sqlalchemy.orm import relationship
from database import Base


# ============================================================
# TABLAS PIVOTE
# ============================================================

usuario_paciente = Table(
    "usuario_paciente",
    Base.metadata,

    Column(
        "id_usuario",
        Integer,
        ForeignKey(
            "usuario.id_usuario",
            ondelete="CASCADE"
        ),
        primary_key=True
    ),

    Column(
        "id_paciente",
        Integer,
        ForeignKey(
            "paciente.id_paciente",
            ondelete="CASCADE"
        ),
        primary_key=True
    ),

    extend_existing=True
)


usuario_tratamiento = Table(
    "usuario_tratamiento",
    Base.metadata,

    Column(
        "id_usuario",
        Integer,
        ForeignKey(
            "usuario.id_usuario",
            ondelete="CASCADE"
        ),
        primary_key=True
    ),

    Column(
        "id_tratamiento",
        Integer,
        ForeignKey(
            "tratamiento.id_tratamiento",
            ondelete="CASCADE"
        ),
        primary_key=True
    ),

    extend_existing=True
)


cita_tratamiento = Table(
    "cita_tratamiento",
    Base.metadata,

    Column(
        "id_cita",
        Integer,
        ForeignKey(
            "cita.id_cita",
            ondelete="CASCADE"
        ),
        primary_key=True
    ),

    Column(
        "id_tratamiento",
        Integer,
        ForeignKey(
            "tratamiento.id_tratamiento",
            ondelete="CASCADE"
        ),
        primary_key=True
    ),

    extend_existing=True
)


# ============================================================
# PACIENTE
# ============================================================

class Paciente(Base):

    __tablename__ = "paciente"

    __table_args__ = {
        "extend_existing": True
    }

    id_paciente = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre = Column(
        String(100),
        nullable=False
    )

    apellido = Column(
        String(100),
        nullable=False
    )

    documento = Column(
        String(20),
        unique=True,
        nullable=False
    )

    fecha_nacimiento = Column(
        Date,
        nullable=True
    )

    genero = Column(
        String(20),
        nullable=True
    )

    direccion = Column(
        String(200),
        nullable=True
    )

    telefono = Column(
        String(20),
        nullable=True
    )

    correo = Column(
        String(100),
        nullable=True
    )

    eps = Column(
        String(100),
        nullable=True
    )

    alergias = Column(
        Text,
        nullable=True
    )

    contrasena_plano = Column(
        String(100),
        nullable=True
    )

    usuarios = relationship(
        "Usuario",
        secondary=usuario_paciente,
        back_populates="pacientes"
    )

    historias = relationship(
        "HistoriaClinica",
        back_populates="paciente",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    citas = relationship(
        "Cita",
        back_populates="paciente",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    servicios = relationship(
        "Servicio",
        back_populates="paciente",
        cascade="all, delete-orphan",
        passive_deletes=True
    )


# ============================================================
# USUARIO
# ============================================================

class Usuario(Base):

    __tablename__ = "usuario"

    __table_args__ = {
        "extend_existing": True
    }

    id_usuario = Column(
        Integer,
        primary_key=True,
        index=True
    )

    correo = Column(
        String(100),
        nullable=False,
        unique=True
    )

    contrasena = Column(
        String(255),
        nullable=False
    )

    rol = Column(
        String(30),
        nullable=False,
        default="Paciente"
    )

    estado = Column(
        String(20),
        nullable=False,
        default="Activo"
    )

    # ========================================================
    # DATOS PERSONALES DEL USUARIO
    #
    # Se utilizan principalmente para Administrador.
    # También permiten conservar la información común
    # directamente en la tabla usuario.
    # ========================================================

    nombre = Column(
        String(100),
        nullable=True
    )

    apellido = Column(
        String(100),
        nullable=True
    )

    documento = Column(
        String(20),
        nullable=True
    )

    telefono = Column(
        String(20),
        nullable=True
    )

    # ========================================================
    # RELACIÓN USUARIO - PACIENTE
    # ========================================================

    pacientes = relationship(
        "Paciente",
        secondary=usuario_paciente,
        back_populates="usuarios"
    )

    # ========================================================
    # RELACIÓN USUARIO - TRATAMIENTO
    # ========================================================

    tratamientos = relationship(
        "Tratamiento",
        secondary=usuario_tratamiento,
        back_populates="usuarios"
    )


# ============================================================
# CONSULTORIO
# ============================================================

class Consultorio(Base):

    __tablename__ = "consultorio"

    __table_args__ = {
        "extend_existing": True
    }

    id_consultorio = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre = Column(
        String(100),
        nullable=False
    )

    ubicacion = Column(
        String(150),
        nullable=True
    )

    numero_sala = Column(
        String(20),
        nullable=True
    )

    odontologos = relationship(
        "Odontologo",
        back_populates="consultorio",
        passive_deletes=True
    )

    citas = relationship(
        "Cita",
        back_populates="consultorio",
        passive_deletes=True
    )


# ============================================================
# ODONTÓLOGO
# ============================================================

class Odontologo(Base):

    __tablename__ = "odontologo"

    __table_args__ = {
        "extend_existing": True
    }

    id_odontologo = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre = Column(
        String(100),
        nullable=False
    )

    apellido = Column(
        String(100),
        nullable=False
    )

    documento = Column(
        String(20),
        unique=True,
        nullable=False
    )

    telefono = Column(
        String(20),
        nullable=True
    )

    correo = Column(
        String(100),
        nullable=True
    )

    especialidad = Column(
        String(100),
        nullable=True
    )

    registro_profesional = Column(
        String(100),
        nullable=True
    )

    horario = Column(
        String(200),
        nullable=True
    )

    id_consultorio = Column(
        Integer,
        ForeignKey(
            "consultorio.id_consultorio",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    consultorio = relationship(
        "Consultorio",
        back_populates="odontologos"
    )

    citas = relationship(
        "Cita",
        back_populates="odontologo",
        passive_deletes=True
    )


# ============================================================
# HISTORIA CLÍNICA
# ============================================================

class HistoriaClinica(Base):

    __tablename__ = "historia_clinica"

    __table_args__ = {
        "extend_existing": True
    }

    id_historia = Column(
        Integer,
        primary_key=True,
        index=True
    )

    fecha_apertura = Column(
        Date,
        nullable=False
    )

    antecedentes = Column(
        Text,
        nullable=True
    )

    diagnostico_general = Column(
        Text,
        nullable=True
    )

    observaciones = Column(
        Text,
        nullable=True
    )

    id_paciente = Column(
        Integer,
        ForeignKey(
            "paciente.id_paciente",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    paciente = relationship(
        "Paciente",
        back_populates="historias"
    )


# ============================================================
# ODONTOGRAMA
# ============================================================

class Odontograma(Base):

    __tablename__ = "odontograma"

    __table_args__ = {"extend_existing": True}

    id_odontograma = Column(Integer, primary_key=True, index=True)

    id_paciente = Column(
        Integer,
        ForeignKey("paciente.id_paciente", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    dientes = Column(JSON, nullable=False, default=dict)
    fecha_actualizacion = Column(TIMESTAMP, nullable=False)

    paciente = relationship("Paciente", backref="odontograma", uselist=False)


# ============================================================
# HISTORIA CLÍNICA DETALLADA DEL PACIENTE
# ============================================================

class HistoriaClinicaDetallada(Base):

    __tablename__ = "historia_clinica_detallada"

    __table_args__ = {
        "extend_existing": True
    }

    id_historia_detallada = Column(Integer, primary_key=True, index=True)

    id_paciente = Column(
        Integer,
        ForeignKey("paciente.id_paciente", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    datos_clinicos = Column(JSON, nullable=False, default=dict)

    fecha_actualizacion = Column(
        TIMESTAMP,
        nullable=False
    )

    paciente = relationship("Paciente", backref="historia_detallada", uselist=False)



# ============================================================
# CITA
# ============================================================

class Cita(Base):

    __tablename__ = "cita"

    __table_args__ = {
        "extend_existing": True
    }

    id_cita = Column(
        Integer,
        primary_key=True,
        index=True
    )

    fecha = Column(
        Date,
        nullable=False
    )

    hora = Column(
        Time,
        nullable=False
    )

    estado = Column(
        String(30),
        nullable=True,
        default="Pendiente"
    )

    motivo_consulta = Column(
        Text,
        nullable=True
    )

    observaciones = Column(
        Text,
        nullable=True
    )

    id_paciente = Column(
        Integer,
        ForeignKey(
            "paciente.id_paciente",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    id_odontologo = Column(
        Integer,
        ForeignKey(
            "odontologo.id_odontologo",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    id_consultorio = Column(
        Integer,
        ForeignKey(
            "consultorio.id_consultorio",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    paciente = relationship(
        "Paciente",
        back_populates="citas"
    )

    odontologo = relationship(
        "Odontologo",
        back_populates="citas"
    )

    consultorio = relationship(
        "Consultorio",
        back_populates="citas"
    )

    tratamientos = relationship(
        "Tratamiento",
        secondary=cita_tratamiento,
        back_populates="citas"
    )

    recordatorios = relationship(
        "Recordatorio",
        back_populates="cita",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    pagos = relationship(
        "Pago",
        back_populates="cita",
        cascade="all, delete-orphan",
        passive_deletes=True
    )


# ============================================================
# TRATAMIENTO
# ============================================================

class Tratamiento(Base):

    __tablename__ = "tratamiento"

    __table_args__ = {
        "extend_existing": True
    }

    id_tratamiento = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre = Column(
        String(100),
        nullable=False
    )

    descripcion = Column(
        Text,
        nullable=True
    )

    costo = Column(
        Numeric(10, 2),
        nullable=True
    )

    duracion_estimada = Column(
        String(100),
        nullable=True
    )

    citas = relationship(
        "Cita",
        secondary=cita_tratamiento,
        back_populates="tratamientos"
    )

    usuarios = relationship(
        "Usuario",
        secondary=usuario_tratamiento,
        back_populates="tratamientos"
    )


# ============================================================
# RECORDATORIO
# ============================================================

class Recordatorio(Base):

    __tablename__ = "recordatorio"

    __table_args__ = {
        "extend_existing": True
    }

    id_recordatorio = Column(
        Integer,
        primary_key=True,
        index=True
    )

    tipo = Column(
        String(50),
        nullable=True
    )

    fecha_envio = Column(
        TIMESTAMP,
        nullable=True
    )

    estado = Column(
        String(30),
        nullable=True,
        default="Pendiente"
    )

    id_cita = Column(
        Integer,
        ForeignKey(
            "cita.id_cita",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    cita = relationship(
        "Cita",
        back_populates="recordatorios"
    )


# ============================================================
# PAGO
# ============================================================

class Pago(Base):

    __tablename__ = "pago"

    __table_args__ = {
        "extend_existing": True
    }

    id_pago = Column(
        Integer,
        primary_key=True,
        index=True
    )

    fecha_pago = Column(
        Date,
        nullable=False
    )

    monto = Column(
        Numeric(10, 2),
        nullable=False
    )

    metodo_pago = Column(
        String(50),
        nullable=True
    )

    estado_pago = Column(
        String(30),
        nullable=True,
        default="Pendiente"
    )

    referencia = Column(
        String(100),
        nullable=True
    )

    id_cita = Column(
        Integer,
        ForeignKey(
            "cita.id_cita",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    cita = relationship(
        "Cita",
        back_populates="pagos"
    )

    factura = relationship(
        "Factura",
        back_populates="pago",
        uselist=False,
        cascade="all, delete-orphan"
    )


# ============================================================
# FACTURA
# ============================================================

class Factura(Base):

    __tablename__ = "factura"

    __table_args__ = {
        "extend_existing": True
    }

    id_factura = Column(
        Integer,
        primary_key=True,
        index=True
    )

    fecha_emision = Column(
        Date,
        nullable=False
    )

    subtotal = Column(
        Numeric(10, 2),
        nullable=True
    )

    impuesto = Column(
        Numeric(10, 2),
        nullable=True
    )

    total = Column(
        Numeric(10, 2),
        nullable=True
    )

    id_pago = Column(
        Integer,
        ForeignKey(
            "pago.id_pago",
            ondelete="CASCADE"
        ),
        unique=True,
        nullable=False
    )

    pago = relationship(
        "Pago",
        back_populates="factura"
    )


# ============================================================
# ROL
# ============================================================

class Rol(Base):

    __tablename__ = "rol"

    __table_args__ = {
        "extend_existing": True
    }

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre = Column(
        String(100),
        nullable=False,
        unique=True
    )

    descripcion = Column(
        Text,
        nullable=True
    )

    permisos = Column(
        String(50),
        nullable=True,
        default="READ ONLY"
    )


# ============================================================
# PROVEEDOR
# ============================================================

class Proveedor(Base):

    __tablename__ = "proveedor"

    __table_args__ = {
        "extend_existing": True
    }

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    empresa = Column(
        String(200),
        nullable=False
    )

    contacto_asesor = Column(
        String(100),
        nullable=True
    )

    telefono = Column(
        String(20),
        nullable=True
    )

    suministro = Column(
        String(200),
        nullable=True
    )

    estado_convenio = Column(
        String(30),
        nullable=True,
        default="Vigente"
    )


# ============================================================
# SERVICIO
# ============================================================

class Servicio(Base):

    __tablename__ = "servicio"

    __table_args__ = {
        "extend_existing": True
    }

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    paciente_id = Column(
        Integer,
        ForeignKey(
            "paciente.id_paciente",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    tratamiento_nombre = Column(
        String(100),
        nullable=False
    )

    odontologo_nombre = Column(
        String(100),
        nullable=True
    )

    proxima_cita = Column(
        String(50),
        nullable=True
    )

    estado_cuenta = Column(
        String(30),
        nullable=True,
        default="Pendiente"
    )

    paciente = relationship(
        "Paciente",
        back_populates="servicios"
    )

# ============================================================
# RECUPERAR CONTRASEÑA SISABE PAPI
class PasswordResetToken(Base):

    __tablename__ = "password_reset_token"

    __table_args__ = {
        "extend_existing": True
    }

    id_token = Column(
        Integer,
        primary_key=True,
        index=True
    )

    token = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    id_usuario = Column(
        Integer,
        ForeignKey(
            "usuario.id_usuario",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    fecha_creacion = Column(
        TIMESTAMP,
        nullable=False
    )

    fecha_expiracion = Column(
        TIMESTAMP,
        nullable=False
    )

    usado = Column(
        Boolean,
        nullable=False,
        default=False
    )

    usuario = relationship(
        "Usuario",
        backref="reset_tokens"
    )
