from datetime import datetime

from pydantic import BaseModel


class RecognitionSourceOut(BaseModel):
    page: int | None = None
    bbox: list[float] | None = None
    text: str | None = None
    method: str | None = None


class RecognizedFieldOut(BaseModel):
    value: str
    confidence: float
    source: RecognitionSourceOut | None = None


class RecognitionMetaOut(BaseModel):
    pages: int | None = None
    ocr_used: bool | None = None
    text_length: int | None = None
    duration_ms: int | None = None


class RecognitionResultOut(BaseModel):
    schema_version: str | None = None
    provider: str
    model: str | None = None
    document_type: str
    confidence: float
    fields: dict[str, RecognizedFieldOut]
    warnings: list[str]
    meta: RecognitionMetaOut | None = None


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
