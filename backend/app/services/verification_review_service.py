from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.errors import ServiceError
from app.models import (
    Company,
    CompanyDocument,
    CompanyVerification,
    CompanyVerificationEvent,
    User,
    VerificationStatus,
)
from app.schemas.admin_verification import (
    AdminCompanyOut,
    AdminVerificationDetail,
    AdminVerificationListItem,
    AdminVerificationListOut,
    VerificationEventOut,
)
from app.services import company_service, verification_service

VALID_STATUS_FILTERS = {"all", *(status.value for status in VerificationStatus)}

STATUS_NOTES = {
    VerificationStatus.approved: "通过认证",
    VerificationStatus.rejected: "驳回认证",
    VerificationStatus.revoked: "撤销认证",
}


def _normalize_status_filter(status: str | None) -> VerificationStatus | None:
    if not status or status == "all":
        return None
    if status not in VALID_STATUS_FILTERS:
        raise ServiceError(400, "无效的审核状态")
    return VerificationStatus(status)


def _now_utc_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _status_counts(db: Session) -> dict[str, int]:
    counts = {status.value: 0 for status in VerificationStatus}
    rows = db.execute(
        select(CompanyVerification.status, func.count()).group_by(
            CompanyVerification.status
        )
    ).all()
    for status, count in rows:
        counts[status.value] = count
    counts["all"] = sum(counts.values())
    return counts


def list_verifications(
    db: Session,
    *,
    status: str | None = "pending",
    page: int = 1,
    page_size: int = 20,
) -> AdminVerificationListOut:
    selected = _normalize_status_filter(status)
    conditions = []
    if selected is not None:
        conditions.append(CompanyVerification.status == selected)

    total = db.scalar(
        select(func.count())
        .select_from(CompanyVerification)
        .where(*conditions)
    ) or 0

    order = (
        CompanyVerification.submitted_at.asc()
        if selected is VerificationStatus.pending
        else CompanyVerification.submitted_at.desc()
    )
    rows = list(
        db.scalars(
            select(CompanyVerification)
            .where(*conditions)
            .order_by(order)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    )

    items: list[AdminVerificationListItem] = []
    for verification in rows:
        company = db.get(Company, verification.company_id)
        document = db.get(CompanyDocument, verification.document_id)
        if company is None or document is None:
            raise ServiceError(500, "认证申请关联数据缺失")
        items.append(
            AdminVerificationListItem(
                id=verification.id,
                company_id=company.id,
                company_name=company.name or company.user.username,
                company_verified=company.verified,
                version=verification.version,
                status=verification.status.value,
                submitted_at=verification.submitted_at,
                document_id=document.id,
                document_name=document.original_name,
            )
        )

    return AdminVerificationListOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        status=selected.value if selected else "all",
        counts=_status_counts(db),
    )


def get_verification(db: Session, verification_id: int) -> CompanyVerification:
    verification = db.get(CompanyVerification, verification_id)
    if verification is None:
        raise ServiceError(404, "认证申请不存在")
    return verification


def _company_summary(company: Company) -> AdminCompanyOut:
    profile = company_service.company_profile(company)
    return AdminCompanyOut(
        id=profile.id,
        name=profile.name,
        industry=profile.industry,
        phone=profile.phone,
        address=profile.address,
        intro=profile.intro,
        verified=profile.verified,
        completeness=profile.completeness,
        is_complete=profile.is_complete,
    )


def _event_out(db: Session, event: CompanyVerificationEvent) -> VerificationEventOut:
    actor = db.get(User, event.actor_id) if event.actor_id else None
    return VerificationEventOut(
        id=event.id,
        from_status=event.from_status.value if event.from_status else None,
        to_status=event.to_status.value,
        actor_id=event.actor_id,
        actor_name=actor.username if actor else None,
        note=event.note,
        created_at=event.created_at,
    )


def get_verification_detail(
    db: Session, verification_id: int
) -> AdminVerificationDetail:
    verification = get_verification(db, verification_id)
    company = db.get(Company, verification.company_id)
    if company is None:
        raise ServiceError(500, "认证申请关联企业缺失")

    history = list(
        db.scalars(
            select(CompanyVerification)
            .where(CompanyVerification.company_id == company.id)
            .order_by(CompanyVerification.id.desc())
        )
    )
    events = list(
        db.scalars(
            select(CompanyVerificationEvent)
            .where(CompanyVerificationEvent.verification_id == verification.id)
            .order_by(CompanyVerificationEvent.id.asc())
        )
    )

    return AdminVerificationDetail(
        verification=verification_service.verification_out(db, verification),
        company=_company_summary(company),
        history=[verification_service.verification_out(db, item) for item in history],
        events=[_event_out(db, event) for event in events],
    )


def _validate_reason(reason: str, label: str) -> str:
    text = reason.strip()
    if len(text) < 2:
        raise ServiceError(422, f"{label}至少需要 2 个字")
    return text


def _review(
    db: Session,
    verification_id: int,
    admin: User,
    *,
    from_status: VerificationStatus,
    to_status: VerificationStatus,
    verified: bool,
    note: str | None,
    reject_reason: str | None = None,
) -> AdminVerificationDetail:
    verification = get_verification(db, verification_id)
    if verification.status is not from_status:
        raise ServiceError(409, "该认证申请状态已变化，请刷新后重试")

    now = _now_utc_naive()
    result = db.execute(
        update(CompanyVerification)
        .where(
            CompanyVerification.id == verification_id,
            CompanyVerification.status == from_status,
        )
        .values(
            status=to_status,
            reviewed_by=admin.id,
            reviewed_at=now,
            review_note=note,
            reject_reason=reject_reason,
        )
    )
    if result.rowcount != 1:
        db.rollback()
        raise ServiceError(409, "该认证申请已被其他管理员处理，请刷新后重试")

    company = db.get(Company, verification.company_id)
    if company is None:
        db.rollback()
        raise ServiceError(500, "认证申请关联企业缺失")
    company.verified = verified

    db.add(
        CompanyVerificationEvent(
            verification_id=verification_id,
            from_status=from_status,
            to_status=to_status,
            actor_id=admin.id,
            note=note or f"管理员{STATUS_NOTES.get(to_status, to_status.value)}",
        )
    )
    db.commit()
    db.refresh(verification)
    return get_verification_detail(db, verification_id)


def approve_verification(
    db: Session, verification_id: int, admin: User, note: str | None = None
) -> AdminVerificationDetail:
    clean_note = note.strip() if note and note.strip() else None
    return _review(
        db,
        verification_id,
        admin,
        from_status=VerificationStatus.pending,
        to_status=VerificationStatus.approved,
        verified=True,
        note=clean_note,
    )


def reject_verification(
    db: Session, verification_id: int, admin: User, reason: str
) -> AdminVerificationDetail:
    clean_reason = _validate_reason(reason, "驳回原因")
    return _review(
        db,
        verification_id,
        admin,
        from_status=VerificationStatus.pending,
        to_status=VerificationStatus.rejected,
        verified=False,
        note=clean_reason,
        reject_reason=clean_reason,
    )


def revoke_verification(
    db: Session, verification_id: int, admin: User, reason: str
) -> AdminVerificationDetail:
    clean_reason = _validate_reason(reason, "撤销原因")
    return _review(
        db,
        verification_id,
        admin,
        from_status=VerificationStatus.approved,
        to_status=VerificationStatus.revoked,
        verified=False,
        note=clean_reason,
        reject_reason=None,
    )
