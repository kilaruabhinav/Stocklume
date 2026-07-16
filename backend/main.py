import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import load_local_env
from routes.auth_routes import router as auth_router
from routes.profile_routes import router as profile_router
from routes.simulation_routes import router as simulation_router
from routes.watchlist_routes import router as watchlist_router


app = FastAPI()
load_local_env()

allowed_origins = [
    origin.strip()
    for origin in os.environ["CORS_ALLOWED_ORIGINS"].split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(watchlist_router)
app.include_router(simulation_router)
