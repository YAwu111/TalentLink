"""统一日志配置：控制台 + 按天切分的文件，所有记录带请求 ID。"""

import contextvars
import logging
import sys
from pathlib import Path

from app.core.config import settings

# 每个请求一个 ID，贯穿该请求内所有日志（包括业务层），排障时按 ID 过滤即可
request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar(
    "request_id", default="-"
)

LOG_FORMAT = "%(asctime)s | %(levelname)-7s | %(request_id)s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def get_request_id() -> str:
    return request_id_var.get()


def set_request_id(value: str) -> contextvars.Token[str]:
    return request_id_var.set(value)


def reset_request_id(token: contextvars.Token[str]) -> None:
    request_id_var.reset(token)


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        return True


def setup_logging() -> None:
    log_dir = Path(settings.LOG_DIR)
    log_dir.mkdir(parents=True, exist_ok=True)

    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()

    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    console.addFilter(RequestIdFilter())
    root.addHandler(console)

    if settings.LOG_TO_FILE:
        from logging.handlers import TimedRotatingFileHandler

        app_file = TimedRotatingFileHandler(
            log_dir / "app.log",
            when="midnight",
            backupCount=settings.LOG_BACKUP_DAYS,
            encoding="utf-8",
        )
        app_file.setFormatter(formatter)
        app_file.addFilter(RequestIdFilter())

        error_file = TimedRotatingFileHandler(
            log_dir / "error.log",
            when="midnight",
            backupCount=settings.LOG_BACKUP_DAYS,
            encoding="utf-8",
        )
        error_file.setLevel(logging.ERROR)
        error_file.setFormatter(formatter)
        error_file.addFilter(RequestIdFilter())

        root.addHandler(app_file)
        root.addHandler(error_file)

    # 让 uvicorn 的日志走同一套格式，而不是各写各的
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(name)
        lg.handlers.clear()
        lg.propagate = True

    # 访问日志由 RequestLogMiddleware 统一记录，避免同一次请求打印两行
    logging.getLogger("uvicorn.access").disabled = True

    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


logger = logging.getLogger("talentlink")
