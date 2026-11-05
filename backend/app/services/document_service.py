import logging
import mimetypes
import time
from pathlib import Path
from typing import Any

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ServiceError
from app.db.session import SessionLocal
from app.models import (
    Company,
    CompanyDocument,
    DocumentCategory,
    DocumentStatus,
)
from app.schemas.document import (
    CompanyDocumentOut,
    RecognitionResultOut,
)
from app.services import storage_service

logger = logging.getLogger("talentlink.document")

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
INTRO_SUFFIXES = {".pdf", ".docx", ".png", ".jpg", ".jpeg"}
IDENTITY_SUFFIXES = {".pdf", ".png", ".jpg", ".jpeg"}

MOCK_FIELDS: dict[str, dict[str, Any]] = {
    "name": {"value": "星河科技（上海）有限公司", "confidence": 0.96},
    "industry": {"value": "企业服务 / SaaS", "confidence": 0.91},
    "phone": {"value": "021-58881234", "confidence": 0.88},
    "address": {"value": "上海市浦东新区张江路 88 号 3 层", "confidence": 0.93},
    "intro": {
        "value": "星河科技专注企业级 SaaS 产品研发，团队约 200 人，已完成 B 轮融资。",
        "confidence": 0.84,
    },
}


def _safe_filename(filename: str | None) -> str:
    name = Path(filename or "document").name.strip()
    if not name:
        return "document"
    if len(name) > 255:
        suffix = Path(name).suffix
        name = f"{Path(name).stem[: 255 - len(suffix)]}{suffix}"
    return name


def _validate_file(
    original_name: str, content: bytes, category: DocumentCategory
) -> None:
    if not content:
        raise ServiceError(400, "文件为空，请重新选择")
    if len(content) > MAX_UPLOAD_BYTES:
        raise ServiceError(413, "文件不能超过 10MB")

    suffix = Path(original_name).suffix.lower()
    allowed = (
        INTRO_SUFFIXES if category is DocumentCategory.intro else IDENTITY_SUFFIXES
    )
    if suffix not in allowed:
        if category is DocumentCategory.intro:
            raise ServiceError(415, "仅支持 PDF、DOCX、PNG、JPG")
        raise ServiceError(415, "仅支持 PDF、PNG、JPG")


async def _read_upload(file: UploadFile) -> bytes:
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if len(content) > MAX_UPLOAD_BYTES:
        raise ServiceError(413, "文件不能超过 10MB")
    return content


async def _create_document(
    db: Session,
    company: Company,
    file: UploadFile,
    category: DocumentCategory,
) -> CompanyDocument:
    content = await _read_upload(file)
    original_name = _safe_filename(file.filename)
    _validate_file(original_name, content, category)

    mime_type = (
        mimetypes.guess_type(original_name)[0] or "application/octet-stream"
    )[:120]
    stored = storage_service.save_bytes(company.id, original_name, content)

    document = CompanyDocument(
        company_id=company.id,
        category=category,
        original_name=original_name,
        storage_key=stored.storage_key,
        mime_type=mime_type,
        size=stored.size,
        sha256=stored.sha256,
        parse_status=(
            DocumentStatus.processing
            if category is DocumentCategory.intro
            else DocumentStatus.stored
        ),
    )
    db.add(document)
    try:
        db.commit()
    except Exception:
        db.rollback()
        storage_service.delete_file(stored.storage_key)
        logger.exception("创建文档记录失败 company_id=%s", company.id)
        raise

    db.refresh(document)
    logger.info(
        "文档已保存 company_id=%s document_id=%s category=%s size=%s",
        company.id,
        document.id,
        category.value,
        document.size,
    )
    return document


async def create_intro_document(
    db: Session, company: Company, file: UploadFile
) -> CompanyDocument:
    return await _create_document(db, company, file, DocumentCategory.intro)


async def create_identity_document(
    db: Session, company: Company, file: UploadFile
) -> CompanyDocument:
    return await _create_document(db, company, file, DocumentCategory.identity)


def delete_document(db: Session, document: CompanyDocument) -> None:
    storage_key = document.storage_key
    db.delete(document)
    db.commit()
    storage_service.delete_file(storage_key)


def get_document_of(
    db: Session, company: Company, document_id: int
) -> CompanyDocument:
    document = db.scalar(
        select(CompanyDocument).where(
            CompanyDocument.id == document_id,
            CompanyDocument.company_id == company.id,
        )
    )
    if document is None:
        raise ServiceError(404, "文档不存在")
    return document


def document_path(document: CompanyDocument) -> Path:
    path = storage_service.resolve_path(document.storage_key)
    if not path.is_file():
        raise ServiceError(404, "文件不存在")
    return path


def document_out(document: CompanyDocument) -> CompanyDocumentOut:
    result: RecognitionResultOut | None = None
    if document.parsed_data:
        try:
            result = RecognitionResultOut.model_validate(document.parsed_data)
        except Exception:
            logger.warning(
                "识别结果格式异常 document_id=%s", document.id, exc_info=True
            )

    return CompanyDocumentOut(
        id=document.id,
        category=document.category.value,
        original_name=document.original_name,
        mime_type=document.mime_type,
        size=document.size,
        status=document.parse_status.value,
        result=result,
        error=document.error_message,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def _mock_result(document: CompanyDocument) -> dict[str, Any]:
    return {
        "provider": "mock",
        "document_type": "intro",
        "confidence": 0.92,
        "fields": MOCK_FIELDS,
        "warnings": [
            f"当前为后端联调模拟识别，文件「{document.original_name}」未调用真实识别服务。"
        ],
    }


def run_mock_recognition(document_id: int) -> None:
    """BackgroundTasks 任务：独立会话，避免请求会话关闭后继续写库。"""
    with SessionLocal() as db:
        document = db.get(CompanyDocument, document_id)
        if document is None or document.category is not DocumentCategory.intro:
            return

        try:
            document.parse_status = DocumentStatus.processing
            document.error_message = None
            db.commit()

            # 模拟真实识别耗时，让前端能观察到 processing → parsed
            time.sleep(1.2)
            document.parsed_data = _mock_result(document)
            document.parse_status = DocumentStatus.parsed
            db.commit()
            logger.info("模拟识别完成 document_id=%s", document_id)
        except Exception as exc:
            db.rollback()
            logger.exception("模拟识别失败 document_id=%s", document_id)
            document = db.get(CompanyDocument, document_id)
            if document is not None:
                document.parse_status = DocumentStatus.failed
                document.error_message = f"识别失败：{exc}"[:1000]
                db.commit()
