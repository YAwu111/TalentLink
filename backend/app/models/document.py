from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.models.enums import (
    DocumentCategory,
    DocumentStatus,
    VerificationStatus,
    str_enum,
)


class CompanyDocument(Base, TimestampMixin):
    """企业上传的文档；文件本体在私有目录，库里只存相对路径。"""

    __tablename__ = "company_documents"
    __table_args__ = (
        Index("ix_company_documents_company_category", "company_id", "category"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    category: Mapped[DocumentCategory] = mapped_column(
        str_enum(DocumentCategory, 20), default=DocumentCategory.intro
    )
    original_name: Mapped[str] = mapped_column(String(255))
    storage_key: Mapped[str] = mapped_column(String(500), unique=True)
    mime_type: Mapped[str] = mapped_column(String(120))
    size: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str] = mapped_column(String(64))

    parse_status: Mapped[DocumentStatus] = mapped_column(
        str_enum(DocumentStatus, 20),
        default=DocumentStatus.stored,
        index=True,
    )
    parsed_data: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)


class CompanyVerification(Base, TimestampMixin):
    """身份认证申请；状态机为 pending/approved/rejected/revoked。"""

    __tablename__ = "company_verifications"
    __table_args__ = (
        UniqueConstraint(
            "company_id", "version", name="uq_company_verification_version"
        ),
        Index("ix_company_verifications_company_status", "company_id", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    document_id: Mapped[int] = mapped_column(
        ForeignKey("company_documents.id", ondelete="RESTRICT"),
        unique=True,
        index=True,
    )
    status: Mapped[VerificationStatus] = mapped_column(
        str_enum(VerificationStatus, 20),
        default=VerificationStatus.pending,
        index=True,
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reject_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
