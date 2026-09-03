import stripe
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.core.config import get_settings
from app.db.supabase import get_supabase_admin

router = APIRouter()
settings = get_settings()


class CheckoutRequest(BaseModel):
    user_id: str
    email: str
    plan: str = "pro"
    billing_interval: str = "monthly"


@router.post("/create-checkout-session")
async def create_checkout_session(req: CheckoutRequest):
    """Create a Stripe Checkout session with dynamic pricing."""
    stripe.api_key = settings.STRIPE_SECRET_KEY

    if not stripe.api_key or "your" in stripe.api_key:
        raise HTTPException(status_code=400, detail="Stripe secret key not configured in backend/.env")

    # Determine price
    is_yearly = req.billing_interval.lower() in ("yearly", "year")
    is_team = req.plan.lower() == "team"

    if is_team:
        amount = 18000 if is_yearly else 1900
        name = "PitchGenius Team"
    else:
        amount = 8400 if is_yearly else 900
        name = "PitchGenius Pro"

    interval = "year" if is_yearly else "month"

    try:
        # Try to find existing Stripe customer
        customers = stripe.Customer.list(email=req.email, limit=1)
        customer_id = customers.data[0].id if customers.data else None

        session = stripe.checkout.Session.create(
            customer=customer_id,
            customer_email=req.email if not customer_id else None,
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": name},
                    "unit_amount": amount,
                    "recurring": {"interval": interval},
                },
                "quantity": 1,
            }],
            mode="subscription",
              success_url=f"{settings.FRONTEND_URL}/dashboard/upgrade?upgraded=true",  
              cancel_url=f"{settings.FRONTEND_URL}/dashboard/upgrade?canceled=true", 
            metadata={
                "user_id": req.user_id,
                "plan": req.plan,
            },
        )
        return {"url": session.url}

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/customer-portal")
async def customer_portal(request: Request):
    """Create a Stripe Billing Portal session."""
    stripe.api_key = settings.STRIPE_SECRET_KEY
    try:
        body = await request.json()
        email = body.get("email", "")

        customers = stripe.Customer.list(email=email, limit=1)
        if not customers.data:
            raise HTTPException(status_code=404, detail="No Stripe customer found")

        portal = stripe.billing_portal.Session.create(
            customer=customers.data[0].id,
            return_url=f"{settings.FRONTEND_URL}/dashboard/settings",
        )
        return {"url": portal.url}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))