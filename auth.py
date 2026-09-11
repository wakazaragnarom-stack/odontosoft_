"""Autenticación contra la tabla Usuario existente de PostgreSQL."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import create_access_token, normalize_role
from utils import generar_documento_unico, hash_password, needs_password_rehash, validar_correo, verify_password

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=schemas.LoginResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    email = str(data.correo).strip().lower()
    usuario = db.query(models.Usuario).filter(models.Usuario.correo == email).first()

    if not usuario or not verify_password(data.contrasena, usuario.contrasena):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if usuario.estado != "Activo":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="La cuenta no está activa")

    if needs_password_rehash(usuario.contrasena):
        usuario.contrasena = hash_password(data.contrasena)
        db.commit()

    token, expires_at = create_access_token(
        user_id=usuario.id_usuario,
        email=usuario.correo,
        role=usuario.rol,
    )

    return {
        "id_usuario": usuario.id_usuario,
        "correo": usuario.correo,
        "rol": normalize_role(usuario.rol),
        "estado": usuario.estado,
        "mensaje": "Login exitoso",
        "access_token": token,
        "token_type": "bearer",
        "expires_at": int(expires_at.timestamp()),
    }


@router.post("/registro", response_model=schemas.RegistroResponse, status_code=status.HTTP_201_CREATED)
def registro_usuario(data: schemas.RegistroRequest, db: Session = Depends(get_db)):
    """Registro público de paciente; nunca permite autoasignar roles privilegiados."""
    email = str(data.correo).strip().lower()
    if not validar_correo(email):
        raise HTTPException(status_code=400, detail="Correo electrónico no válido")
    if len(data.contrasena) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    if db.query(models.Usuario).filter(models.Usuario.correo == email).first():
        raise HTTPException(status_code=409, detail="El correo electrónico ya está registrado")

    try:
        usuario = models.Usuario(
            correo=email,
            contrasena=hash_password(data.contrasena),
            rol="Paciente",
            estado="Activo",
            nombre=(data.nombre or "").strip() or None,
            apellido=(data.apellido or "").strip() or None,
            documento=(data.documento or "").strip() or None,
            telefono=(data.telefono or "").strip() or None,
        )
        db.add(usuario)
        db.flush()

        documento = (data.documento or "").strip() or generar_documento_unico(db)
        paciente = models.Paciente(
            nombre=(data.nombre or "Paciente").strip(),
            apellido=(data.apellido or "").strip(),
            documento=documento,
            telefono=(data.telefono or "").strip() or None,
            correo=email,
            fecha_nacimiento=data.fecha_nacimiento,
            genero=data.genero,
            direccion=data.direccion,
            eps=data.eps,
            alergias=data.alergias,
        )
        db.add(paciente)
        db.flush()

        db.execute(models.usuario_paciente.insert().values(
            id_usuario=usuario.id_usuario,
            id_paciente=paciente.id_paciente,
        ))
        db.commit()

        return {
            "mensaje": "Usuario y paciente registrados exitosamente",
            "id_usuario": usuario.id_usuario,
            "id_paciente": paciente.id_paciente,
            "id_odontologo": None,
            "correo": usuario.correo,
            "rol": "Paciente",
        }
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="No fue posible completar el registro") from exc
