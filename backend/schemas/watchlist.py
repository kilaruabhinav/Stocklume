from pydantic import BaseModel, field_validator

from schemas.simulation import SYMBOL_PATTERN


class WatchlistData(BaseModel):
    symbol: str

    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, value):
        normalized = value.strip().upper()

        if not normalized:
            raise ValueError("Symbol is required")

        if len(normalized) > 32 or not SYMBOL_PATTERN.fullmatch(normalized):
            raise ValueError("Symbol format is invalid")

        return normalized
