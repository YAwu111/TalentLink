from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field


class SeekerProfile(BaseModel):
    id: int
    name: str
    gender: str
    birth_date: date | None
    age: int | None
    phone: str
    email: str | None
    household: str
    education: str
    major: str
    degree: str
    school: str
    skills: str
    job_intention: str
    expected_salary_min: int
    expected_salary_max: int

    completeness: int
    is_complete: bool
    missing_fields: list[str]
    can_apply: bool
    updated_at: datetime


class SeekerPatch(BaseModel):
    name: str | None = Field(default=None, max_length=50)
    gender: str | None = Field(default=None, max_length=10)
    birth_date: date | None = None
    phone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    household: str | None = Field(default=None, max_length=100)
    education: str | None = Field(default=None, max_length=20)
    major: str | None = Field(default=None, max_length=50)
    degree: str | None = Field(default=None, max_length=20)
    school: str | None = Field(default=None, max_length=100)
    skills: str | None = Field(default=None, max_length=2000)
    job_intention: str | None = Field(default=None, max_length=100)
    expected_salary_min: int | None = Field(default=None, ge=0, le=1_000_000)
    expected_salary_max: int | None = Field(default=None, ge=0, le=1_000_000)
