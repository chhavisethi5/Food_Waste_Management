from pydantic import BaseModel, Field, field_serializer
from typing import Optional
from datetime import datetime
from app.schemas.user import UserResponse
from app.core.time_utils import ensure_ist

class FoodListingBase(BaseModel):
    title: str = Field(..., min_length=2, description="Title of surplus food item")
    description: Optional[str] = Field(None, description="Detailed description and pickup notes")
    category: str = Field(..., description="Category: 'cooked', 'bakery', or 'produce'")
    quantity_kg: float = Field(..., gt=0, description="Quantity in kilograms")
    expires_at: datetime = Field(..., description="Expiration timestamp")
    address: Optional[str] = Field(None, description="Pickup street address")
    latitude: Optional[float] = Field(None, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, description="Longitude coordinate")

class FoodListingCreate(FoodListingBase):
    pass

class FoodListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    quantity_kg: Optional[float] = None
    expires_at: Optional[datetime] = None
    status: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class FoodListingResponse(FoodListingBase):
    id: int
    donor_id: int
    status: str
    pickup_pin: Optional[str] = None
    created_at: datetime
    donor: Optional[UserResponse] = None
    distance_km: Optional[float] = None

    @field_serializer('expires_at', 'created_at', check_fields=False)
    def serialize_datetime(self, dt: Optional[datetime], _info) -> Optional[str]:
        if dt is None:
            return None
        return ensure_ist(dt).isoformat()

    class Config:
        from_attributes = True
