from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


class TransactionBase(BaseModel):
    sender_account_id: str = Field(..., description="Source account identifier")
    receiver_account_id: str = Field(..., description="Destination account identifier")
    amount: float = Field(..., gt=0, description="Monetary transaction amount")
    currency: str = Field(default="USD", max_length=3, description="ISO-4217 currency code")
    channel: Literal["wire", "ach", "crypto", "p2p", "card"] = Field(
        default="wire", description="Financial payment rail or channel"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Chronological event timestamp"
    )
    location_country: Optional[str] = Field(None, max_length=2, description="Origin ISO country code")
    ip_address: Optional[str] = Field(None, description="Client IP address")
    device_id: Optional[str] = Field(None, description="Client device hardware fingerprint")


class TransactionCreate(TransactionBase):
    pass


class TransactionRead(TransactionBase):
    id: str = Field(..., description="Unique transaction identifier")
    model_config = ConfigDict(from_attributes=True)
