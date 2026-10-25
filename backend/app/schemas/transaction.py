from datetime import datetime, timezone
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict, field_validator


class TransactionBase(BaseModel):
    sender_account_id: str = Field(..., min_length=1, description="Source account identifier")
    receiver_account_id: str = Field(..., min_length=1, description="Destination account identifier")
    amount: float = Field(..., gt=0, description="Monetary transaction amount")
    currency: str = Field(default="USD", min_length=3, max_length=3, description="ISO-4217 currency code")
    channel: Literal["wire", "ach", "crypto", "p2p", "card"] = Field(
        default="wire", description="Financial payment rail or channel"
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), description="Chronological event timestamp"
    )
    location_country: Optional[str] = Field(None, max_length=2, description="Origin ISO country code")
    ip_address: Optional[str] = Field(None, description="Client IP address")
    device_id: Optional[str] = Field(None, description="Client device hardware fingerprint")

    @field_validator("timestamp")
    @classmethod
    def validate_timezone_aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None or v.tzinfo.utcoffset(v) is None:
            raise ValueError(
                "Timestamp must be timezone-aware (e.g., ISO-8601 with 'Z' or offset). "
                "Naive timestamps are rejected to prevent temporal comparison ambiguity."
            )
        return v


class TransactionCreate(TransactionBase):
    pass


class TransactionRead(TransactionBase):
    id: str = Field(..., description="Unique transaction identifier")
    model_config = ConfigDict(from_attributes=True)
