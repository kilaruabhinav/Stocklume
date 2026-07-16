from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from database import get_db_connection
from schemas.watchlist import WatchlistData
from services.watchlist_service import (
    add_watchlist_item,
    delete_watchlist_item,
    get_watchlist_items,
    normalize_symbol
)
from utils.db_helpers import get_authenticated_user_id


router = APIRouter()
security = HTTPBearer()


@router.get("/watchlist")
def get_watchlist(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_id = get_authenticated_user_id(credentials)
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        return {
            "watchlist": get_watchlist_items(cursor, user_id)
        }

    finally:
        cursor.close()
        mydb.close()


@router.post("/watchlist")
def add_to_watchlist(
    data: WatchlistData,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_id = get_authenticated_user_id(credentials)
    symbol = normalize_symbol(data.symbol)
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        watchlist_item_id = add_watchlist_item(cursor, user_id, symbol)
        mydb.commit()

        return {
            "message": "Stock added to watchlist",
            "watchlist_item": {
                "id": watchlist_item_id,
                "symbol": symbol
            }
        }

    finally:
        cursor.close()
        mydb.close()


@router.delete("/watchlist")
def delete_from_watchlist(
    data: WatchlistData,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_id = get_authenticated_user_id(credentials)
    symbol = normalize_symbol(data.symbol)
    mydb = get_db_connection()
    cursor = mydb.cursor(dictionary=True)

    try:
        delete_watchlist_item(cursor, user_id, symbol)
        mydb.commit()

        return {
            "message": "Stock deleted from watchlist",
            "symbol": symbol
        }

    finally:
        cursor.close()
        mydb.close()
