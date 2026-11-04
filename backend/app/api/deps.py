from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import TokenError, decode_access_token
from app.db.session import get_db
from app.models import Role, User, UserStatus

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"


def _unauthorized(detail: str = "登录状态已失效，请重新登录") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """解析 Cookie 中的访问令牌。

    令牌无状态，但账号状态可能随时变化（被禁用），所以每次仍从库里取一次。
    """
    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        raise _unauthorized()
    try:
        payload = decode_access_token(token)
    except TokenError:
        raise _unauthorized() from None

    user = db.get(User, int(payload["sub"]))
    if user is None:
        raise _unauthorized()
    if user.status is not UserStatus.active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="账号已被禁用")
    return user


def require_roles(*roles: Role):
    """角色守卫工厂：@router.get(..., dependencies=[Depends(require_roles(Role.admin))])。"""

    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="当前角色无权访问该资源"
            )
        return user

    return dependency
