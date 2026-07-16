from pydantic import BaseModel


class WatchlistData(BaseModel):
    symbol: str

