"""Audita registros clínicos sin empresa antes de habilitar multiempresa.

Uso:
  python -m scripts.tenant_migration_report

Solo muestra conteos; no imprime datos personales ni modifica la base de datos.
"""
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
    db = SessionLocal()
    try:
        print("OdontoSoft — auditoría de migración multiempresa (solo lectura)")
        print("\nEmpresas registradas:")
        for row in db.execute(text(
            "SELECT id_empresa, nombre FROM empresa_odontosoft ORDER BY id_empresa"
        )).mappings():
            print(f"  {row['id_empresa']}: {row['nombre']}")

        print("\nRegistros por asignación:")
        for table in TABLES:
            counts = db.execute(text(
                f"SELECT COUNT(*) FILTER (WHERE id_empresa IS NULL) AS sin_empresa, "
                f"COUNT(*) FILTER (WHERE id_empresa IS NOT NULL) AS asignados FROM {table}"
            )).mappings().one()
            print(f"  {table:30} sin_empresa={counts['sin_empresa']:6} asignados={counts['asignados']:6}")

        print("\nRelaciones con empresas diferentes:")
        found = False
        for child, child_fk, parent, parent_pk in RELATIONS:
            query = text(
                f"SELECT COUNT(*) FROM {child} c JOIN {parent} p ON c.{child_fk} = p.{parent_pk} "
                "WHERE c.id_empresa IS NOT NULL AND p.id_empresa IS NOT NULL "
                "AND c.id_empresa <> p.id_empresa"
            )
            count = int(db.execute(query).scalar_one())
            if count:
                found = True
                print(f"  ERROR: {child}.{child_fk} -> {parent}.{parent_pk}: {count}")
        if not found:
            print("  No se detectaron relaciones cruzadas entre empresas asignadas.")
        print("\nNo se han modificado registros. No asignes filas heredadas a OdontoSoft "
              "a menos que realmente pertenezcan a la operación clínica de OdontoSoft.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
