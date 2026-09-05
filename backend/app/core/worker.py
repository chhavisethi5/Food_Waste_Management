import asyncio
import logging
from datetime import datetime
from app.core.database import SessionLocal
from app.models.food_listing import FoodListing
from app.models.claim import Claim

from app.core.time_utils import get_now_ist, ensure_ist

logger = logging.getLogger("app.worker")

async def run_cleanup_job():
    """
    Periodic background job to:
    1. Cancel expired 45-minute reservations and return listing status to 'available'.
    2. Mark listings past 'expires_at' as 'expired'.
    """
    db = SessionLocal()
    try:
        now = get_now_ist()

        # 1. Clean up expired 45-minute reservations
        active_claims = db.query(Claim).filter(
            Claim.status == "active",
            Claim.reservation_expires_at != None
        ).all()

        expired_claims_count = 0
        for claim in active_claims:
            if ensure_ist(claim.reservation_expires_at) < now:
                claim.status = "cancelled"
                if claim.listing and claim.listing.status == "reserved":
                    claim.listing.status = "available"
                    logger.info(f"Released listing #{claim.listing_id} back to 'available' (45-min reservation expired).")
                expired_claims_count += 1

        # 2. Mark food listings past expires_at timestamp as 'expired'
        available_or_reserved_listings = db.query(FoodListing).filter(
            FoodListing.status.in_(["available", "reserved"])
        ).all()

        expired_listings_count = 0
        for listing in available_or_reserved_listings:
            if ensure_ist(listing.expires_at) < now:
                listing.status = "expired"
                for claim in listing.claims:
                    if claim.status == "active":
                        claim.status = "cancelled"
                logger.info(f"Marked food listing #{listing.id} as 'expired'.")
                expired_listings_count += 1

        if expired_claims_count > 0 or expired_listings_count > 0:
            db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error during periodic cleanup worker execution: {e}")
    finally:
        db.close()

async def periodic_cleanup_worker(interval_seconds: int = 60):
    """
    Runs the cleanup job every `interval_seconds` indefinitely in the background.
    """
    logger.info(f"Starting automated background cleanup worker (interval: {interval_seconds}s)...")
    while True:
        try:
            await run_cleanup_job()
        except Exception as e:
            logger.error(f"Background worker loop exception: {e}")
        await asyncio.sleep(interval_seconds)
