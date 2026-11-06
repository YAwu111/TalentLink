from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.document import VerificationOut


class AdminCompanyOut(BaseModel):
    id: int
    name: str
    industry: str
    phone: str
    address: str
    intro: str
    verified: bool
    completeness: int
    is_complete: bool


class VerificationEventOut(BaseModel):
    id: int
    from_status: str | None
    to_status: str
    actor_id: int | None
    actor_name: str | None
    note: str | None
    created_at: datetime


class AdminVerificationListItem(BaseModel):
    id: int
    company_id: int
    company_name: str
    company_verified: bool
    version: int
    status: str
    submitted_at: datetime
    document_id: int
    document_name: str


class AdminVerificationListOut(BaseModel):
    items: list[AdminVerificationListItem]
    total: int
    page: int
    page_size: int
    status: str
    counts: dict[str, int]


class AdminVerificationDetail(BaseModel):
    verification: VerificationOut
    company: AdminCompanyOut
    history: list[VerificationOut]
    events: list[VerificationEventOut]


class ReviewApproveIn(BaseModel):
    note: str | None = Field(default=None, max_length=500)


class ReviewRejectIn(BaseModel):
    reason: str = Field(min_length=2, max_length=500)


class ReviewRevokeIn(BaseModel):
    reason: str = Field(min_length=2, max_length=500)
