from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models import Role, User
from app.schemas.job import JobCreate, JobOut, JobUpdate
from app.services import company_service, job_service

router = APIRouter(prefix="/employer/jobs", tags=["企业岗位"])


@router.get("", response_model=list[JobOut], summary="企业岗位列表")
def list_employer_jobs(
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> list[JobOut]:
    company = company_service.get_company_of(db, user)
    return job_service.list_employer_jobs(db, company)


@router.post("", response_model=JobOut, status_code=201, summary="创建岗位草稿")
def create_job(
    payload: JobCreate,
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> JobOut:
    company = company_service.get_company_of(db, user)
    return job_service.create_job(db, company, payload)


@router.patch("/{job_id}", response_model=JobOut, summary="编辑岗位")
def update_job(
    job_id: int,
    payload: JobUpdate,
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> JobOut:
    company = company_service.get_company_of(db, user)
    return job_service.update_job(db, company, job_id, payload)


@router.post("/{job_id}/publish", response_model=JobOut, summary="发布岗位")
def publish_job(
    job_id: int,
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> JobOut:
    company = company_service.get_company_of(db, user)
    return job_service.publish_job(db, company, job_id)


@router.post("/{job_id}/close", response_model=JobOut, summary="关闭岗位")
def close_job(
    job_id: int,
    user: User = Depends(require_roles(Role.employer)),
    db: Session = Depends(get_db),
) -> JobOut:
    company = company_service.get_company_of(db, user)
    return job_service.close_job(db, company, job_id)
