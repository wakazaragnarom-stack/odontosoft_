"""Crea un usuario administrador de OdontoSoft de forma interactiva.

Uso:
    python scripts/create_admin.py

Requiere que .env esté configurado y PostgreSQL esté disponible.
"""

from getpass import getpass
from sqlalchemy.exc import IntegrityError

import models
from database import SessionLocal
from utils import hash_password, validar_correo


def main() -> None:
    print("=== OdontoSoft · Crear administrador ===")
    correo = input("Correo: ").strip().lower()
    nombre = input("Nombre: ").strip()
    apellido = input("Apellido: ").strip()
    documento = input("Documento (opcional): ").strip() or None
    telefono = input("Teléfono (opcional): ").strip() or None
    password = getpass("Contraseña: ")
    confirm = getpass("Repite la contraseña: ")

    if not validar_correo(correo):
        raise SystemExit("Correo electrónico no válido.")
    if len(password) < 8:
        raise SystemExit("La contraseña debe tener al menos 8 caracteres.")
    if password != confirm:
        raise SystemExit("Las contraseñas no coinciden.")

    db = SessionLocal()
    try:
        if db.query(models.Usuario).filter(models.Usuario.correo == correo).first():
            raise SystemExit("Ya existe un usuario con ese correo.")

        user = models.Usuario(
            correo=correo,
            contrasena=hash_password(password),
            rol="Administrador",
            estado="Activo",
            nombre=nombre or None,
            apellido=apellido or None,
            documento=documento,
            telefono=telefono,
        )
        db.add(user)
        db.commit()
        print(f"Administrador creado correctamente con id_usuario={user.id_usuario}.")
    except IntegrityError as exc:
        db.rollback()
        raise SystemExit("No fue posible crear el administrador: conflicto de integridad.") from exc
    finally:
        db.close()


if __name__ == "__main__":
    main()
