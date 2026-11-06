import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.errors import ServiceError
from app.db.session import get_db
from app.models import Role, User
from app.schemas.document import RecognitionResultOut
from app.schemas.seeker import SeekerPatch, SeekerProfile
from app.services import seeker_service
from app.services.recognition import RecognitionError
from app.services.recognition.seeker import recognize_seeker_resume

router = APIRouter(prefix="/seeker", tags=["求职者资料"])

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
RESUME_SUFFIXES = {".pdf", ".docx", ".png", ".jpg", ".jpeg"}


@router.get("/profile", response_model=SeekerProfile, summary="获取求职者资料")
def get_seeker_profile(
    user: User = Depends(require_roles(Role.seeker)),
    db: Session = Depends(get_db),
) -> SeekerProfile:
    return seeker_service.seeker_profile(seeker_service.get_seeker_of(db, user))


@router.patch("/profile", response_model=SeekerProfile, summary="局部更新求职者资料")
def patch_seeker_profile(
    payload: SeekerPatch,
    user: User = Depends(require_roles(Role.seeker)),
    db: Session = Depends(get_db),
) -> SeekerProfile:
    return seeker_service.update_seeker(db, user, payload)


@router.post(
    "/profile/recognize",
    response_model=RecognitionResultOut,
    summary="本地识别简历并返回可回填字段",
)
async def recognize_seeker_profile(
    file: UploadFile = File(...),
    user: User = Depends(require_roles(Role.seeker)),
) -> RecognitionResultOut:
    original_name = Path(file.filename or "resume").name
    suffix = Path(original_name).suffix.lower()
    if suffix not in RESUME_SUFFIXES:
        raise ServiceError(415, "仅支持 PDF、DOCX、PNG、JPG 简历")
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if not content:
        raise ServiceError(400, "文件为空，请重新选择")
    if len(content) > MAX_UPLOAD_BYTES:
        raise ServiceError(413, "文件不能超过 10MB")

    try:
        with tempfile.TemporaryDirectory(prefix="talentlink-resume-") as directory:
            path = Path(directory) / f"resume{suffix}"
            path.write_bytes(content)
            result = recognize_seeker_resume(path, suffix)
    except RecognitionError as exc:
        raise ServiceError(422, str(exc)) from exc

    return RecognitionResultOut.model_validate(result)
