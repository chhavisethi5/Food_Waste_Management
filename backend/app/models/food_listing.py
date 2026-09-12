from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class FoodListing(Base):
    __tablename__ = "food_listings"

    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)  # "cooked", "bakery", "produce"
    quantity_kg = Column(Float, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    status = Column(String, default="available", nullable=False)  # "available", "reserved", "collected", "expired"
    storage_condition = Column(String, default="ambient", nullable=False)  # "hot_holding", "refrigerated", "ambient"
    safety_temperature = Column(Float, nullable=True)
    pickup_pin = Column(String, nullable=True, default=None)
    address = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    donor = relationship("User", back_populates="food_listings")
    claims = relationship("Claim", back_populates="listing", cascade="all, delete-orphan")
