from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import load_local_env, require_environment_variable
from routes.auth_routes import router as auth_router
from routes.market_routes import router as market_router
from routes.profile_routes import router as profile_router
from routes.simulation_routes import router as simulation_router
from routes.watchlist_routes import router as watchlist_router


app = FastAPI()
load_local_env()

allowed_origins = [
    origin.strip()
    for origin in require_environment_variable("CORS_ALLOWED_ORIGINS").split(",")
    if origin.strip()
]

if not allowed_origins or "*" in allowed_origins:
    raise RuntimeError(
        "CORS_ALLOWED_ORIGINS must contain explicit frontend origins"
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(market_router)
app.include_router(profile_router)
app.include_router(watchlist_router)
app.include_router(simulation_router)
