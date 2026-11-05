import hashlib
import logging
import uuid
from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings
from app.core.errors import ServiceError

logger = logging.getLogger("talentlink.storage")

_BACKEND_DIR = Path(__file__).resolve().parents[2]
UPLOAD_ROOT = Path(settings.UPLOAD_DIR)
if not UPLOAD_ROOT.is_absolute():
    UPLOAD_ROOT = _BACKEND_DIR / UPLOAD_ROOT
UPLOAD_ROOT = UPLOAD_ROOT.resolve()


@dataclass(frozen=True)
class StoredFile:
    storage_key: str
    size: int
    sha256: str


def save_bytes(
    company_id: int, original_name: str, content: bytes
) -> StoredFile:
    """写入私有上传目录；返回相对 storage_key，不把绝对路径暴露给 API。"""
    suffix = Path(original_name).suffix.lower()
    relative_dir = Path("documents") / str(company_id)
    target_dir = UPLOAD_ROOT / relative_dir
    target = target_dir / f"{uuid.uuid4().hex}{suffix}"

    try:
        target_dir.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
    except OSError as exc:
        logger.exception("保存上传文件失败 company_id=%s", company_id)
        raise ServiceError(500, "文件保存失败，请稍后重试") from exc

    return StoredFile(
        storage_key=target.relative_to(UPLOAD_ROOT).as_posix(),
        size=len(content),
        sha256=hashlib.sha256(content).hexdigest(),
    )


def resolve_path(storage_key: str) -> Path:
    """校验 storage_key 仍在私有上传根目录内，防止路径穿越。"""
    target = (UPLOAD_ROOT / storage_key).resolve()
    if target != UPLOAD_ROOT and UPLOAD_ROOT not in target.parents:
        raise ServiceError(404, "文件不存在")
    return target


def delete_file(storage_key: str) -> None:
    try:
        resolve_path(storage_key).unlink(missing_ok=True)
    except OSError:
        logger.warning("删除上传文件失败 storage_key=%s", storage_key, exc_info=True)
