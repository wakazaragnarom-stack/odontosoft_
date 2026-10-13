"""Administración SaaS: empresas y estado de suscripción. Sin acceso a datos clínicos."""
from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from backend.app import models
from backend.app.core.security import require_roles
from backend.app.db.session import get_db

router = APIRouter(prefix="/superadmin", tags=["SuperAdmin SaaS"], dependencies=[Depends(require_roles("superadmin"))])


class EmpresaCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=200)
    correo_contacto: EmailStr
    telefono: Optional[str] = None
    cuota_mensual: Decimal = Field(ge=0)
    fecha_vencimiento: Optional[date] = None


class EmpresaUpdate(BaseModel):
    correo_contacto: Optional[EmailStr] = None
    telefono: Optional[str] = None
    cuota_mensual: Optional[Decimal] = Field(default=None, ge=0)
    fecha_vencimiento: Optional[date] = None
    fecha_ultimo_pago: Optional[date] = None
    estado_pago: Optional[str] = None
    estado_servicio: Optional[str] = None


def serialize(empresa):
    hoy = date.today()
    vencida = bool(empresa.fecha_vencimiento and empresa.fecha_vencimiento < hoy)
    pago = "vencido" if vencida and empresa.estado_pago != "al_dia" else empresa.estado_pago
    return {
        "id_empresa": empresa.id_empresa,
        "nombre": empresa.nombre,
        "correo_contacto": empresa.correo_contacto,
        "telefono": empresa.telefono,
        "cuota_mensual": float(empresa.cuota_mensual or 0),
        "fecha_vencimiento": empresa.fecha_vencimiento.isoformat() if empresa.fecha_vencimiento else None,
        "fecha_ultimo_pago": empresa.fecha_ultimo_pago.isoformat() if empresa.fecha_ultimo_pago else None,
        "estado_pago": pago,
        "estado_servicio": empresa.estado_servicio,
        "fecha_creacion": empresa.fecha_creacion.isoformat() if empresa.fecha_creacion else None,
    }


@router.get("/empresas")
def listar_empresas(db: Session = Depends(get_db)):
    return [serialize(e) for e in db.query(models.Empresa).order_by(models.Empresa.nombre.asc()).all()]


@router.post("/empresas", status_code=201)
def crear_empresa(data: EmpresaCreate, db: Session = Depends(get_db)):
    email = str(data.correo_contacto).strip().lower()
    empresa = models.Empresa(
        nombre=data.nombre.strip(),
        correo_contacto=email,
        telefono=data.telefono,
        cuota_mensual=data.cuota_mensual,
        fecha_vencimiento=data.fecha_vencimiento,
        estado_pago="pendiente",
        estado_servicio="activo",
    )
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    # Si ya existe el usuario administrador con ese correo, lo asociamos a esta empresa.
    admin = db.query(models.Usuario).filter(models.Usuario.correo == email, models.Usuario.rol.in_(["Administrador", "Admin", "admin", "clinic_admin"])).first()
    if admin:
        admin.id_empresa = empresa.id_empresa
        db.commit()
    return serialize(empresa)


@router.patch("/empresas/{id_empresa}")
def actualizar_empresa(id_empresa: int, data: EmpresaUpdate, db: Session = Depends(get_db)):
    empresa = db.query(models.Empresa).filter(models.Empresa.id_empresa == id_empresa).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    values = data.model_dump(exclude_unset=True)
    allowed_payment = {"al_dia", "pendiente", "vencido"}
    allowed_service = {"activo", "suspendido"}
    if values.get("estado_pago") is not None and values["estado_pago"] not in allowed_payment:
        raise HTTPException(status_code=422, detail="Estado de pago no válido")
    if values.get("estado_servicio") is not None and values["estado_servicio"] not in allowed_service:
        raise HTTPException(status_code=422, detail="Estado de servicio no válido")
    for key, value in values.items():
        setattr(empresa, key, value)
    if values.get("estado_pago") == "al_dia":
        empresa.fecha_ultimo_pago = values.get("fecha_ultimo_pago") or date.today()
        empresa.estado_servicio = "activo"
    if values.get("estado_pago") in {"vencido", "pendiente"}:
        empresa.estado_servicio = "suspendido"
    db.commit()
    db.refresh(empresa)
    return serialize(empresa)
