from pydantic import BaseModel, Field, field_serializer, model_validator
from typing import Optional, Literal
from datetime import datetime, timedelta
from app.schemas.user import UserResponse
from app.core.time_utils import ensure_ist, get_now_ist

class FoodListingBase(BaseModel):
    title: str = Field(..., min_length=2, description="Title of surplus food item")
    description: Optional[str] = Field(None, description="Detailed description and pickup notes")
    category: str = Field(..., description="Category: 'cooked', 'bakery', or 'produce'")
    quantity_kg: float = Field(..., gt=0, description="Quantity in kilograms")
    expires_at: datetime = Field(..., description="Expiration timestamp")
    storage_condition: Literal["hot_holding", "refrigerated", "ambient"] = Field("ambient", description="Storage condition")
    safety_temperature: Optional[float] = Field(None, description="Logged safety temperature in °C")
    address: Optional[str] = Field(None, description="Pickup street address")
    latitude: Optional[float] = Field(None, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, description="Longitude coordinate")

class FoodListingCreate(FoodListingBase):
    @model_validator(mode='after')
    def validate_food_safety(self) -> 'FoodListingCreate':
        now = get_now_ist()
        exp = ensure_ist(self.expires_at)
        time_diff = (exp - now).total_seconds()

        if self.storage_condition == "hot_holding":
            if self.safety_temperature is not None and self.safety_temperature < 60.0:
                raise ValueError("Food safety violation: Hot holding items must be >= 60°C")
            if time_diff > 2 * 3600 + 300:
                raise ValueError("Food safety violation: Hot holding items must expire within 2 hours")

        elif self.storage_condition == "refrigerated":
            if self.safety_temperature is not None and self.safety_temperature > 5.0:
                raise ValueError("Food safety violation: Refrigerated items must be <= 5°C")
            if time_diff > 6 * 3600 + 300:
                raise ValueError("Food safety violation: Refrigerated items must expire within 6 hours")

        elif self.storage_condition == "ambient":
            if time_diff > 24 * 3600 + 300:
                raise ValueError("Food safety violation: Ambient items must expire within 24 hours")

        return self

class FoodListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    quantity_kg: Optional[float] = None
    expires_at: Optional[datetime] = None
    storage_condition: Optional[Literal["hot_holding", "refrigerated", "ambient"]] = None
    safety_temperature: Optional[float] = None
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
