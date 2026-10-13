"""Conexión a PostgreSQL y aislamiento de datos por empresa."""
import os
from contextvars import ContextVar

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker, with_loader_criteria, Session
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.exc import InvalidRequestError

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME")
    missing = [name for name, value in {"DB_USER": db_user, "DB_PASSWORD": db_password, "DB_NAME": db_name}.items() if not value]
    if missing:
        raise RuntimeError("Configura DATABASE_URL o las variables PostgreSQL: " + ", ".join(missing))
    DATABASE_URL = f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

engine = create_engine(
    DATABASE_URL, pool_pre_ping=True,
    pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "1800")),
    pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
    echo=False, connect_args={"connect_timeout": int(os.getenv("DB_CONNECT_TIMEOUT", "5"))},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)
Base = declarative_base()

# Contexto por petición: ContextVar evita mezclar empresas entre peticiones concurrentes.
current_tenant_id: ContextVar[int | None] = ContextVar("odontosoft_tenant_id", default=None)


def _tenant_models():
    # Importación diferida para evitar el ciclo models -> session -> models.
    from backend.app import models  # noqa: F401
    return [
        mapper.class_ for mapper in Base.registry.mappers
        if hasattr(mapper.class_, "id_empresa") and mapper.class_.__name__ != "Empresa"
    ]


@event.listens_for(Session, "do_orm_execute")
def _apply_tenant_filter(execute_state):
    tenant_id = current_tenant_id.get()
    if tenant_id is None or not execute_state.is_select:
        return
    statement = execute_state.statement
    for cls in _tenant_models():
        statement = statement.options(
            with_loader_criteria(cls, lambda entity: entity.id_empresa == tenant_id, include_aliases=True)
        )
    execute_state.statement = statement


@event.listens_for(Session, "before_flush")
def _enforce_tenant_on_write(session, flush_context, instances):
    tenant_id = current_tenant_id.get()
    if tenant_id is None:
        return
    for obj in list(session.new) + list(session.dirty):
        if not hasattr(obj, "id_empresa") or obj.__class__.__name__ == "Empresa":
            continue
        state = sa_inspect(obj)
        if obj in session.new:
            obj.id_empresa = tenant_id
        elif obj.id_empresa != tenant_id or state.attrs.id_empresa.history.has_changes():
            raise InvalidRequestError("No se permite mover registros entre empresas")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
