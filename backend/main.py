import os

from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_db_connection, load_local_env
from security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token
)


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

security = HTTPBearer()


# -----------------------------
# Request body models
# -----------------------------

class LoginData(BaseModel):
    email: str
    password: str


class RegistrationData(BaseModel):
    name: str
    email: str
    password: str


class WatchlistData(BaseModel):
    symbol: str


# -----------------------------
# Login
# -----------------------------

@app.post("/login")
def login(data: LoginData):
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        query = """
            SELECT id, name, email, password
            FROM users
            WHERE email = %s
        """

        cursor.execute(query, (data.email,))
        user = cursor.fetchone()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        password_matches = verify_password(
            data.password,
            user["password"]
        )

        if not password_matches:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        access_token = create_access_token(user["id"])

        return {
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "name": user["name"]
        }

    finally:
        cursor.close()
        mydb.close()


# -----------------------------
# Registration
# -----------------------------

@app.post("/register")
def register(data: RegistrationData):
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        name = data.name.strip()
        email = data.email.strip().lower()
        password = data.password

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Name is required"
            )

        if not email:
            raise HTTPException(
                status_code=400,
                detail="Email is required"
            )

        if len(password) < 8:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters"
            )

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="User already exists"
            )

        hashed_password = hash_password(password)

        cursor.execute(
            """
            INSERT INTO users (name, email, password)
            VALUES (%s, %s, %s)
            """,
            (
                name,
                email,
                hashed_password
            )
        )

        mydb.commit()

        return {
            "message": "User added successfully"
        }

    finally:
        cursor.close()
        mydb.close()


# -----------------------------
# Profile
# -----------------------------

@app.get("/profile")
def get_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    user_id = verify_access_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, name, email
            FROM users
            WHERE id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return {
            "user": user
        }

    finally:
        cursor.close()
        mydb.close()


# -----------------------------
# Add stock to watchlist
# -----------------------------

@app.post("/watchlist")
def add_to_watchlist(
    data: WatchlistData,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    user_id = verify_access_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    symbol = data.symbol.strip().upper()

    if not symbol:
        raise HTTPException(
            status_code=400,
            detail="Symbol is required"
        )

    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id
            FROM watchlist
            WHERE user_id = %s
            AND symbol = %s
            """,
            (user_id, symbol)
        )

        existing_stock = cursor.fetchone()

        if existing_stock:
            raise HTTPException(
                status_code=409,
                detail="Stock already exists in watchlist"
            )

        cursor.execute(
            """
            INSERT INTO watchlist (user_id, symbol)
            VALUES (%s, %s)
            """,
            (user_id, symbol)
        )

        mydb.commit()

        return {
            "message": "Stock added to watchlist",
            "symbol": symbol
        }

    finally:
        cursor.close()
        mydb.close()


# -----------------------------
# Get user's watchlist
# -----------------------------

@app.get("/watchlist")
def get_watchlist(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    user_id = verify_access_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, symbol, created_at
            FROM watchlist
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,)
        )

        stocks = cursor.fetchall()

        return {
            "watchlist": stocks
        }

    finally:
        cursor.close()
        mydb.close()


# -----------------------------
# Delete stock from watchlist
# -----------------------------

@app.delete("/watchlist")
def delete_from_watchlist(
    data: WatchlistData,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    user_id = verify_access_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    symbol = data.symbol.strip().upper()

    if not symbol:
        raise HTTPException(
            status_code=400,
            detail="Symbol is required"
        )

    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            DELETE FROM watchlist
            WHERE user_id = %s
            AND symbol = %s
            """,
            (user_id, symbol)
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Stock not found in watchlist"
            )

        mydb.commit()

        return {
            "message": "Stock deleted from watchlist",
            "symbol": symbol
        }

    finally:
        cursor.close()
        mydb.close()
