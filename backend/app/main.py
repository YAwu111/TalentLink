from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import app.models  # noqa: F401  确保建表前所有模型已注册到 metadata
from app.api.router import api_router
from app.core.config import settings
from app.core.errors import ServiceError
from app.core.logging import logger, reset_request_id, set_request_id, setup_logging
from app.db.base import Base
from app.db.seed import run_seed
from app.db.session import SessionLocal, engine
from app.middleware.request_log import RequestLogMiddleware

setup_logging()


def _request_id(request: Request) -> str:
    """错误处理器运行在中间件之外，contextvar 已被重置，只能从 state 取。"""
    return getattr(request.state, "request_id", "-")


def _error_response(request: Request, status_code: int, detail: object) -> JSONResponse:
    """统一错误响应：request_id 同时写入响应体和响应头，保证前端截图即可定位日志。"""
    request_id = _request_id(request)
    return JSONResponse(
        status_code=status_code,
        content={"detail": detail, "request_id": request_id},
        headers={"X-Request-ID": request_id},
    )


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

    @app.exception_handler(ServiceError)
    async def handle_service_error(request: Request, exc: ServiceError):
        """服务层抛出的可预期错误，统一回填 request_id。"""
        logger.warning(
            "业务异常 %s %s -> %s: %s",
            request.method,
            request.url.path,
            exc.status_code,
            exc.detail,
        )
        return _error_response(request, exc.status_code, exc.detail)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError):
        logger.warning(
            "参数校验失败 %s %s: %s", request.method, request.url.path, exc.errors()
        )
        return _error_response(request, 422, exc.errors())

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception):
        # 异常发生在本中间件之外，日志上下文已失效，这里临时补回同一个 ID
        token = set_request_id(_request_id(request))
        try:
            logger.exception("未捕获异常 %s %s", request.method, request.url.path)
        finally:
            reset_request_id(token)
        return _error_response(request, 500, "服务器内部错误，请稍后重试")

    @app.get("/", include_in_schema=False)
    def index() -> dict:
        return {"docs": "/docs", "health": f"{settings.API_PREFIX}/health"}

    return app


app = create_app()
