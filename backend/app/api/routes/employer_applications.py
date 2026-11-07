from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models import Role, User
from app.schemas.application import (
    ApplicationStatusUpdate,
    EmployerApplicationDetailOut,
    EmployerApplicationOut,
)
from app.schemas.offer import OfferCreate, OfferOut
from app.services import (
    company_service,
    employer_application_service,
    offer_service,
)

router = APIRouter(prefix="/employer/applications", tags=["企业投递"])


@router.get("", response_model=list[EmployerApplicationOut], summary="企业投递列表")
def list_applications(
    job_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> list[EmployerApplicationOut]:
    company = company_service.get_company_of(db, user)
    return employer_application_service.list_applications(
        db, company, job_id=job_id, status=status
    )


@router.get(
    "/{application_id}",
    response_model=EmployerApplicationDetailOut,
    summary="企业查看投递与求职者简历",
)
def get_application(
    application_id: int,
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> EmployerApplicationDetailOut:
    company = company_service.get_company_of(db, user)
    return employer_application_service.get_application(db, company, application_id)


@router.patch(
    "/{application_id}/status",
    response_model=EmployerApplicationDetailOut,
    summary="企业更新投递状态",
)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> EmployerApplicationDetailOut:
    company = company_service.get_company_of(db, user)
    return employer_application_service.update_status(
        db, company, application_id, payload
    )


@router.post(
    "/{application_id}/offer",
    response_model=OfferOut,
    summary="企业发放或修改录用通知",
)
def send_offer(
    application_id: int,
    payload: OfferCreate,
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> OfferOut:
    company = company_service.get_company_of(db, user)
    return offer_service.send_offer(db, company, application_id, payload)


@router.post(
    "/{application_id}/offer/revoke",
    response_model=OfferOut,
    summary="企业撤回待响应录用通知",
)
def revoke_offer(
    application_id: int,
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> OfferOut:
    company = company_service.get_company_of(db, user)
    return offer_service.revoke_offer(db, company, application_id)
