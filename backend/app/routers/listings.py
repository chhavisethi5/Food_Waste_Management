import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_donor
from app.core.security import generate_pickup_pin
from app.core.websockets import ws_manager
from app.models.user import User
from app.models.food_listing import FoodListing
from app.models.claim import Claim
from app.schemas.food_listing import FoodListingCreate, FoodListingUpdate, FoodListingResponse

from app.utils.geo import calculate_distance

from app.core.time_utils import get_now_ist, ensure_ist

router = APIRouter(prefix="/listings", tags=["listings"])

@router.post("", response_model=FoodListingResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=FoodListingResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_listing(
    listing_in: FoodListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_donor)
):
    """
    POST /listings: Create a new surplus food listing (Donor only).
    """
    if listing_in.category not in ["cooked", "bakery", "produce"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category must be one of: 'cooked', 'bakery', 'produce'"
        )

    db_listing = FoodListing(
        donor_id=current_user.id,
        title=listing_in.title,
        description=listing_in.description,
        category=listing_in.category,
        quantity_kg=listing_in.quantity_kg,
        expires_at=ensure_ist(listing_in.expires_at),
        storage_condition=listing_in.storage_condition,
        safety_temperature=listing_in.safety_temperature,
        address=listing_in.address,
        latitude=listing_in.latitude,
        longitude=listing_in.longitude,
        created_at=get_now_ist(),
        status="available",
        pickup_pin=None
    )
    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)

    # Broadcast WebSocket update
    listing_data = FoodListingResponse.model_validate(db_listing).model_dump(mode="json")
    await ws_manager.broadcast({
        "type": "LISTING_CREATED",
        "data": listing_data
    })

    return db_listing

@router.get("", response_model=List[FoodListingResponse])
@router.get("/", response_model=List[FoodListingResponse], include_in_schema=False)
def get_available_listings(
    category: Optional[str] = Query(None, description="Filter by category: cooked, bakery, produce"),
    user_lat: Optional[float] = Query(None, description="User latitude for distance calculation"),
    user_lng: Optional[float] = Query(None, description="User longitude for distance calculation"),
    radius_km: Optional[float] = Query(None, description="Maximum search radius in km"),
    db: Session = Depends(get_db)
):
    """
    GET /listings: List all available items (excludes expired and reserved/collected items).
    Supports optional category, user location coordinates, and radius distance filtering.
    """
    now = get_now_ist()

    # 1. Housekeeping: check & release expired 45-minute reservations
    active_claims = db.query(Claim).filter(Claim.status == "active").all()
    for claim in active_claims:
        if claim.reservation_expires_at and ensure_ist(claim.reservation_expires_at) < now:
            claim.status = "cancelled"
            if claim.listing and claim.listing.status == "reserved":
                claim.listing.status = "available"

    # 2. Housekeeping: check & mark expired food listings
    all_available = db.query(FoodListing).filter(FoodListing.status == "available").all()
    for listing in all_available:
        if ensure_ist(listing.expires_at) < now:
            listing.status = "expired"

    db.commit()

    # 3. Query available listings (strictly excludes expired/reserved/collected)
    query = db.query(FoodListing).options(joinedload(FoodListing.donor)).filter(FoodListing.status == "available")

    if category:
        query = query.filter(FoodListing.category == category)

    raw_listings = query.order_by(FoodListing.created_at.desc()).all()

    result: List[FoodListingResponse] = []
    for item in raw_listings:
        resp = FoodListingResponse.model_validate(item)
        if user_lat is not None and user_lng is not None:
            if item.latitude is not None and item.longitude is not None:
                resp.distance_km = calculate_distance(user_lat, user_lng, item.latitude, item.longitude)
            else:
                resp.distance_km = None
        
        # Filter out if distance exceeds radius_km
        if radius_km is not None and user_lat is not None and user_lng is not None:
            if resp.distance_km is not None and resp.distance_km > radius_km:
                continue

        result.append(resp)

    # Sort remaining listings by distance_km ascending if location supplied
    if user_lat is not None and user_lng is not None:
        result.sort(key=lambda x: (x.distance_km if x.distance_km is not None else 999999.0))

    return result

@router.get("/my", response_model=List[FoodListingResponse])
def get_my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_donor)
):
    """
    GET /listings/my: Get all listings created by the current donor.
    """
    listings = db.query(FoodListing).filter(FoodListing.donor_id == current_user.id).order_by(FoodListing.created_at.desc()).all()
    return listings

@router.get("/{listing_id}", response_model=FoodListingResponse)
def get_listing_by_id(listing_id: int, db: Session = Depends(get_db)):
    """
    GET /listings/{id}: Get details for a specific listing by ID.
    """
    listing = db.query(FoodListing).options(joinedload(FoodListing.donor)).filter(FoodListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food listing not found")
    return listing

@router.patch("/{listing_id}", response_model=FoodListingResponse)
def update_listing(
    listing_id: int,
    listing_in: FoodListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_donor)
):
    """
    PATCH /listings/{id}: Update a food listing (Donor only).
    """
    listing = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food listing not found")
    
    if listing.donor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this listing")

    update_data = listing_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(listing, field, value)

    db.commit()
    db.refresh(listing)
    return listing

@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_donor)
):
    """
    DELETE /listings/{id}: Delete a food listing (Donor only).
    """
    listing = db.query(FoodListing).filter(FoodListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food listing not found")
    
    if listing.donor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this listing")

    db.delete(listing)
    db.commit()
    return None
