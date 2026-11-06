from fastapi import APIRouter

from app.api.routes import admin, auth, employer, health, seeker

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(employer.router)
api_router.include_router(seeker.router)
api_router.include_router(admin.router)
