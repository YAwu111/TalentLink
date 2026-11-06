from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.errors import ServiceError
from app.db.session import get_db
from app.models import CompanyDocument, Role, User
from app.schemas.admin_verification import (
    AdminVerificationDetail,
    AdminVerificationListOut,
    ReviewApproveIn,
    ReviewRejectIn,
    ReviewRevokeIn,
)
from app.services import document_service, verification_review_service

router = APIRouter(prefix="/admin", tags=["管理员审核"])


@router.get(
    "/verifications",
    response_model=AdminVerificationListOut,
    summary="管理员查看认证申请列表",
)
def list_verifications(
    status: str = Query(default="pending"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    admin: User = Depends(require_roles(Role.admin)),
    db: Session = Depends(get_db),
) -> AdminVerificationListOut:
    return verification_review_service.list_verifications(
        db, status=status, page=page, page_size=page_size
    )


@router.get(
    "/verifications/{verification_id}",
    response_model=AdminVerificationDetail,
    summary="管理员查看认证申请详情",
)
def get_verification_detail(
    verification_id: int,
    admin: User = Depends(require_roles(Role.admin)),
    db: Session = Depends(get_db),
) -> AdminVerificationDetail:
    return verification_review_service.get_verification_detail(db, verification_id)


@router.get(
    "/verifications/{verification_id}/file",
    summary="管理员下载认证材料",
)
def download_verification_file(
    verification_id: int,
    admin: User = Depends(require_roles(Role.admin)),
    db: Session = Depends(get_db),
) -> FileResponse:
    verification = verification_review_service.get_verification(db, verification_id)
    document = db.get(CompanyDocument, verification.document_id)
    if document is None:
        raise ServiceError(404, "认证材料不存在")
    return FileResponse(
        document_service.document_path(document),
        media_type=document.mime_type,
        filename=document.original_name,
        headers={
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
        },
    )


@router.post(
    "/verifications/{verification_id}/approve",
    response_model=AdminVerificationDetail,
    summary="管理员通过认证申请",
)
def approve_verification(
    verification_id: int,
    payload: ReviewApproveIn | None = None,
    admin: User = Depends(require_roles(Role.admin)),
    db: Session = Depends(get_db),
) -> AdminVerificationDetail:
    return verification_review_service.approve_verification(
        db, verification_id, admin, payload.note if payload else None
    )


@router.post(
    "/verifications/{verification_id}/reject",
    response_model=AdminVerificationDetail,
    summary="管理员驳回认证申请",
)
def reject_verification(
    verification_id: int,
    payload: ReviewRejectIn,
    admin: User = Depends(require_roles(Role.admin)),
    db: Session = Depends(get_db),
) -> AdminVerificationDetail:
    return verification_review_service.reject_verification(
        db, verification_id, admin, payload.reason
    )


@router.post(
    "/verifications/{verification_id}/revoke",
    response_model=AdminVerificationDetail,
    summary="管理员撤销已通过认证",
)
def revoke_verification(
    verification_id: int,
    payload: ReviewRevokeIn,
    admin: User = Depends(require_roles(Role.admin)),
    db: Session = Depends(get_db),
) -> AdminVerificationDetail:
    return verification_review_service.revoke_verification(
        db, verification_id, admin, payload.reason
    )
