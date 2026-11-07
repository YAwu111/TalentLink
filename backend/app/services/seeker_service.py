"""求职者资料：完整度、年龄计算与字段级更新。"""

import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ServiceError
from app.models import Seeker, User
from app.schemas.seeker import SeekerPatch, SeekerProfile

logger = logging.getLogger("talentlink.seeker")

FIELD_WEIGHTS: dict[str, int] = {
    "name": 12,
    "gender": 4,
    "birth_date": 8,
    "phone": 12,
    "email": 8,
    "household": 4,
    "education": 8,
    "major": 5,
    "degree": 4,
    "school": 8,
    "skills": 10,
    "job_intention": 8,
    "expected_salary": 9,
}

FIELD_LABELS = {
    "name": "姓名",
    "gender": "性别",
    "birth_date": "出生日期",
    "phone": "联系电话",
    "email": "邮箱",
    "household": "户籍所在地",
    "education": "学历",
    "major": "专业",
    "degree": "学位",
    "school": "毕业学校",
    "skills": "技能",
    "job_intention": "求职意向",
    "expected_salary": "期望薪资",
}


def _filled(seeker: Seeker, field: str) -> bool:
    if field == "birth_date":
        return seeker.birth_date is not None
    if field == "expected_salary":
        return (
            seeker.expected_salary_min > 0
            and seeker.expected_salary_max > 0
            and seeker.expected_salary_min <= seeker.expected_salary_max
        )
    value = getattr(seeker, field)
    return bool(str(value).strip()) if value is not None else False


def seeker_metrics(seeker: Seeker) -> tuple[int, bool, list[str]]:
    missing = [field for field in FIELD_WEIGHTS if not _filled(seeker, field)]
    completeness = sum(
        weight for field, weight in FIELD_WEIGHTS.items() if field not in missing
    )
    return completeness, not missing, missing


def calculate_age(birth_date: date | None) -> int | None:
    if birth_date is None:
        return None
    today = date.today()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )


def seeker_profile(seeker: Seeker) -> SeekerProfile:
    completeness, is_complete, missing = seeker_metrics(seeker)
    return SeekerProfile(
        id=seeker.id,
        name=seeker.name,
        gender=seeker.gender,
        birth_date=seeker.birth_date,
        age=calculate_age(seeker.birth_date),
        phone=seeker.phone,
        email=seeker.email,
        household=seeker.household,
        education=seeker.education,
        major=seeker.major,
        degree=seeker.degree,
        school=seeker.school,
        skills=seeker.skills,
        job_intention=seeker.job_intention,
        expected_salary_min=seeker.expected_salary_min,
        expected_salary_max=seeker.expected_salary_max,
        work_company=seeker.work_company,
        work_title=seeker.work_title,
        work_start=seeker.work_start,
        work_end=seeker.work_end,
        work_description=seeker.work_description,
        accepted_offer_id=seeker.accepted_offer_id,
        completeness=completeness,
        is_complete=is_complete,
        missing_fields=missing,
        can_apply=is_complete,
        updated_at=seeker.updated_at,
    )


def get_seeker_of(db: Session, user: User) -> Seeker:
    seeker = db.scalar(select(Seeker).where(Seeker.user_id == user.id))
    if seeker is None:
        raise ServiceError(404, "求职者资料不存在，请联系管理员")
    return seeker


def update_seeker(db: Session, user: User, payload: SeekerPatch) -> SeekerProfile:
    seeker = get_seeker_of(db, user)
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        return seeker_profile(seeker)

    if "birth_date" in changes and changes["birth_date"] is not None:
        if changes["birth_date"] > date.today():
            raise ServiceError(422, "出生日期不能晚于今天")

    min_salary = changes.get("expected_salary_min", seeker.expected_salary_min)
    max_salary = changes.get("expected_salary_max", seeker.expected_salary_max)
    if min_salary > 0 and max_salary > 0 and min_salary > max_salary:
        raise ServiceError(422, "期望薪资下限不能高于上限")

    for field, value in changes.items():
        if field in {"birth_date", "email"}:
            setattr(seeker, field, value)
        elif field in {"expected_salary_min", "expected_salary_max"}:
            setattr(seeker, field, int(value or 0))
        else:
            setattr(seeker, field, value or "")

    db.commit()
    db.refresh(seeker)
    logger.info(
        "求职者更新资料 seeker_id=%s fields=%s completeness=%s",
        seeker.id,
        ",".join(changes),
        seeker_metrics(seeker)[0],
    )
    return seeker_profile(seeker)


def ensure_seeker_complete(seeker: Seeker) -> None:
    """真实投递接口接入时统一调用。"""
    _, is_complete, missing = seeker_metrics(seeker)
    if is_complete:
        return
    labels = "、".join(FIELD_LABELS[field] for field in missing)
    raise ServiceError(409, f"求职者资料未完善，请先补全：{labels}")
