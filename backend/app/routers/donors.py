from datetime import datetime
from fastapi import APIRouter, Depends, Response, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_donor
from app.models.user import User
from app.models.food_listing import FoodListing
from app.services.pdf_service import generate_impact_pdf

router = APIRouter(prefix="/donors", tags=["donors"])

@router.get("/impact-report")
def get_donor_impact_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_donor)
):
    """
    Generates and returns an ESG & Impact PDF Certificate for the authenticated donor.
    """
    # Fetch all collected food listings by this donor
    collected_listings = db.query(FoodListing).filter(
        FoodListing.donor_id == current_user.id,
        FoodListing.status == "collected"
    ).all()

    total_kg = sum(l.quantity_kg for l in collected_listings) if collected_listings else 0.0
    meals_served = int(total_kg / 0.42)
    co2_offset_kg = round(total_kg * 2.5, 1)
    completed_pickups = len(collected_listings)

    month_str = datetime.utcnow().strftime("%B %Y")
    donor_name = current_user.organization_name or current_user.email

    pdf_bytes = generate_impact_pdf(
        donor_name=donor_name,
        month_str=month_str,
        total_kg=total_kg,
        meals_served=meals_served,
        co2_offset_kg=co2_offset_kg,
        completed_pickups=completed_pickups
    )

    clean_org_name = "".join(c for c in donor_name if c.isalnum() or c in ("_", "-")).strip() or "Donor"
    filename = f"ShareMeal_Impact_Report_{clean_org_name}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
