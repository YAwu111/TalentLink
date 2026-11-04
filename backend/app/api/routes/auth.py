from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import ACCESS_COOKIE, REFRESH_COOKIE, get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models import User
from app.schemas.auth import AuthResult, LoginRequest, RegisterRequest, UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["认证"])

ACCESS_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
REFRESH_MAX_AGE = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600


def _set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    """访问令牌下发给整个 /api，刷新令牌只发给 /api/auth，减少暴露面。"""
    common = {
        "httponly": True,
        "secure": settings.COOKIE_SECURE,
        "samesite": settings.COOKIE_SAMESITE,
    }
    response.set_cookie(
        ACCESS_COOKIE, access, max_age=ACCESS_MAX_AGE, path="/api", **common
    )
    response.set_cookie(
        REFRESH_COOKIE, refresh, max_age=REFRESH_MAX_AGE, path="/api/auth", **common
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/api")
    response.delete_cookie(REFRESH_COOKIE, path="/api/auth")


def _auth_result(user: User) -> AuthResult:
    return AuthResult(
        user=UserOut(**auth_service.serialize_user(user)), expires_in=ACCESS_MAX_AGE
    )


@router.post("/register", response_model=AuthResult, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResult:
    """注册即登录：建号成功后直接下发令牌。"""
    try:
        user = auth_service.register(db, payload)
    except auth_service.AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    access, refresh = auth_service.create_session(db, user, request)
    _set_auth_cookies(response, access, refresh)
    return _auth_result(user)


@router.post("/login", response_model=AuthResult)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResult:
    try:
        user = auth_service.authenticate(db, payload.username, payload.password)
    except auth_service.AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    access, refresh = auth_service.create_session(db, user, request)
    _set_auth_cookies(response, access, refresh)
    return _auth_result(user)


@router.post("/refresh", response_model=AuthResult)
def refresh(
    request: Request, response: Response, db: Session = Depends(get_db)
) -> AuthResult:
    raw = request.cookies.get(REFRESH_COOKIE)
    if not raw:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="缺少刷新令牌")

    try:
        user, access, refresh_token = auth_service.rotate_session(db, raw, request)
    except auth_service.AuthError as exc:
        _clear_auth_cookies(response)
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    _set_auth_cookies(response, access, refresh_token)
    return _auth_result(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request, response: Response, db: Session = Depends(get_db)
) -> Response:
    raw = request.cookies.get(REFRESH_COOKIE)
    if raw:
        auth_service.revoke_session(db, raw)
    _clear_auth_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(**auth_service.serialize_user(user))
