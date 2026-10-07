from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, sports, matches, venues

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(sports.router, prefix="/sports", tags=["Sports"])
api_router.include_router(matches.router, prefix="/matches", tags=["Matches"])
api_router.include_router(venues.router, prefix="/venues", tags=["Venues"])

