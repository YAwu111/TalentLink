from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """全局配置，可通过 .env 或环境变量覆盖。"""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    APP_NAME: str = "TalentLink 网上招聘系统"
    APP_VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = True

    # SQLite 仅用于课程设计演示，切换 MySQL 只需改这一行
    DATABASE_URL: str = "sqlite:///./talentlink.db"

    JWT_SECRET: str = "talentlink-dev-secret-change-me-0123456789abcdef"
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "talentlink"
    JWT_AUDIENCE: str = "talentlink-web"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Cookie 策略：开发环境走 http，生产必须置 true
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    # 文件上传：相对 backend 工作目录；生产环境应换到持久化/对象存储
    UPLOAD_DIR: str = "uploads"
    # 识别适配器：local（本地 OCR + 规则）| mock（仅联调）
    RECOGNITION_PROVIDER: str = "local"

    # 日志
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"
    LOG_TO_FILE: bool = True
    LOG_BACKUP_DAYS: int = 14

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # 管理员固定账号，由后端启动时写入数据库（密码只存哈希）
    ADMIN_USERNAME: str = "yawu1122345"
    ADMIN_PASSWORD: str = "dev123123"
    # 是否同时写入演示数据，正式部署时关掉
    SEED_DEMO: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
