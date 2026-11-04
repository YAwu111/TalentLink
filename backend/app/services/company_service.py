"""企业资料业务：字段级草稿保存、完整度计算与投递闸门。"""

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ServiceError
from app.models import Company, User
from app.schemas.company import CompanyPatch, CompanyProfile

logger = logging.getLogger("talentlink.company")

# 与前端 CompanyProfilePage 的权重保持一致；修改时两端必须同步
FIELD_WEIGHTS: dict[str, int] = {
    "name": 30,
    "industry": 15,
    "phone": 20,
    "address": 15,
    "intro": 20,
}

FIELD_LABELS: dict[str, str] = {
    "name": "企业名称",
    "industry": "经营行业",
    "phone": "企业电话",
    "address": "企业地址",
    "intro": "企业简介",
}


def _is_filled(value: str) -> bool:
    return bool(value and value.strip())


def company_metrics(company: Company) -> tuple[int, bool, list[str]]:
    missing = [
        field for field in FIELD_WEIGHTS if not _is_filled(getattr(company, field))
    ]
    completeness = sum(
        weight
        for field, weight in FIELD_WEIGHTS.items()
        if field not in missing
    )
    return completeness, not missing, missing


def company_profile(company: Company) -> CompanyProfile:
    completeness, is_complete, missing = company_metrics(company)
    return CompanyProfile(
        id=company.id,
        name=company.name,
        phone=company.phone,
        address=company.address,
        intro=company.intro,
        industry=company.industry,
        verified=company.verified,
        completeness=completeness,
        is_complete=is_complete,
        missing_fields=missing,
        can_receive_applications=is_complete,
        updated_at=company.updated_at,
    )


def get_company_of(db: Session, user: User) -> Company:
    company = db.scalar(select(Company).where(Company.user_id == user.id))
    if company is None:
        raise ServiceError(404, "企业资料不存在，请联系管理员")
    return company


def update_company(db: Session, user: User, payload: CompanyPatch) -> CompanyProfile:
    company = get_company_of(db, user)
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not changes:
        return company_profile(company)

    for field, value in changes.items():
        setattr(company, field, value)

    db.commit()
    db.refresh(company)
    logger.info(
        "企业更新资料 company_id=%s fields=%s completeness=%s",
        company.id,
        ",".join(changes),
        company_metrics(company)[0],
    )
    return company_profile(company)


def ensure_company_complete(company: Company) -> None:
    """岗位发布、投递、推送接入时统一调用，避免各模块重复判断。"""
    _, is_complete, missing = company_metrics(company)
    if is_complete:
        return

    labels = "、".join(FIELD_LABELS[field] for field in missing)
    raise ServiceError(409, f"企业资料未完善，请先补全：{labels}")
