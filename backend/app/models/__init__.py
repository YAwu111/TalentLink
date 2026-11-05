"""ORM 模型导出：建表时只需 import 本模块，Base.metadata 即可感知全部表。"""

from app.models.application import Application
from app.models.company import Company
from app.models.document import CompanyDocument, CompanyVerification
from app.models.enums import (
    ApplicationStatus,
    DocumentCategory,
    DocumentStatus,
    JobStatus,
    Role,
    UserStatus,
    VerificationStatus,
)
from app.models.job import Job
from app.models.offer import Offer
from app.models.refresh_token import RefreshToken
from app.models.seeker import Seeker
from app.models.user import User

__all__ = [
    "Application",
    "ApplicationStatus",
    "Company",
    "CompanyDocument",
    "CompanyVerification",
    "DocumentCategory",
    "DocumentStatus",
    "Job",
    "JobStatus",
    "Offer",
    "RefreshToken",
    "Role",
    "Seeker",
    "User",
    "UserStatus",
    "VerificationStatus",
]
