from pydantic import BaseModel, Field, field_serializer, field_validator
from datetime import datetime
from typing import Optional
from app.schemas.food_listing import FoodListingResponse
from app.schemas.user import UserResponse
from app.core.time_utils import ensure_ist

class ClaimCreate(BaseModel):
    listing_id: int
    food_safety_acknowledged: bool = Field(True, description="Confirmation of temperature-controlled transport")

    @field_validator('food_safety_acknowledged')
    @classmethod
    def validate_safety_ack(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Food safety acknowledgment is required before reserving food")
        return v

class PinVerification(BaseModel):
    pickup_pin: str = Field(..., min_length=4, max_length=4, description="4-digit security PIN")

class ClaimResponse(BaseModel):
    id: int
    listing_id: int
    ngo_id: int
    reserved_at: datetime
    reservation_expires_at: Optional[datetime] = None
    pickup_pin: Optional[str] = None
    food_safety_acknowledged: bool = False
    status: str
    listing: Optional[FoodListingResponse] = None
    ngo: Optional[UserResponse] = None

    @field_serializer('reserved_at', 'reservation_expires_at', check_fields=False)
    def serialize_datetime(self, dt: Optional[datetime], _info) -> Optional[str]:
        if dt is None:
            return None
        return ensure_ist(dt).isoformat()

    class Config:
        from_attributes = True

class ReservationResponse(BaseModel):
    message: str
    claim_id: int
    listing_id: int
    pickup_pin: str
    reserved_at: datetime
    reservation_expires_at: datetime
    status: str

    @field_serializer('reserved_at', 'reservation_expires_at', check_fields=False)
    def serialize_datetime(self, dt: Optional[datetime], _info) -> Optional[str]:
        if dt is None:
            return None
        return ensure_ist(dt).isoformat()
