import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import reset_request_id, set_request_id

access_logger = logging.getLogger("talentlink.access")

# 健康检查、文档这类高频且无信息量的请求不写 INFO，避免刷屏
QUIET_PATHS = {"/api/health", "/openapi.json", "/docs", "/redoc", "/"}


class RequestLogMiddleware(BaseHTTPMiddleware):
    """为每个请求生成 request_id，并记录一行访问日志。"""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
        # 同时写进 state：异常处理器运行在中间件之外（ServerErrorMiddleware），
        # 那里 contextvar 已被重置，只能从这里取回同一个 ID
        request.state.request_id = request_id
        token = set_request_id(request_id)

        started = time.perf_counter()
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
        finally:
            elapsed_ms = (time.perf_counter() - started) * 1000
            path = request.url.path
            level = logging.DEBUG if path in QUIET_PATHS else logging.INFO
            access_logger.log(
                level,
                "%s %s -> %s %.1fms ip=%s",
                request.method,
                path,
                status_code,
                elapsed_ms,
                request.client.host if request.client else "-",
            )
            reset_request_id(token)

        response.headers["X-Request-ID"] = request_id
        return response
