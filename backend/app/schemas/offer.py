from datetime import date, datetime

from pydantic import BaseModel, Field


class OfferOut(BaseModel):
    id: int
    application_id: int
    salary: int
    start_date: date | None
    message: str
    status: str
    sent_at: datetime
    responded_at: datetime | None


class SeekerOfferOut(OfferOut):
    job_id: int
    job_title: str
    company_name: str
    city: str
    application_status: str


class OfferCreate(BaseModel):
    salary: int = Field(gt=0, le=1_000_000)
    start_date: date | None = None
    message: str = Field(default="", max_length=2000)
