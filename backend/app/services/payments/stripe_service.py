import logging
import stripe
from app.core.config import get_settings
from app.db.supabase import get_supabase_admin

logger = logging.getLogger(__name__)
settings = get_settings()

stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    @classmethod
    async def get_or_create_customer(cls, user_id: str, email: str, name: str = "") -> str:
        """Finds existing Stripe customer ID or creates a new one, saving to Supabase."""
        supabase = get_supabase_admin()
        profile = supabase.table("profiles").select("stripe_customer_id").eq("id", user_id).single().execute()
        
        if profile.data and profile.data.get("stripe_customer_id"):
            return profile.data["stripe_customer_id"]

        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata={"supabase_user_id": user_id}
        )
        
        supabase.table("profiles").update({"stripe_customer_id": customer.id}).eq("id", user_id).execute()
        return customer.id

    @classmethod
    async def create_checkout_session(cls, user_id: str, email: str, plan: str, interval: str = "month") -> str:
        """Generates a Stripe hosted checkout URL."""
        customer_id = await cls.get_or_create_customer(user_id, email)
        
        # Price map - uses env price IDs or fallback to dynamic price data in test mode
        price_amount = 900 if plan == "pro" else 1900
        if interval == "year":
            price_amount = 8400 if plan == "pro" else 18000

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"PitchGenius {plan.capitalize()} Plan",
                            "description": f"Unlimited presentations, HD visuals, and premium themes.",
                        },
                        "unit_amount": price_amount,
                        "recurring": {"interval": "year" if interval == "year" else "month"},
                    },
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=f"{settings.FRONTEND_URL}/dashboard?payment=success",
            cancel_url=f"{settings.FRONTEND_URL}/pricing?payment=cancelled",
            metadata={
                "user_id": user_id,
                "plan": plan,
                "interval": interval,
            },
        )
        return session.url

    @classmethod
    async def create_portal_session(cls, user_id: str, email: str) -> str:
        """Generates a Stripe Customer Portal URL where users manage/cancel subscription."""
        customer_id = await cls.get_or_create_customer(user_id, email)
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{settings.FRONTEND_URL}/dashboard",
        )
        return session.url

    @classmethod
    async def handle_webhook_event(cls, payload: bytes, sig_header: str):
        """Processes real-time events sent by Stripe webhooks."""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except Exception as e:
            logger.error(f"Webhook signature verification failed: {e}")
            raise ValueError(f"Webhook Error: {str(e)}")

        event_type = event["type"]
        data_object = event["data"]["object"]
        supabase = get_supabase_admin()

        if event_type == "checkout.session.completed":
            user_id = data_object.get("metadata", {}).get("user_id")
            plan = data_object.get("metadata", {}).get("plan", "pro")
            sub_id = data_object.get("subscription")

            if user_id:
                supabase.table("profiles").update({
                    "plan": plan,
                    "stripe_subscription_id": sub_id
                }).eq("id", user_id).execute()

                supabase.table("subscriptions").upsert({
                    "user_id": user_id,
                    "plan": plan,
                    "stripe_subscription_id": sub_id,
                    "status": "active",
                }).execute()

        elif event_type in ["customer.subscription.deleted", "customer.subscription.updated"]:
            sub_id = data_object.get("id")
            status = data_object.get("status")
            
            sub_record = supabase.table("subscriptions").select("user_id").eq("stripe_subscription_id", sub_id).maybe_single().execute()
            if sub_record.data:
                user_id = sub_record.data["user_id"]
                new_plan = "free" if status != "active" else "pro"
                
                supabase.table("profiles").update({"plan": new_plan}).eq("id", user_id).execute()
                supabase.table("subscriptions").update({"status": status, "plan": new_plan}).eq("user_id", user_id).execute()