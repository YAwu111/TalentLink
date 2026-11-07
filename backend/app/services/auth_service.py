"""认证业务逻辑：与 HTTP 层解耦，路由只负责取参和写 Cookie。"""

import logging
from datetime import date, datetime, timedelta, timezone

from fastapi import Request
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    hash_password,
    hash_refresh_token,
    new_refresh_token,
    verify_password,
)
from app.models import Company, RefreshToken, Role, Seeker, User, UserStatus
from app.schemas.auth import RegisterRequest

logger = logging.getLogger("talentlink.auth")


class AuthError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


def _utcnow() -> datetime:
    """统一用 naive UTC，与 SQLite 的 CURRENT_TIMESTAMP 保持同一时区语义。"""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _client_meta(request: Request) -> tuple[str, str]:
    agent = (request.headers.get("user-agent") or "")[:255]
    ip = request.client.host if request.client else ""
    return agent, ip


def calculate_age(birth_date: date | None) -> int | None:
    if not birth_date:
        return None
    today = date.today()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )


def serialize_user(user: User) -> dict:
    """统一用户视图：账号信息 + 对应角色档案。"""
    profile: dict | None = None
    display_name = user.username

    if user.role == Role.seeker and user.seeker is not None:
        item: Seeker = user.seeker
        display_name = item.name
        profile = {
            "id": item.id,
            "name": item.name,
            "gender": item.gender,
            "age": calculate_age(item.birth_date),
            "birth_date": item.birth_date.isoformat() if item.birth_date else None,
            "phone": item.phone,
            "email": item.email,
            "household": item.household,
            "education": item.education,
            "major": item.major,
            "degree": item.degree,
            "school": item.school,
            "skills": item.skills,
            "job_intention": item.job_intention,
            "expected_salary_min": item.expected_salary_min,
            "expected_salary_max": item.expected_salary_max,
            "work_company": item.work_company,
            "work_title": item.work_title,
            "work_start": item.work_start,
            "work_end": item.work_end,
            "work_description": item.work_description,
            "accepted_offer_id": item.accepted_offer_id,
        }
    elif user.role == Role.employer and user.company is not None:
        item_company: Company = user.company
        display_name = item_company.name or user.username
        profile = {
            "id": item_company.id,
            "name": item_company.name,
            "phone": item_company.phone,
            "address": item_company.address,
            "intro": item_company.intro,
            "industry": item_company.industry,
            "verified": item_company.verified,
        }
    elif user.role == Role.admin:
        display_name = "系统管理员"

    return {
        "id": user.id,
        "username": user.username,
        "role": user.role.value,
        "status": user.status.value,
        "display_name": display_name,
        "profile": profile,
    }


def register(db: Session, payload: RegisterRequest) -> User:
    if db.scalar(select(User).where(User.username == payload.username)):
        raise AuthError(409, "用户名已被占用")

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=Role(payload.role),
        status=UserStatus.active,
    )
    db.add(user)
    db.flush()

    if user.role == Role.seeker:
        db.add(Seeker(user_id=user.id, name=payload.display_name))
    else:
        db.add(
            Company(
                user_id=user.id,
                name=payload.display_name,
                phone="",
                address="",
                industry="",
            )
        )
    db.commit()
    db.refresh(user)
    logger.info("新用户注册 id=%s username=%s role=%s", user.id, user.username, user.role.value)
    return user


def authenticate(db: Session, username: str, password: str) -> User:
    user = db.scalar(select(User).where(User.username == username))
    # 统一错误文案，不暴露"用户名不存在"这一信息
    if user is None or not verify_password(password, user.password_hash):
        logger.warning("登录失败 username=%s 原因=凭据错误", username)
        raise AuthError(401, "用户名或密码错误")
    if user.status is not UserStatus.active:
        logger.warning("登录失败 username=%s 原因=账号被禁用", username)
        raise AuthError(403, "账号已被禁用")

    user.last_login_at = _utcnow()
    db.commit()
    logger.info("登录成功 id=%s username=%s role=%s", user.id, user.username, user.role.value)
    return user


def _create_refresh_row(db: Session, user: User, request: Request) -> str:
    raw, token_hash = new_refresh_token()
    agent, ip = _client_meta(request)
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=_utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            user_agent=agent,
            ip=ip,
        )
    )
    db.commit()
    return raw


def create_session(db: Session, user: User, request: Request) -> tuple[str, str]:
    """登录/注册成功后签发一对令牌。"""
    access = create_access_token(user.id, user.role.value)
    refresh = _create_refresh_row(db, user, request)
    return access, refresh


def rotate_session(db: Session, raw_refresh: str, request: Request) -> tuple[User, str, str]:
    """轮换刷新令牌；旧令牌一旦被重用，判定为泄露并踢掉该用户全部会话。"""
    token_hash = hash_refresh_token(raw_refresh)
    row = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if row is None:
        raise AuthError(401, "登录状态已失效，请重新登录")

    now = _utcnow()
    if row.revoked_at is not None:
        logger.warning(
            "刷新令牌重用 user_id=%s token_id=%s，吊销该用户全部会话",
            row.user_id,
            row.id,
        )
        db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == row.user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        db.commit()
        raise AuthError(401, "检测到令牌异常使用，请重新登录")

    if row.expires_at <= now:
        logger.info("刷新令牌过期 user_id=%s token_id=%s", row.user_id, row.id)
        raise AuthError(401, "登录已过期，请重新登录")

    user = db.get(User, row.user_id)
    if user is None or user.status is not UserStatus.active:
        raise AuthError(403, "账号不可用")

    new_raw, new_hash = new_refresh_token()
    agent, ip = _client_meta(request)
    new_row = RefreshToken(
        user_id=user.id,
        token_hash=new_hash,
        expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        user_agent=agent,
        ip=ip,
    )
    db.add(new_row)
    db.flush()

    row.revoked_at = now
    row.replaced_by = new_row.id
    db.commit()

    logger.debug("刷新令牌轮换 user_id=%s %s -> %s", user.id, row.id, new_row.id)

    access = create_access_token(user.id, user.role.value)
    return user, access, new_raw


def revoke_session(db: Session, raw_refresh: str) -> None:
    row = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_refresh_token(raw_refresh)
        )
    )
    if row and row.revoked_at is None:
        row.revoked_at = _utcnow()
        db.commit()
        logger.info("用户登出 user_id=%s token_id=%s", row.user_id, row.id)
