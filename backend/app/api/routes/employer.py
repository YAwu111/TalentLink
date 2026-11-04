from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models import Role, User
from app.schemas.company import CompanyPatch, CompanyProfile
from app.services import company_service

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
