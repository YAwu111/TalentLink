from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models import Role, User
from app.schemas.company import CompanyPatch, CompanyProfile
from app.schemas.document import (
    CompanyDocumentOut,
    VerificationOut,
    VerificationStateOut,
)
from app.services import company_service, document_service, verification_service

router = APIRouter(prefix="/employer", tags=["企业资料"])


@router.get("/company", response_model=CompanyProfile, summary="获取企业资料")
def get_company(
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> CompanyProfile:
    return company_service.company_profile(company_service.get_company_of(db, user))


@router.patch("/company", response_model=CompanyProfile, summary="局部更新企业资料")
def patch_company(
    payload: CompanyPatch,
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> CompanyProfile:
    return company_service.update_company(db, user, payload)


@router.post(
    "/company/documents",
    response_model=CompanyDocumentOut,
    status_code=status.HTTP_202_ACCEPTED,
    summary="上传企业介绍文档并触发模拟识别",
)
async def upload_company_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> CompanyDocumentOut:
    company = company_service.get_company_of(db, user)
    document = await document_service.create_intro_document(db, company, file)
    background_tasks.add_task(document_service.run_mock_recognition, document.id)
    return document_service.document_out(document)


@router.get(
    "/company/documents/{document_id}",
    response_model=CompanyDocumentOut,
    summary="查询文档与识别状态",
)
def get_company_document(
    document_id: int,
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> CompanyDocumentOut:
    company = company_service.get_company_of(db, user)
    document = document_service.get_document_of(db, company, document_id)
    return document_service.document_out(document)


@router.get(
    "/company/documents/{document_id}/file",
    summary="下载企业自己的文档",
)
def download_company_document(
    document_id: int,
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> FileResponse:
    company = company_service.get_company_of(db, user)
    document = document_service.get_document_of(db, company, document_id)
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
    "/company/verification",
    response_model=VerificationOut,
    status_code=status.HTTP_201_CREATED,
    summary="提交企业身份认证材料",
)
async def submit_company_verification(
    file: UploadFile = File(...),
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> VerificationOut:
    company = company_service.get_company_of(db, user)
    verification_service.ensure_can_submit(db, company)
    document = await document_service.create_identity_document(db, company, file)
    try:
        verification = verification_service.create_verification(db, company, document)
    except Exception:
        # 认证申请创建失败时清理刚保存的孤儿材料
        document_service.delete_document(db, document)
        raise
    return verification_service.verification_out(db, verification)


@router.get(
    "/company/verification",
    response_model=VerificationStateOut,
    summary="查询企业认证状态与历史",
)
def get_company_verification(
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> VerificationStateOut:
    company = company_service.get_company_of(db, user)
    return verification_service.get_verification_state(db, company)
