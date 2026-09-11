"""Seguridad de autenticación y autorización para OdontoSoft.

PostgreSQL es la fuente de verdad. Este módulo gestiona identidad, sesión y
controles de acceso a recursos usando exclusivamente las relaciones existentes.
"""

import os
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request, status, Depends
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from database import SessionLocal
import models

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_SECRET = os.getenv("JWT_SECRET")
ACCESS_TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES", "60"))
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))

if not JWT_SECRET:
    if os.getenv("APP_ENV", "development").lower() == "production":
        raise RuntimeError("JWT_SECRET debe estar configurado en producción")
    JWT_SECRET = "odontosoft-dev-only-change-this-secret"

PUBLIC_PATHS = {
    "/", "/health", "/info", "/docs", "/redoc", "/openapi.json",
    "/auth/login", "/auth/registro", "/auth/solicitar-reset", "/auth/reset-password",
}

MODULE_ROLES = {
    "/usuarios": {"superadmin", "clinic_admin"},
    "/roles": {"superadmin", "clinic_admin"},
    "/proveedores": {"superadmin", "clinic_admin", "proveedores"},
    "/consultorios": {"superadmin", "clinic_admin", "dentist"},
    "/odontologos": {"superadmin", "clinic_admin", "dentist"},
    "/tratamientos": {"superadmin", "clinic_admin", "dentist"},
    "/pacientes": {"superadmin", "clinic_admin", "dentist", "patient"},
    "/historias-clinicas": {"superadmin", "clinic_admin", "dentist", "patient"},
    "/historias-clinicas-detalladas": {"superadmin", "clinic_admin", "dentist", "patient"},
    "/odontogramas": {"superadmin", "clinic_admin", "dentist", "patient"},
    "/citas": {"superadmin", "clinic_admin", "dentist", "patient"},
    "/recordatorios": {"superadmin", "clinic_admin", "dentist"},
    "/pagos": {"superadmin", "clinic_admin"},
    "/facturas": {"superadmin", "clinic_admin", "patient"},
    "/servicios": {"superadmin", "clinic_admin", "dentist", "patient"},
}

ROLE_ALIASES = {
    "Paciente": "patient", "paciente": "patient",
    "Odontologo": "dentist", "Odontólogo": "dentist", "odontologo": "dentist", "odontólogo": "dentist",
    "Administrador": "clinic_admin", "administrador": "clinic_admin", "Admin": "clinic_admin", "admin": "clinic_admin",
    "Secretaria": "clinic_admin", "secretaria": "clinic_admin",
    "SuperAdmin": "superadmin", "superadmin": "superadmin",
    "clinic_admin": "clinic_admin", "dentist": "dentist", "patient": "patient", "proveedores": "proveedores",
}


def normalize_role(role: str) -> str:
    return ROLE_ALIASES.get(role, role)


def create_access_token(*, user_id: int | str, email: str, role: str, expires_minutes: int | None = None) -> tuple[str, datetime]:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=expires_minutes or ACCESS_TOKEN_MINUTES)
    payload = {
        "sub": str(user_id), "email": email, "role": normalize_role(role),
        "iat": now, "exp": expires_at, "jti": uuid.uuid4().hex, "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM), expires_at


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, JWT_SECRET, algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "email", "role", "iat", "exp", "jti", "type"]},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada", headers={"WWW-Authenticate": "Bearer"}) from exc
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Tipo de token no válido", headers={"WWW-Authenticate": "Bearer"})
    payload["role"] = normalize_role(str(payload["role"]))
    return payload


def get_current_user(request: Request) -> dict:
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticación requerida", headers={"WWW-Authenticate": "Bearer"})
    return user


def require_roles(*roles: str):
    allowed = {normalize_role(role) for role in roles}
    def dependency(request: Request) -> dict:
        user = get_current_user(request)
        if user["role"] not in allowed:
            raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta operación")
        return user
    return dependency


def require_staff():
    return require_roles("superadmin", "clinic_admin", "dentist")


def user_patient_ids(db, user_id: int) -> set[int]:
    rows = db.query(models.usuario_paciente.c.id_paciente).filter(
        models.usuario_paciente.c.id_usuario == user_id
    ).all()
    return {int(row[0]) for row in rows}


def dentist_id_for_user(db, user: dict) -> int | None:
    """Resuelve el odontólogo por el correo del usuario autenticado.

    El esquema legado no tiene FK usuario->odontologo, por lo que el correo
    es la única relación explícita disponible actualmente.
    """
    if normalize_role(str(user.get("role", ""))) != "dentist":
        return None
    correo = str(user.get("email", "")).strip().lower()
    if not correo:
        return None
    row = db.query(models.Odontologo.id_odontologo).filter(
        models.Odontologo.correo.ilike(correo)
    ).first()
    return int(row[0]) if row else None


def dentist_patient_ids(db, user: dict) -> set[int]:
    dentist_id = dentist_id_for_user(db, user)
    if dentist_id is None:
        return set()
    rows = db.query(models.Cita.id_paciente).filter(models.Cita.id_odontologo == dentist_id).distinct().all()
    return {int(row[0]) for row in rows}


def require_patient_resource(path_param: str):
    """Autoriza una ruta que contiene un id de paciente."""
    def dependency(request: Request):
        user = get_current_user(request)
        role = normalize_role(str(user.get("role", "")))
        raw_id = request.path_params.get(path_param)
        try:
            patient_id = int(raw_id)
        except (TypeError, ValueError):
            raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")

        session = SessionLocal()
        try:
            if role == "patient":
                if patient_id not in user_patient_ids(session, int(user["sub"])):
                    raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
            elif role == "dentist":
                if patient_id not in dentist_patient_ids(session, user):
                    raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
            elif role not in {"superadmin", "clinic_admin"}:
                raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
        finally:
            session.close()
        return user
    return dependency


def require_clinical_patient_resource(path_param: str):
    """Permite acceso clínico a admin/odontólogo y lectura propia al paciente."""
    return require_patient_resource(path_param)


def require_appointment_resource(path_param: str = "id"):
    """Autoriza una cita concreta según paciente o odontólogo asignado."""
    def dependency(request: Request):
        user = get_current_user(request)
        role = normalize_role(str(user.get("role", "")))
        if role in {"superadmin", "clinic_admin"}:
            return user
        raw_id = request.path_params.get(path_param)
        try:
            appointment_id = int(raw_id)
        except (TypeError, ValueError):
            raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
        session = SessionLocal()
        try:
            cita = session.query(models.Cita).filter(models.Cita.id_cita == appointment_id).first()
            if not cita:
                raise HTTPException(status_code=404, detail="Cita no encontrada")
            if role == "patient":
                allowed = cita.id_paciente in user_patient_ids(session, int(user["sub"]))
            elif role == "dentist":
                allowed = dentist_id_for_user(session, user) == int(cita.id_odontologo)
            else:
                allowed = False
            if not allowed:
                raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
        finally:
            session.close()
        return user
    return dependency


def module_allowed(path: str, role: str) -> bool:
    normalized = normalize_role(role)
    for prefix, roles in MODULE_ROLES.items():
        if path == prefix or path.startswith(prefix + "/"):
            return normalized in roles
    return True


class JWTAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS" or request.url.path in PUBLIC_PATHS:
            return await call_next(request)
        authorization = request.headers.get("Authorization", "")
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token.strip():
            return JSONResponse(status_code=401, content={"detail": "Autenticación requerida"}, headers={"WWW-Authenticate": "Bearer"})
        try:
            request.state.user = decode_access_token(token.strip())
        except HTTPException as exc:
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers or {})
        if not module_allowed(request.url.path, request.state.user["role"]):
            return JSONResponse(status_code=403, content={"detail": "No tienes permisos para acceder a este módulo"})
        return await call_next(request)
