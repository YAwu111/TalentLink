from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import OfferStatus, str_enum

if TYPE_CHECKING:
    from app.models.application import Application


class Offer(Base, TimestampMixin):
    """录用通知：挂在投递上，1:1；同一求职者最多接受一个。"""

    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), unique=True, index=True
    )
    salary: Mapped[int] = mapped_column(Integer, default=0)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    message: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[OfferStatus] = mapped_column(
        str_enum(OfferStatus), default=OfferStatus.sent
    )
    sent_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    application: Mapped["Application"] = relationship(back_populates="offer")
