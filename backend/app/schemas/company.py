from datetime import datetime

from pydantic import BaseModel, Field


class CompanyProfile(BaseModel):
    """企业资料 + 资料完整度，前端据此渲染完整度环与投递闸门提示。"""

    id: int
    name: str
    phone: str
    address: str
    intro: str
    industry: str
    verified: bool

    completeness: int
    is_complete: bool
    missing_fields: list[str]
    can_receive_applications: bool

    updated_at: datetime


class CompanyPatch(BaseModel):
    """字段级自动保存入参；全部可选，允许暂存半成品。"""

    name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=200)
    intro: str | None = Field(default=None, max_length=2000)
    industry: str | None = Field(default=None, max_length=50)
