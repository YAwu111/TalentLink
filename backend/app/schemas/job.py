from datetime import datetime

from pydantic import BaseModel, Field


class JobCompanyOut(BaseModel):
    id: int
    name: str
    industry: str
    address: str
    verified: bool


class JobOut(BaseModel):
    id: int
    title: str
    requirement: str
    other_requirement: str
    salary_min: int
    salary_max: int | None
    headcount: int
    status: str
    published_at: datetime | None
    company: JobCompanyOut
    applied: bool = False


class JobCreate(BaseModel):
    title: str = Field(min_length=2, max_length=100)
    requirement: str = Field(default="", max_length=4000)
    other_requirement: str = Field(default="", max_length=2000)
    salary_min: int = Field(default=0, ge=0, le=1_000_000)
    salary_max: int | None = Field(default=None, ge=0, le=1_000_000)
    headcount: int = Field(default=1, ge=1, le=1000)


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=100)
    requirement: str | None = Field(default=None, max_length=4000)
    other_requirement: str | None = Field(default=None, max_length=2000)
    salary_min: int | None = Field(default=None, ge=0, le=1_000_000)
    salary_max: int | None = Field(default=None, ge=0, le=1_000_000)
    headcount: int | None = Field(default=None, ge=1, le=1000)


class ApplicationCreate(BaseModel):
    job_id: int
    note: str | None = Field(default=None, max_length=1000)


class ApplicationOut(BaseModel):
    id: int
    job_id: int
    job_title: str
    company_name: str
    city: str
    salary_min: int
    salary_max: int | None
    status: str
    note: str
    applied_at: datetime
    offer_salary: int | None = None
