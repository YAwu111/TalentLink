import logging

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import ServiceError
from app.models import (
    Company,
    CompanyDocument,
    CompanyVerification,
    CompanyVerificationEvent,
    VerificationStatus,
)
from app.schemas.document import (
    VerificationDocumentOut,
    VerificationOut,
    VerificationStateOut,
)

logger = logging.getLogger("talentlink.verification")


def ensure_can_submit(db: Session, company: Company) -> None:
    """同一企业同时只允许一个 pending；已完成认证后仍允许发起复审。"""
    pending_id = db.scalar(
        select(CompanyVerification.id)
        .where(
            CompanyVerification.company_id == company.id,
            CompanyVerification.status == VerificationStatus.pending,
        )
        .limit(1)
    )
    if pending_id is not None:
        raise ServiceError(409, "已有待审核的认证申请，请等待管理员处理")


def create_verification(
    db: Session, company: Company, document: CompanyDocument
) -> CompanyVerification:
    ensure_can_submit(db, company)
    latest_version = db.scalar(
        select(func.max(CompanyVerification.version)).where(
            CompanyVerification.company_id == company.id
        )
    )
    verification = CompanyVerification(
        company_id=company.id,
        document_id=document.id,
        status=VerificationStatus.pending,
        version=(latest_version or 0) + 1,
    )
    db.add(verification)
    try:
        db.flush()
        db.add(
            CompanyVerificationEvent(
                verification_id=verification.id,
                from_status=None,
                to_status=VerificationStatus.pending,
                actor_id=company.user_id,
                note="企业提交认证申请",
            )
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.warning("认证申请重复提交 company_id=%s", company.id)
        raise ServiceError(409, "认证申请已被提交，请刷新后重试") from exc

    db.refresh(verification)
    logger.info(
        "认证申请已提交 company_id=%s verification_id=%s version=%s",
        company.id,
        verification.id,
        verification.version,
    )
    return verification


def verification_out(
    db: Session, verification: CompanyVerification
) -> VerificationOut:
    document = db.get(CompanyDocument, verification.document_id)
    if document is None:
        raise ServiceError(500, "认证材料不存在")

    return VerificationOut(
        id=verification.id,
        status=verification.status.value,
        version=verification.version,
        submitted_at=verification.submitted_at,
        reviewed_at=verification.reviewed_at,
        reviewed_by=verification.reviewed_by,
        review_note=verification.review_note,
        reject_reason=verification.reject_reason,
        document=VerificationDocumentOut(
            id=document.id,
            original_name=document.original_name,
            mime_type=document.mime_type,
            size=document.size,
            created_at=document.created_at,
        ),
    )


def get_verification_state(db: Session, company: Company) -> VerificationStateOut:
    history = list(
        db.scalars(
            select(CompanyVerification)
            .where(CompanyVerification.company_id == company.id)
            .order_by(CompanyVerification.id.desc())
        )
    )
    items = [verification_out(db, item) for item in history]
    return VerificationStateOut(
        current=items[0] if items else None,
        history=items,
    )
