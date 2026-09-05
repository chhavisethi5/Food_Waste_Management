from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_ngo, get_current_donor
from app.core.security import generate_pickup_pin
from app.core.websockets import ws_manager
from app.models.user import User
from app.models.food_listing import FoodListing
from app.models.claim import Claim
from app.schemas.claim import ClaimCreate, ClaimResponse, PinVerification, ReservationResponse

from app.core.time_utils import get_now_ist, ensure_ist

router = APIRouter(tags=["claims"])

@router.post("/listings/{id}/reserve", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def reserve_listing_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ngo)
):
    """
    POST /listings/{id}/reserve: Only users with role 'ngo' can reserve.
    Checks that listing is 'available', updates status to 'reserved', generates 4-digit PIN,
    and sets a 45-minute reservation timer.
    """
    listing = db.query(FoodListing).filter(FoodListing.id == id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food listing not found")

    now = get_now_ist()

    # Check listing expiration
    if ensure_ist(listing.expires_at) < now:
        listing.status = "expired"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This food listing has expired and cannot be reserved"
        )

    # Check if listing is available
    if listing.status != "available":
        # Check if active claim exists and expired past 45 mins
        active_claim = db.query(Claim).filter(
            Claim.listing_id == listing.id,
            Claim.status == "active"
        ).first()

        if active_claim and active_claim.reservation_expires_at and ensure_ist(active_claim.reservation_expires_at) < now:
            active_claim.status = "cancelled"
            listing.status = "available"
            db.commit()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reserve listing with current status '{listing.status}'"
            )

    # Generate new 4-digit pickup PIN for this reservation
    pin = generate_pickup_pin()
    listing.status = "reserved"
    listing.pickup_pin = pin

    reservation_expiry = now + timedelta(minutes=45)

    db_claim = Claim(
        listing_id=listing.id,
        ngo_id=current_user.id,
        reserved_at=now,
        reservation_expires_at=reservation_expiry,
        pickup_pin=pin,
        status="active"
    )
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)

    # Broadcast WebSocket update
    await ws_manager.broadcast({
        "type": "LISTING_RESERVED",
        "data": {"listing_id": id, "status": "reserved"}
    })

    return db.query(Claim).options(
        joinedload(Claim.listing).joinedload(FoodListing.donor),
        joinedload(Claim.ngo)
    ).filter(Claim.id == db_claim.id).first()

@router.post("/listings/{id}/verify-pickup", response_model=ClaimResponse)
async def verify_pickup_by_id(
    id: int,
    pin_in: PinVerification,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    POST /listings/{id}/verify-pickup: The donor enters the 4-digit PIN.
    If valid, marks status as 'collected'.
    """
    listing = db.query(FoodListing).filter(FoodListing.id == id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food listing not found")

    claim = db.query(Claim).options(
        joinedload(Claim.listing).joinedload(FoodListing.donor),
        joinedload(Claim.ngo)
    ).filter(
        Claim.listing_id == id,
        Claim.status == "active"
    ).first()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active reservation found for this food listing"
        )

    now = get_now_ist()
    # Check 45-minute reservation timer expiration
    if claim.reservation_expires_at and ensure_ist(claim.reservation_expires_at) < now:
        claim.status = "cancelled"
        listing.status = "available"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The 45-minute reservation timer for this claim has expired"
        )

    # Check 4-digit PIN match against active claim PIN
    expected_pin = claim.pickup_pin or listing.pickup_pin
    if not expected_pin or pin_in.pickup_pin.strip() != expected_pin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 4-digit pickup PIN"
        )

    # Mark status as collected and completed
    listing.status = "collected"
    claim.status = "completed"
    db.commit()
    db.refresh(claim)

    # Broadcast WebSocket update
    await ws_manager.broadcast({
        "type": "LISTING_COLLECTED",
        "data": {"listing_id": id, "status": "collected"}
    })

    return claim

@router.post("/claims/", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def create_claim(
    claim_in: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ngo)
):
    """
    POST /claims/: Alias endpoint for creating claim by body JSON { listing_id: int }.
    """
    return await reserve_listing_by_id(id=claim_in.listing_id, db=db, current_user=current_user)

@router.get("/claims/my", response_model=List[ClaimResponse])
def get_my_claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ngo)
):
    """
    GET /claims/my: Get all claims reserved by the current NGO.
    """
    claims = db.query(Claim).options(
        joinedload(Claim.listing).joinedload(FoodListing.donor),
        joinedload(Claim.ngo)
    ).filter(Claim.ngo_id == current_user.id).order_by(Claim.reserved_at.desc()).all()
    return claims

@router.post("/claims/{claim_id}/verify-pickup", response_model=ClaimResponse)
async def verify_pickup_by_claim_id(
    claim_id: int,
    pin_in: PinVerification,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    POST /claims/{claim_id}/verify-pickup: Alias endpoint for verifying pickup PIN by claim ID.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    return await verify_pickup_by_id(id=claim.listing_id, pin_in=pin_in, db=db, current_user=current_user)

@router.post("/claims/{claim_id}/cancel", response_model=ClaimResponse)
def cancel_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_ngo)
):
    """
    POST /claims/{claim_id}/cancel: Cancel active claim and release listing back to available.
    """
    claim = db.query(Claim).options(
        joinedload(Claim.listing),
        joinedload(Claim.ngo)
    ).filter(Claim.id == claim_id).first()

    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")

    if claim.ngo_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this claim")

    if claim.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot cancel a {claim.status} claim")

    claim.status = "cancelled"
    if claim.listing and claim.listing.status == "reserved":
        claim.listing.status = "available"

    db.commit()
    db.refresh(claim)
    return claim
