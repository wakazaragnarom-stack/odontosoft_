"""Crea el único usuario SuperAdmin de OdontoSoft desde la terminal.

Ejecutar: python -m scripts.create_superadmin
La contraseña se solicita de forma oculta; no se guarda en el código ni en Git.
"""
from getpass import getpass
from backend.app import models
from backend.app.db.session import SessionLocal
from backend.app.utils import hash_password, validar_correo

EMAIL = "darekpumajoseph@gmail.com"


def main():
    print("=== OdontoSoft · Crear SuperAdmin único ===")
    print(f"Correo reservado: {EMAIL}")
    password = getpass("Contraseña inicial (puedes usar la indicada por el propietario): ")
    confirm = getpass("Repite la contraseña: ")
    if len(password) < 8:
        raise SystemExit("La contraseña debe tener al menos 8 caracteres.")
    if password != confirm:
        raise SystemExit("Las contraseñas no coinciden.")
    if not validar_correo(EMAIL):
        raise SystemExit("El correo configurado no es válido.")
    db = SessionLocal()
    try:
        existing_supers = db.query(models.Usuario).filter(models.Usuario.rol.in_(["SuperAdmin", "superadmin"])).all()
        if any(item.correo.lower() != EMAIL for item in existing_supers):
            raise SystemExit("Ya existe otro SuperAdmin. Sólo se permite uno.")
        user = db.query(models.Usuario).filter(models.Usuario.correo == EMAIL).first()
        if user and user.rol not in ("SuperAdmin", "superadmin"):
            raise SystemExit("El correo ya pertenece a otro rol; revisa manualmente antes de elevar privilegios.")
        if user is None:
            user = models.Usuario(correo=EMAIL, rol="SuperAdmin", estado="Activo", nombre="SuperAdmin")
            db.add(user)
        user.contrasena = hash_password(password)
        user.rol = "SuperAdmin"
        user.estado = "Activo"
        db.commit()
        print("SuperAdmin creado/actualizado correctamente. Inicia sesión en la interfaz web.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
