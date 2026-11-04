from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import Role, UserStatus, str_enum

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.seeker import Seeker


class User(Base, TimestampMixin):
    """账号表：只负责登录与身份标识，不承载任何业务档案字段。"""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    role: Mapped[Role] = mapped_column(str_enum(Role), index=True)
    status: Mapped[UserStatus] = mapped_column(
        str_enum(UserStatus), default=UserStatus.active
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    company: Mapped[Optional["Company"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    seeker: Mapped[Optional["Seeker"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
