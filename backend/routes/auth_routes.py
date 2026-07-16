from fastapi import APIRouter, HTTPException

from database import get_db_connection
from schemas.auth import LoginData, RegistrationData
from security import (
    create_access_token,
    hash_password,
    verify_password
)


router = APIRouter()


@router.post("/login")
def login(data: LoginData):
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, name, email, password
            FROM users
            WHERE email = %s
            """,
            (data.email,)
        )
        user = cursor.fetchone()

        if not user or not verify_password(data.password, user["password"]):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        return {
            "message": "Login successful",
            "access_token": create_access_token(user["id"]),
            "token_type": "bearer",
            "name": user["name"]
        }

    finally:
        cursor.close()
        mydb.close()


@router.post("/register")
def register(data: RegistrationData):
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        name = data.name.strip()
        email = data.email.strip().lower()
        password = data.password

        if not name:
            raise HTTPException(status_code=400, detail="Name is required")

        if not email:
            raise HTTPException(status_code=400, detail="Email is required")

        if len(password) < 8:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters"
            )

        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))

        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="User already exists")

        cursor.execute(
            """
            INSERT INTO users (name, email, password)
            VALUES (%s, %s, %s)
            """,
            (name, email, hash_password(password))
        )

        mydb.commit()

        return {
            "message": "User added successfully"
        }

    finally:
        cursor.close()
        mydb.close()
