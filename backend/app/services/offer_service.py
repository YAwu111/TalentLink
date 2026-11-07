"""录用通知：企业发送/撤回，求职者接受/拒绝，保证一个求职者只能接受一个 Offer。"""

import logging
import re
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import ServiceError
from app.models import (
    Application,
    ApplicationStatus,
    Company,
    Job,
    Offer,
    OfferStatus,
    Seeker,
)
from app.schemas.offer import OfferCreate, OfferOut, SeekerOfferOut

logger = logging.getLogger("talentlink.offers")


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _city(address: str) -> str:
    match = re.search(r"([\u4e00-\u9fa5]{2,10}市)", address or "")
    return match.group(1) if match else (address[:12] if address else "—")


def offer_out(offer: Offer) -> OfferOut:
    return OfferOut(
        id=offer.id,
        application_id=offer.application_id,
        salary=offer.salary,
        start_date=offer.start_date,
        message=offer.message,
        status=offer.status.value,
        sent_at=offer.sent_at,
        responded_at=offer.responded_at,
    )


def seeker_offer_out(
    offer: Offer, application: Application, job: Job, company: Company
) -> SeekerOfferOut:
    return SeekerOfferOut(
        id=offer.id,
        application_id=offer.application_id,
        salary=offer.salary,
        start_date=offer.start_date,
        message=offer.message,
        status=offer.status.value,
        sent_at=offer.sent_at,
        responded_at=offer.responded_at,
        job_id=job.id,
        job_title=job.title,
        company_name=company.name,
        city=_city(company.address),
        application_status=application.status.value,
    )


def _owned_application(db: Session, company: Company, application_id: int) -> Application:
    application = db.scalar(
        select(Application)
        .join(Job, Application.job_id == Job.id)
        .where(Application.id == application_id, Job.company_id == company.id)
    )
    if application is None:
        raise ServiceError(404, "投递记录不存在")
    return application


def send_offer(
    db: Session,
    company: Company,
    application_id: int,
    payload: OfferCreate,
) -> OfferOut:
    application = _owned_application(db, company, application_id)
    seeker = application.seeker
    if seeker.accepted_offer_id is not None:
        raise ServiceError(409, "该求职者已经接受了其他录用通知")
    if application.status in {
        ApplicationStatus.offer_accepted,
        ApplicationStatus.offer_declined,
        ApplicationStatus.rejected,
    }:
        raise ServiceError(409, "该投递已结束，不能再次发放录用通知")

    offer = application.offer
    if offer is not None and offer.status is OfferStatus.accepted:
        raise ServiceError(409, "该投递的录用通知已被接受")

    if offer is None:
        offer = Offer(
            application_id=application.id,
            salary=payload.salary,
            start_date=payload.start_date,
            message=payload.message.strip(),
            status=OfferStatus.sent,
            sent_at=_now(),
        )
        db.add(offer)
    else:
        offer.salary = payload.salary
        offer.start_date = payload.start_date
        offer.message = payload.message.strip()
        offer.status = OfferStatus.sent
        offer.sent_at = _now()
        offer.responded_at = None

    application.status = ApplicationStatus.offered
    db.commit()
    db.refresh(offer)
    logger.info(
        "企业发送录用 company_id=%s application_id=%s offer_id=%s salary=%s",
        company.id,
        application.id,
        offer.id,
        offer.salary,
    )
    return offer_out(offer)


def revoke_offer(db: Session, company: Company, application_id: int) -> OfferOut:
    application = _owned_application(db, company, application_id)
    offer = application.offer
    if offer is None:
        raise ServiceError(404, "该投递还没有录用通知")
    if offer.status not in {OfferStatus.sent, OfferStatus.accepted}:
        raise ServiceError(409, "只有待回应或已接受的录用通知可以撤回")
    offer.status = OfferStatus.revoked
    offer.responded_at = _now()
    if application.status is ApplicationStatus.offer_accepted:
        application.status = ApplicationStatus.offer_revoked
        if application.seeker.accepted_offer_id == offer.id:
            application.seeker.accepted_offer_id = None
    else:
        # 撤回待回应 Offer 后回到面试阶段，企业可以修改条件后重新发放
        application.status = ApplicationStatus.interview
    db.commit()
    db.refresh(offer)
    logger.info(
        "企业撤回录用 company_id=%s application_id=%s offer_id=%s previous_status=%s",
        company.id,
        application.id,
        offer.id,
        "accepted" if application.status is ApplicationStatus.offer_revoked else "sent",
    )
    return offer_out(offer)


def list_seeker_offers(db: Session, seeker: Seeker) -> list[SeekerOfferOut]:
    rows = db.execute(
        select(Offer, Application, Job, Company)
        .join(Application, Offer.application_id == Application.id)
        .join(Job, Application.job_id == Job.id)
        .join(Company, Job.company_id == Company.id)
        .where(Application.seeker_id == seeker.id)
        .order_by(Offer.sent_at.desc(), Offer.id.desc())
    ).all()
    return [seeker_offer_out(offer, app, job, company) for offer, app, job, company in rows]


def _owned_offer(db: Session, seeker: Seeker, offer_id: int) -> Offer:
    offer = db.scalar(
        select(Offer)
        .join(Application, Offer.application_id == Application.id)
        .where(Offer.id == offer_id, Application.seeker_id == seeker.id)
    )
    if offer is None:
        raise ServiceError(404, "录用通知不存在")
    return offer


def accept_offer(db: Session, seeker: Seeker, offer_id: int) -> SeekerOfferOut:
    offer = _owned_offer(db, seeker, offer_id)
    if offer.status is not OfferStatus.sent:
        raise ServiceError(409, "该录用通知已处理")
    if seeker.accepted_offer_id is not None:
        raise ServiceError(409, "你已经接受了其他录用通知")

    now = _now()
    application = offer.application
    offer.status = OfferStatus.accepted
    offer.responded_at = now
    application.status = ApplicationStatus.offer_accepted
    seeker.accepted_offer_id = offer.id

    # 接受一个 Offer 后，其他待响应 Offer 自动失效
    other_offers = list(
        db.scalars(
            select(Offer)
            .join(Application, Offer.application_id == Application.id)
            .where(
                Application.seeker_id == seeker.id,
                Offer.status == OfferStatus.sent,
                Offer.id != offer.id,
            )
        )
    )
    for other in other_offers:
        other.status = OfferStatus.declined
        other.responded_at = now
        other.application.status = ApplicationStatus.offer_declined

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError(409, "你已经接受了其他录用通知") from exc
    db.refresh(offer)
    logger.info(
        "求职者接受录用 seeker_id=%s offer_id=%s application_id=%s",
        seeker.id,
        offer.id,
        application.id,
    )
    return seeker_offer_out(offer, application, application.job, application.job.company)


def decline_offer(db: Session, seeker: Seeker, offer_id: int) -> SeekerOfferOut:
    offer = _owned_offer(db, seeker, offer_id)
    if offer.status is not OfferStatus.sent:
        raise ServiceError(409, "该录用通知已处理")
    offer.status = OfferStatus.declined
    offer.responded_at = _now()
    offer.application.status = ApplicationStatus.offer_declined
    db.commit()
    db.refresh(offer)
    logger.info(
        "求职者拒绝录用 seeker_id=%s offer_id=%s application_id=%s",
        seeker.id,
        offer.id,
        offer.application_id,
    )
    return seeker_offer_out(
        offer, offer.application, offer.application.job, offer.application.job.company
    )
