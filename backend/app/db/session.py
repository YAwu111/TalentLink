from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# SQLite 与 MySQL 的连接参数差异集中在这里，切换数据库只改 .env 的 DATABASE_URL
IS_SQLITE = settings.DATABASE_URL.startswith("sqlite")

engine_options: dict = {"pool_pre_ping": True, "echo": False}
if IS_SQLITE:
    engine_options["connect_args"] = {"check_same_thread": False}
else:
    # MySQL 默认 8 小时断开空闲连接，取更短的回收周期，避免拿到已失效的连接
    engine_options.update(pool_recycle=1800, pool_size=5, max_overflow=10)

engine = create_engine(settings.DATABASE_URL, **engine_options)

if IS_SQLITE:

    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, _record):
        # SQLite 默认不校验外键，必须逐连接打开
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI 依赖：每个请求一个会话。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
