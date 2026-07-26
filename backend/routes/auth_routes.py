from fastapi import APIRouter, HTTPException, Request
from mysql.connector import IntegrityError

from database import get_db_connection
from schemas.auth import LoginData, RegistrationData
from security import (
    create_access_token,
    hash_password,
    verify_password
)
from services.rate_limit_service import enforce_client_rate_limit


router = APIRouter()


@router.post("/login")
def login(data: LoginData, request: Request):
    enforce_client_rate_limit(request, "login")
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
def register(data: RegistrationData, request: Request):
    enforce_client_rate_limit(request, "register")
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        name = data.name
        email = data.email
        password = data.password

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

    except IntegrityError:
        mydb.rollback()
        raise HTTPException(status_code=409, detail="User already exists")
    except Exception:
        mydb.rollback()
        raise

    finally:
        cursor.close()
        mydb.close()
