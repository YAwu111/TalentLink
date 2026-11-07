"""企业查看投递、求职者简历与投递状态流转。"""

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ServiceError
from app.models import Application, ApplicationStatus, Company, Job
from app.schemas.application import (
    ApplicationStatusUpdate,
    EmployerApplicationDetailOut,
    EmployerApplicationOut,
)
from app.services import job_service, offer_service, seeker_service

logger = logging.getLogger("talentlink.applications")

ALLOWED_TARGETS = {
    ApplicationStatus.viewed,
    ApplicationStatus.interview,
    ApplicationStatus.rejected,
}

TRANSITIONS: dict[ApplicationStatus, set[ApplicationStatus]] = {
    ApplicationStatus.submitted: {
        ApplicationStatus.viewed,
        ApplicationStatus.interview,
        ApplicationStatus.rejected,
    },
    ApplicationStatus.viewed: {
        ApplicationStatus.viewed,
        ApplicationStatus.interview,
        ApplicationStatus.rejected,
    },
    ApplicationStatus.interview: {
        ApplicationStatus.interview,
        ApplicationStatus.rejected,
    },
    ApplicationStatus.offered: set(),
    ApplicationStatus.offer_accepted: set(),
    ApplicationStatus.offer_declined: set(),
    ApplicationStatus.offer_revoked: set(),
    ApplicationStatus.rejected: set(),
}


def _summary(application: Application) -> EmployerApplicationOut:
    seeker = application.seeker
    job = application.job
    return EmployerApplicationOut(
        id=application.id,
        job_id=job.id,
        job_title=job.title,
        seeker_id=seeker.id,
        seeker_name=seeker.name,
        gender=seeker.gender,
        age=seeker_service.calculate_age(seeker.birth_date),
        education=seeker.education,
        school=seeker.school,
        major=seeker.major,
        job_intention=seeker.job_intention,
        expected_salary_min=seeker.expected_salary_min,
        expected_salary_max=seeker.expected_salary_max,
        status=application.status.value,
        note=application.note,
        applied_at=application.created_at,
    )


def _owned_application(
    db: Session, company: Company, application_id: int
) -> Application:
    application = db.scalar(
        select(Application)
        .join(Job, Application.job_id == Job.id)
        .where(
            Application.id == application_id,
            Job.company_id == company.id,
        )
    )
    if application is None:
        raise ServiceError(404, "投递记录不存在")
    return application


def _detail(
    db: Session, company: Company, application: Application
) -> EmployerApplicationDetailOut:
    job = db.get(Job, application.job_id)
    if job is None:
        raise ServiceError(404, "投递关联岗位不存在")
    return EmployerApplicationDetailOut(
        application=_summary(application),
        seeker=seeker_service.seeker_profile(application.seeker),
        job=job_service.job_out(job, company),
        offer=offer_service.offer_out(application.offer) if application.offer else None,
    )


def list_applications(
    db: Session,
    company: Company,
    *,
    job_id: int | None = None,
    status: str | None = None,
) -> list[EmployerApplicationOut]:
    conditions = [Job.company_id == company.id]
    if job_id is not None:
        conditions.append(Application.job_id == job_id)
    if status:
        try:
            conditions.append(Application.status == ApplicationStatus(status))
        except ValueError as exc:
            raise ServiceError(422, "无效的投递状态") from exc
    applications = list(
        db.scalars(
            select(Application)
            .join(Job, Application.job_id == Job.id)
            .where(*conditions)
            .order_by(Application.created_at.desc(), Application.id.desc())
        )
    )
    return [_summary(item) for item in applications]


def get_application(
    db: Session, company: Company, application_id: int
) -> EmployerApplicationDetailOut:
    application = _owned_application(db, company, application_id)
    return _detail(db, company, application)


def update_status(
    db: Session,
    company: Company,
    application_id: int,
    payload: ApplicationStatusUpdate,
) -> EmployerApplicationDetailOut:
    application = _owned_application(db, company, application_id)
    target = ApplicationStatus(payload.status)
    if target not in ALLOWED_TARGETS:
        raise ServiceError(422, "不支持设置该投递状态")
    current = application.status
    if target not in TRANSITIONS[current]:
        raise ServiceError(
            409,
            f"投递当前状态为 {current.value}，不能变更为 {target.value}",
        )
    if target is not current:
        application.status = target
        db.commit()
        db.refresh(application)
        logger.info(
            "企业更新投递状态 company_id=%s application_id=%s %s->%s",
            company.id,
            application.id,
            current.value,
            target.value,
        )
    return _detail(db, company, application)
