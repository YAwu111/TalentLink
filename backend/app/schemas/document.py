from datetime import datetime

from pydantic import BaseModel


class RecognizedFieldOut(BaseModel):
    value: str
    confidence: float


class RecognitionResultOut(BaseModel):
    provider: str
    document_type: str
    confidence: float
    fields: dict[str, RecognizedFieldOut]
    warnings: list[str]


class CompanyDocumentOut(BaseModel):
    id: int
    category: str
    original_name: str
    mime_type: str
    size: int
    status: str
    result: RecognitionResultOut | None
    error: str | None
    created_at: datetime
    updated_at: datetime


class VerificationDocumentOut(BaseModel):
    id: int
    original_name: str
    mime_type: str
    size: int
    created_at: datetime


class VerificationOut(BaseModel):
    id: int
    status: str
    version: int
    submitted_at: datetime
    reviewed_at: datetime | None
    reviewed_by: int | None
    review_note: str | None
    reject_reason: str | None
    document: VerificationDocumentOut


class VerificationStateOut(BaseModel):
    current: VerificationOut | None
    history: list[VerificationOut]
