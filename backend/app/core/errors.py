"""业务异常：服务层只表达状态码与文案，不直接依赖 FastAPI。"""


class ServiceError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail
