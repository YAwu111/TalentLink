import enum

from sqlalchemy import Enum as SAEnum


def str_enum(enum_cls, length: int = 20) -> SAEnum:
    """枚举以字符串存库（VARCHAR + CHECK），便于直接读日志和排查数据。"""
    return SAEnum(
        enum_cls,
        native_enum=False,
        length=length,
        validate_strings=True,
        values_callable=lambda e: [item.value for item in e],
    )


class Role(str, enum.Enum):
    """账号角色：一个账号只有一种身份。"""

    seeker = "seeker"
    employer = "employer"
    admin = "admin"


class UserStatus(str, enum.Enum):
    active = "active"
    disabled = "disabled"


class JobStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    closed = "closed"


class ApplicationStatus(str, enum.Enum):
    submitted = "submitted"
    viewed = "viewed"
    interview = "interview"
    offered = "offered"
    rejected = "rejected"
