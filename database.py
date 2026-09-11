from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# CONFIGURACIÓN DE POSTGRESQL
# ─────────────────────────────────────────────

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "1234")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "ODONTOLOGIA_ACTUALIZADA")

DATABASE_URL = (
    f"postgresql+psycopg2://"
    f"{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

print(
    f"🔌 Conectando a PostgreSQL: "
    f"{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)


# ─────────────────────────────────────────────
# CONEXIÓN A LA BASE DE DATOS
# ─────────────────────────────────────────────

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=True,
    connect_args={
        "connect_timeout": 5
    }
)


# ─────────────────────────────────────────────
# SESIONES
# ─────────────────────────────────────────────

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ─────────────────────────────────────────────
# BASE PARA LOS MODELOS
# ─────────────────────────────────────────────

Base = declarative_base()


# ─────────────────────────────────────────────
# DEPENDENCIA DE BASE DE DATOS
# ─────────────────────────────────────────────

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()