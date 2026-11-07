from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models import Role, User
from app.schemas.offer import SeekerOfferOut
from app.services import offer_service, seeker_service

router = APIRouter(prefix="/seeker/offers", tags=["求职者录用"])


@router.get("", response_model=list[SeekerOfferOut], summary="我的录用通知")
def list_offers(
    user: User = Depends(require_roles(Role.seeker)),
    db: Session = Depends(get_db),
) -> list[SeekerOfferOut]:
    seeker = seeker_service.get_seeker_of(db, user)
    return offer_service.list_seeker_offers(db, seeker)


@router.post("/{offer_id}/accept", response_model=SeekerOfferOut, summary="接受录用")
def accept_offer(
    offer_id: int,
    user: User = Depends(require_roles(Role.seeker)),
    db: Session = Depends(get_db),
) -> SeekerOfferOut:
    seeker = seeker_service.get_seeker_of(db, user)
    return offer_service.accept_offer(db, seeker, offer_id)


@router.post("/{offer_id}/decline", response_model=SeekerOfferOut, summary="拒绝录用")
def decline_offer(
    offer_id: int,
    user: User = Depends(require_roles(Role.seeker)),
    db: Session = Depends(get_db),
) -> SeekerOfferOut:
    seeker = seeker_service.get_seeker_of(db, user)
    return offer_service.decline_offer(db, seeker, offer_id)
