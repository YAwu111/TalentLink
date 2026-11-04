from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.application import Application


class Offer(Base, TimestampMixin):
    """录用信息：挂在投递记录上，1:1，可重发（拒绝后企业改条件再发）。"""

    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), unique=True, index=True
    )
    salary: Mapped[int] = mapped_column(Integer, default=0)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    message: Mapped[str] = mapped_column(Text, default="")

    application: Mapped["Application"] = relationship(back_populates="offer")
