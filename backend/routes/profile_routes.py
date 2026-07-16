from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from database import get_db_connection
from utils.db_helpers import get_authenticated_user_id


router = APIRouter()
security = HTTPBearer()


@router.get("/profile")
def get_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_id = get_authenticated_user_id(credentials)
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
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "user": user
        }

    finally:
        cursor.close()
        mydb.close()
