from datetime import date, datetime
from decimal import Decimal

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from security import verify_access_token


def serialize_db_value(value):
    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, (date, datetime)):
        return value.isoformat()

    return value


def serialize_db_row(row):
    if row is None:
        return None

    return {
        key: serialize_db_value(value)
        for key, value in row.items()
    }


def get_authenticated_user_id(credentials: HTTPAuthorizationCredentials):
    token = credentials.credentials
    user_id = verify_access_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    return user_id
