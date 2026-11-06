from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.job import JobOut
from app.schemas.seeker import SeekerProfile


class EmployerApplicationOut(BaseModel):
    id: int
    job_id: int
    job_title: str
    seeker_id: int
    seeker_name: str
    gender: str
    age: int | None
    education: str
    school: str
    major: str
    job_intention: str
    expected_salary_min: int
    expected_salary_max: int
    status: str
    note: str
    applied_at: datetime


class EmployerApplicationDetailOut(BaseModel):
    application: EmployerApplicationOut
    seeker: SeekerProfile
    job: JobOut


class ApplicationStatusUpdate(BaseModel):
    status: Literal["viewed", "interview", "rejected"] = Field(
        description="企业可设置的状态：已查看、面试中、未通过"
    )
