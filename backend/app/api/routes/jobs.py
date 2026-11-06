from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models import Role, User
from app.schemas.job import ApplicationCreate, ApplicationOut, JobOut
from app.services import job_service, seeker_service

router = APIRouter(tags=["岗位与投递"])


@router.get("/jobs", response_model=list[JobOut], summary="浏览已发布岗位")
def list_jobs(
    keyword: str | None = Query(default=None),
    city: str | None = Query(default=None),
    industry: str | None = Query(default=None),
    salary_min: int | None = Query(default=None, ge=0),
    salary_max: int | None = Query(default=None, ge=0),
    user: User = Depends(require_roles(Role.seeker)),
    db: Session = Depends(get_db),
) -> list[JobOut]:
    seeker = seeker_service.get_seeker_of(db, user)
    return job_service.list_published_jobs(
        db,
        seeker,
        keyword=keyword,
        city=city,
        industry=industry,
        salary_min=salary_min,
        salary_max=salary_max,
    )


@router.get("/jobs/{job_id}", response_model=JobOut, summary="查看岗位详情")
def get_job(
    job_id: int,
    user: User = Depends(require_roles(Role.seeker)),
    db: Session = Depends(get_db),
) -> JobOut:
    seeker = seeker_service.get_seeker_of(db, user)
    return job_service.get_published_job(db, seeker, job_id)


@router.post(
    "/seeker/applications",
    response_model=ApplicationOut,
    status_code=201,
    summary="投递岗位",
)
def apply_job(
    payload: ApplicationCreate,
    user: User = Depends(require_roles(Role.seeker)),
    db: Session = Depends(get_db),
) -> ApplicationOut:
    seeker = seeker_service.get_seeker_of(db, user)
    return job_service.apply_job(db, seeker, payload.job_id, payload.note)


@router.get(
    "/seeker/applications",
    response_model=list[ApplicationOut],
    summary="我的投递",
)
def list_seeker_applications(
    user: User = Depends(require_roles(Role.seeker)),
    db: Session = Depends(get_db),
) -> list[ApplicationOut]:
    seeker = seeker_service.get_seeker_of(db, user)
    return job_service.list_seeker_applications(db, seeker)
