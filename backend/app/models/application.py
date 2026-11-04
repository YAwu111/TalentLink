from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Index, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import ApplicationStatus, str_enum

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.offer import Offer
    from app.models.seeker import Seeker


class Application(Base, TimestampMixin):
    """投递记录：求职者 × 岗位的多对多关联实体，关系本身带状态。"""

    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("job_id", "seeker_id", name="uq_applications_job_seeker"),
        Index("ix_applications_seeker_created", "seeker_id", "created_at"),
        Index("ix_applications_job_status", "job_id", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), index=True
    )
    seeker_id: Mapped[int] = mapped_column(
        ForeignKey("seekers.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        str_enum(ApplicationStatus), default=ApplicationStatus.submitted
    )
    note: Mapped[str] = mapped_column(Text, default="")

    job: Mapped["Job"] = relationship(back_populates="applications")
    seeker: Mapped["Seeker"] = relationship(back_populates="applications")
    offer: Mapped[Optional["Offer"]] = relationship(
        back_populates="application", uselist=False, cascade="all, delete-orphan"
    )
