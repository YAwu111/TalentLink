from typing import Any, Literal

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32, pattern=r"^[A-Za-z0-9_]+$")
    password: str = Field(min_length=6, max_length=64)
    role: Literal["seeker", "employer"]
    display_name: str = Field(min_length=1, max_length=50, description="姓名或企业名称")


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=32)
    password: str = Field(min_length=1, max_length=64)


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    status: str
    display_name: str
    profile: dict[str, Any] | None = None


class AuthResult(BaseModel):
    user: UserOut
    expires_in: int = Field(description="访问令牌剩余有效秒数，前端据此提前续期")
