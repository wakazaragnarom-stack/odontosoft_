"""Utilidades de seguridad y validación para OdontoSoft."""

import base64
import hashlib
import hmac
import re
import secrets
import string

import bcrypt
from sqlalchemy.orm import Session

import models

BCRYPT_ROUNDS = int(secrets.os.getenv("BCRYPT_ROUNDS", "12")) if hasattr(secrets, "os") else 12
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _password_material(password: str) -> bytes:
    """Normaliza cualquier contraseña a un material de longitud segura para bcrypt."""
    if not isinstance(password, str):
        raise TypeError("La contraseña debe ser texto")
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest)


def hash_password(password: str) -> str:
    """Genera un hash bcrypt; no almacena contraseñas en texto plano."""
    return bcrypt.hashpw(_password_material(password), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(password: str, stored_hash: str) -> bool:
    """Verifica hashes bcrypt y mantiene compatibilidad con SHA-256 legado."""
    if not stored_hash or not isinstance(stored_hash, str):
        return False

    if stored_hash.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            return bcrypt.checkpw(_password_material(password), stored_hash.encode("utf-8"))
        except ValueError:
            return False

    legacy = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy, stored_hash)


def needs_password_rehash(stored_hash: str) -> bool:
    """Indica si un hash legado debe migrarse a bcrypt al iniciar sesión."""
    return not stored_hash.startswith(("$2a$", "$2b$", "$2y$"))


# Alias de compatibilidad usados por el backend existente.
def verificar_password(password_plano: str, password_hash: str) -> bool:
    return verify_password(password_plano, password_hash)


def validar_correo(correo: str) -> bool:
    return EMAIL_PATTERN.fullmatch(correo.strip()) is not None


def generar_documento_unico(db: Session) -> str:
    """Genera un documento de transición cuando el alta no recibe uno."""
    while True:
        doc = "CC" + "".join(secrets.choice(string.digits) for _ in range(8))
        existe = db.query(models.Paciente).filter(models.Paciente.documento == doc).first()
        if not existe:
            return doc


def generar_token_seguro() -> str:
    return secrets.token_urlsafe(32)
