from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.user import User


class Seeker(Base, TimestampMixin):
    """求职者档案（即任务书里的"求职者信息表单"）。

    年龄不落库：存 birth_date，接口层实时算，避免数据一年后集体失真。
    """

    __tablename__ = "seekers"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(50), index=True)
    gender: Mapped[str] = mapped_column(String(10), default="")
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    phone: Mapped[str] = mapped_column(String(20), default="")
    email: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    household: Mapped[str] = mapped_column(String(100), default="")
    education: Mapped[str] = mapped_column(String(20), default="")
    major: Mapped[str] = mapped_column(String(50), default="")
    degree: Mapped[str] = mapped_column(String(20), default="")
    school: Mapped[str] = mapped_column(String(100), default="")
    skills: Mapped[str] = mapped_column(Text, default="")
    job_intention: Mapped[str] = mapped_column(String(100), default="")
    expected_salary_min: Mapped[int] = mapped_column(Integer, default=0)
    expected_salary_max: Mapped[int] = mapped_column(Integer, default=0)
    work_company: Mapped[str] = mapped_column(String(100), default="")
    work_title: Mapped[str] = mapped_column(String(100), default="")
    work_start: Mapped[str] = mapped_column(String(20), default="")
    work_end: Mapped[str] = mapped_column(String(20), default="")
    work_description: Mapped[str] = mapped_column(Text, default="")
    accepted_offer_id: Mapped[int | None] = mapped_column(
        Integer, unique=True, nullable=True
    )

    user: Mapped["User"] = relationship(back_populates="seeker")
    applications: Mapped[List["Application"]] = relationship(
        back_populates="seeker", cascade="all, delete-orphan"
    )
