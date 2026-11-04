from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import JobStatus, str_enum

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.company import Company


class Job(Base, TimestampMixin):
    """招聘岗位：一个企业可有多个岗位，一行一个岗位。"""

    __tablename__ = "jobs"
    __table_args__ = (Index("ix_jobs_company_status", "company_id", "status"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(100), index=True)
    requirement: Mapped[str] = mapped_column(Text, default="")
    other_requirement: Mapped[str] = mapped_column(Text, default="")
    salary_min: Mapped[int] = mapped_column(Integer, default=0)
    salary_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    headcount: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[JobStatus] = mapped_column(
        str_enum(JobStatus), default=JobStatus.draft
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    company: Mapped["Company"] = relationship(back_populates="jobs")
    applications: Mapped[List["Application"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )
