from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import app.models  # noqa: F401  确保建表前所有模型已注册到 metadata
from app.api.router import api_router
from app.core.config import settings
from app.core.logging import get_request_id, logger, setup_logging
from app.db.base import Base
from app.db.seed import run_seed
from app.db.session import SessionLocal, engine
from app.middleware.request_log import RequestLogMiddleware

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 课程设计阶段用 create_all 建表；后续接入 Alembic 再替换
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        run_seed(db)
    logger.info("应用启动完成：%s v%s", settings.APP_NAME, settings.APP_VERSION)
    yield
    logger.info("应用已停止")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )
    app.add_middleware(RequestLogMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )
    app.include_router(api_router, prefix=settings.API_PREFIX)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError):
        logger.warning(
            "参数校验失败 %s %s: %s", request.method, request.url.path, exc.errors()
        )
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors(), "request_id": get_request_id()},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception):
        logger.exception("未捕获异常 %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={
                "detail": "服务器内部错误，请稍后重试",
                "request_id": get_request_id(),
            },
        )

    @app.get("/", include_in_schema=False)
    def index() -> dict:
        return {"docs": "/docs", "health": f"{settings.API_PREFIX}/health"}

    return app


app = create_app()
