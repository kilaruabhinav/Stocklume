from datetime import datetime, timedelta, timezone
import os

import jwt
from pwdlib import PasswordHash

from database import load_local_env


password_hasher = PasswordHash.recommended()

load_local_env()

SECRET_KEY = os.environ["JWT_SECRET_KEY"]
ALGORITHM = "HS256"
TOKEN_EXPIRY_MINUTES = int(os.environ["JWT_TOKEN_EXPIRY_MINUTES"])


def hash_password(password: str):
    return password_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return password_hasher.verify(
        plain_password,
        hashed_password
    )


def create_access_token(user_id: int):
    expiry_time = datetime.now(timezone.utc) + timedelta(
        minutes=TOKEN_EXPIRY_MINUTES
    )

    token_data = {
        "sub": str(user_id),
        "exp": expiry_time
    }

    token = jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


def verify_access_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            return None

        return int(user_id)

    except jwt.InvalidTokenError:
        return None
    
