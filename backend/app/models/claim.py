from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from app.core.database import Base

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("food_listings.id", ondelete="CASCADE"), nullable=False)
    ngo_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reserved_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reservation_expires_at = Column(DateTime, nullable=True)
    pickup_pin = Column(String(4), nullable=True)
    status = Column(String, default="active", nullable=False)  # "active", "completed", "cancelled"

    # Relationships
    listing = relationship("FoodListing", back_populates="claims")
    ngo = relationship("User", back_populates="claims")
