from fastapi import APIRouter

from app.api.routes import (
    admin,
    auth,
    employer,
    employer_applications,
    employer_jobs,
    health,
    jobs,
    seeker,
    seeker_offers,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(employer.router)
api_router.include_router(employer_jobs.router)
api_router.include_router(employer_applications.router)
api_router.include_router(jobs.router)
api_router.include_router(seeker.router)
api_router.include_router(seeker_offers.router)
api_router.include_router(admin.router)
