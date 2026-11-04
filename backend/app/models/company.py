from typing import TYPE_CHECKING, List

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.user import User


class Company(Base, TimestampMixin):
    """企业档案，与账号 1:1；岗位挂在这里而不是用户上。"""

    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(100), index=True)
    phone: Mapped[str] = mapped_column(String(20))
    address: Mapped[str] = mapped_column(String(200))
    intro: Mapped[str] = mapped_column(Text, default="")
    industry: Mapped[str] = mapped_column(String(50), index=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="company")
    jobs: Mapped[List["Job"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
