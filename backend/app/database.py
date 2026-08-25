"""SQLite + SQLAlchemy 连接。整份模型以 JSON 列存储（document 风格）。"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = os.environ.get(
    "DDD_DB_PATH",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "data.db"),
)
engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
