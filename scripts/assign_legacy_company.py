"""Asigna registros heredados a una empresa de forma explícita y transaccional.

Primero ejecutar: python -m scripts.tenant_migration_report
Vista previa:
  python -m scripts.assign_legacy_company --company-id 2
Aplicar solo si TODOS los registros heredados sin empresa pertenecen a esa clínica:
  python -m scripts.assign_legacy_company --company-id 2 --apply --confirm-all-legacy-data-belongs-to-this-company

Requiere una conexión PostgreSQL superusuario por FORCE ROW LEVEL SECURITY.
No usar si los registros heredados pertenecen a más de una clínica.
"""
import argparse
from sqlalchemy import text
from backend.app.db.session import SessionLocal

TABLES = (
    "paciente", "consultorio", "odontologo", "historia_clinica",
    "odontograma", "historia_clinica_detallada", "cita", "tratamiento",
    "recordatorio", "pago", "factura", "rol", "proveedor", "servicio",
)
RELATIONS = (
    ("historia_clinica", "id_paciente", "paciente", "id_paciente"),
    ("odontograma", "id_paciente", "paciente", "id_paciente"),
    ("historia_clinica_detallada", "id_paciente", "paciente", "id_paciente"),
    ("cita", "id_paciente", "paciente", "id_paciente"),
    ("cita", "id_odontologo", "odontologo", "id_odontologo"),
    ("cita", "id_consultorio", "consultorio", "id_consultorio"),
    ("recordatorio", "id_cita", "cita", "id_cita"),
    ("pago", "id_cita", "cita", "id_cita"),
    ("factura", "id_pago", "pago", "id_pago"),
)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--company-id", type=int, required=True)
    parser.add_argument("--apply", action="store_true", help="Ejecuta la asignación; sin esto solo muestra vista previa")
    parser.add_argument("--confirm-all-legacy-data-belongs-to-this-company", action="store_true")
    args = parser.parse_args()

    if args.apply and not args.confirm_all_legacy_data_belongs_to_this_company:
        parser.error("Para aplicar, agrega --confirm-all-legacy-data-belongs-to-this-company")

    db = SessionLocal()
    try:
        if not db.execute(text(
            "SELECT rolsuper FROM pg_roles WHERE rolname = current_user"
        )).scalar_one():
            raise RuntimeError("Ejecuta esta herramienta con un usuario PostgreSQL superusuario.")
        company = db.execute(text(
            "SELECT id_empresa, nombre FROM empresa_odontosoft WHERE id_empresa = :id"
        ), {"id": args.company_id}).mappings().first()
        if not company:
            raise RuntimeError(f"No existe la empresa con id {args.company_id}.")

        counts = {}
        for table in TABLES:
            counts[table] = int(db.execute(text(
                f"SELECT COUNT(*) FROM {table} WHERE id_empresa IS NULL"
            )).scalar_one())

        print(f"Empresa destino: {company['id_empresa']} — {company['nombre']}")
        print("Registros sin empresa que se asignarían:")
        for table, count in counts.items():
            print(f"  {table:30} {count:6}")
        print(f"  {'TOTAL':30} {sum(counts.values()):6}")

        if not args.apply:
            print("\nVISTA PREVIA: no se modificó ningún registro.")
            return

        try:
            for table in TABLES:
                db.execute(text(
                    f"UPDATE {table} SET id_empresa = :company_id WHERE id_empresa IS NULL"
                ), {"company_id": args.company_id})

            cross_tenant = []
            for child, child_fk, parent, parent_pk in RELATIONS:
                count = int(db.execute(text(
                    f"SELECT COUNT(*) FROM {child} c JOIN {parent} p ON c.{child_fk} = p.{parent_pk} "
                    "WHERE c.id_empresa IS DISTINCT FROM p.id_empresa"
                )).scalar_one())
                if count:
                    cross_tenant.append(f"{child}.{child_fk} -> {parent}.{parent_pk}: {count}")

            if cross_tenant:
                raise RuntimeError(
                    "Se detectaron relaciones con empresas distintas; se revierte toda la transacción:\n"
                    + "\n".join(cross_tenant)
                )
            db.commit()
            print("\nAsignación completada y relaciones verificadas.")
        except Exception:
            db.rollback()
            raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
