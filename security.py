"""Seguridad de autenticación y autorización para OdontoSoft.

PostgreSQL es la fuente de verdad. Este módulo sólo gestiona identidad y sesión.
"""

import os
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida o expirada", headers={"WWW-Authenticate": "Bearer"}) from exc
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tipo de token no válido", headers={"WWW-Authenticate": "Bearer"})
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
        return await call_next(request)
