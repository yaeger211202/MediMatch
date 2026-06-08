from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.database_url, echo=False, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)

    if settings.database_url.startswith("sqlite"):
        with engine.begin() as conn:
            result = conn.execute(text("PRAGMA table_info(medications)"))
            existing_columns = {row[1] for row in result}
            if "time_of_day" not in existing_columns:
                conn.execute(
                    text('ALTER TABLE medications ADD COLUMN time_of_day VARCHAR(128) DEFAULT ""')
                )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
