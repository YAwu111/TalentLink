"""真实岗位浏览、企业岗位管理与求职者投递。"""

import logging
import re
from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import ServiceError
from app.models import (
    Application,
    ApplicationStatus,
    Company,
    Job,
    JobStatus,
    Seeker,
)
from app.schemas.job import (
    ApplicationOut,
    JobCompanyOut,
    JobCreate,
    JobOut,
    JobUpdate,
)
from app.services import company_service, seeker_service

logger = logging.getLogger("talentlink.jobs")


def _city(address: str) -> str:
    match = re.search(r"([\u4e00-\u9fa5]{2,10}市)", address or "")
    return match.group(1) if match else (address[:12] if address else "—")


def _salary_valid(minimum: int, maximum: int | None) -> None:
    if minimum < 0 or (maximum is not None and maximum < 0):
        raise ServiceError(422, "薪资不能为负数")
    if maximum is not None and minimum > maximum:
        raise ServiceError(422, "薪资下限不能高于上限")


def _company_out(company: Company) -> JobCompanyOut:
    return JobCompanyOut(
        id=company.id,
        name=company.name,
        industry=company.industry,
        address=company.address,
        verified=company.verified,
    )


def job_out(job: Job, company: Company, applied: bool = False) -> JobOut:
    return JobOut(
        id=job.id,
        title=job.title,
        requirement=job.requirement,
        other_requirement=job.other_requirement,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        headcount=job.headcount,
        status=job.status.value,
        published_at=job.published_at,
        company=_company_out(company),
        applied=applied,
    )


def _application_out(db: Session, application: Application) -> ApplicationOut:
    job = db.get(Job, application.job_id)
    if job is None:
        raise ServiceError(500, "投递关联岗位缺失")
    company = db.get(Company, job.company_id)
    if company is None:
        raise ServiceError(500, "投递关联企业缺失")
    offer = application.offer
    return ApplicationOut(
        id=application.id,
        job_id=job.id,
        job_title=job.title,
        company_name=company.name,
        city=_city(company.address),
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        status=application.status.value,
        note=application.note,
        applied_at=application.created_at,
        offer_salary=offer.salary if offer else None,
    )


def _applied_job_ids(db: Session, seeker: Seeker) -> set[int]:
    return set(
        db.scalars(
            select(Application.job_id).where(Application.seeker_id == seeker.id)
        )
    )


def list_published_jobs(
    db: Session,
    seeker: Seeker,
    *,
    keyword: str | None = None,
    city: str | None = None,
    industry: str | None = None,
    salary_min: int | None = None,
    salary_max: int | None = None,
) -> list[JobOut]:
    conditions = [Job.status == JobStatus.published]
    if keyword and keyword.strip():
        term = f"%{keyword.strip()}%"
        conditions.append(
            or_(
                Job.title.like(term),
                Job.requirement.like(term),
                Company.name.like(term),
            )
        )
    if industry and industry.strip() and industry != "全部行业":
        conditions.append(Company.industry == industry.strip())
    if city and city.strip() and city != "全部城市":
        conditions.append(Company.address.like(f"%{city.strip()}%"))
    if salary_min and salary_min > 0:
        conditions.append(Job.salary_max.is_not(None))
        conditions.append(Job.salary_max >= salary_min)
    if salary_max and salary_max > 0:
        conditions.append(Job.salary_min <= salary_max)

    rows = db.execute(
        select(Job, Company)
        .join(Company, Job.company_id == Company.id)
        .where(*conditions)
        .order_by(Job.published_at.desc(), Job.id.desc())
    ).all()
    applied = _applied_job_ids(db, seeker)
    return [job_out(job, company, job.id in applied) for job, company in rows]


def get_published_job(db: Session, seeker: Seeker, job_id: int) -> JobOut:
    row = db.execute(
        select(Job, Company)
        .join(Company, Job.company_id == Company.id)
        .where(Job.id == job_id, Job.status == JobStatus.published)
    ).first()
    if row is None:
        raise ServiceError(404, "岗位不存在或已关闭")
    job, company = row
    applied = job.id in _applied_job_ids(db, seeker)
    return job_out(job, company, applied)


def _owned_job(db: Session, company: Company, job_id: int) -> Job:
    job = db.scalar(
        select(Job).where(Job.id == job_id, Job.company_id == company.id)
    )
    if job is None:
        raise ServiceError(404, "岗位不存在")
    return job


def list_employer_jobs(db: Session, company: Company) -> list[JobOut]:
    jobs = list(
        db.scalars(
            select(Job)
            .where(Job.company_id == company.id)
            .order_by(Job.id.desc())
        )
    )
    return [job_out(job, company) for job in jobs]


def create_job(db: Session, company: Company, payload: JobCreate) -> JobOut:
    if not payload.title.strip():
        raise ServiceError(422, "岗位名称不能为空")
    _salary_valid(payload.salary_min, payload.salary_max)
    job = Job(
        company_id=company.id,
        title=payload.title.strip(),
        requirement=payload.requirement,
        other_requirement=payload.other_requirement,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        headcount=payload.headcount,
        status=JobStatus.draft,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    logger.info("企业创建岗位 company_id=%s job_id=%s", company.id, job.id)
    return job_out(job, company)


def update_job(
    db: Session, company: Company, job_id: int, payload: JobUpdate
) -> JobOut:
    job = _owned_job(db, company, job_id)
    changes = payload.model_dump(exclude_unset=True)
    minimum = changes.get("salary_min", job.salary_min)
    maximum = changes.get("salary_max", job.salary_max)
    _salary_valid(minimum, maximum)
    for field, value in changes.items():
        if field == "title" and value is not None:
            value = value.strip()
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    logger.info("企业更新岗位 company_id=%s job_id=%s", company.id, job.id)
    return job_out(job, company)


def publish_job(db: Session, company: Company, job_id: int) -> JobOut:
    job = _owned_job(db, company, job_id)
    if job.status is JobStatus.published:
        raise ServiceError(409, "岗位已经发布")
    if not job.title.strip() or not job.requirement.strip() or job.salary_min <= 0:
        raise ServiceError(422, "请先完善岗位名称、岗位要求和薪资")
    company_service.ensure_company_complete(company)
    job.status = JobStatus.published
    job.published_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(job)
    logger.info("企业发布岗位 company_id=%s job_id=%s", company.id, job.id)
    return job_out(job, company)


def close_job(db: Session, company: Company, job_id: int) -> JobOut:
    job = _owned_job(db, company, job_id)
    if job.status is not JobStatus.published:
        raise ServiceError(409, "只有已发布岗位可以关闭")
    job.status = JobStatus.closed
    db.commit()
    db.refresh(job)
    logger.info("企业关闭岗位 company_id=%s job_id=%s", company.id, job.id)
    return job_out(job, company)


def apply_job(
    db: Session, seeker: Seeker, job_id: int, note: str | None = None
) -> ApplicationOut:
    """投递：求职者资料完整、岗位已发布、企业资料完整，且不可重复投递。"""
    seeker_service.ensure_seeker_complete(seeker)
    row = db.execute(
        select(Job, Company)
        .join(Company, Job.company_id == Company.id)
        .where(Job.id == job_id, Job.status == JobStatus.published)
    ).first()
    if row is None:
        raise ServiceError(404, "岗位不存在或已关闭")
    job, company = row
    company_service.ensure_company_complete(company)
    existing = db.scalar(
        select(Application.id).where(
            Application.job_id == job.id,
            Application.seeker_id == seeker.id,
        )
    )
    if existing is not None:
        raise ServiceError(409, "你已经投递过该岗位")
    application = Application(
        job_id=job.id,
        seeker_id=seeker.id,
        status=ApplicationStatus.submitted,
        note=(note or "").strip()[:1000],
    )
    db.add(application)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError(409, "你已经投递过该岗位") from exc
    db.refresh(application)
    logger.info(
        "求职者投递 seeker_id=%s job_id=%s application_id=%s",
        seeker.id,
        job.id,
        application.id,
    )
    return _application_out(db, application)


def list_seeker_applications(db: Session, seeker: Seeker) -> list[ApplicationOut]:
    applications = list(
        db.scalars(
            select(Application)
            .where(Application.seeker_id == seeker.id)
            .order_by(Application.created_at.desc(), Application.id.desc())
        )
    )
    return [_application_out(db, item) for item in applications]
