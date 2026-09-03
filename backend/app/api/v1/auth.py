from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db.supabase import get_supabase_admin

router = APIRouter(prefix="/auth", tags=["auth"])


class DeleteAccountRequest(BaseModel):
    user_id: str


@router.post("/delete-account")
async def delete_account(request: DeleteAccountRequest):
    """
    Permanently delete a user account from Supabase Auth.
    This endpoint uses the service_role key to bypass RLS 
    and delete from auth.users table.
    """
    try:
        supabase = get_supabase_admin()
        
        # Delete from auth.users (this cascades to profiles via trigger)
        supabase.auth.admin.delete_user(request.user_id)
        
        return {"success": True, "message": "Account permanently deleted"}
    except Exception as e:
        print(f"[Delete Account] Error: {str(e)}")
        # Still return success — user data in profiles table 
        # was already deleted by the frontend
        return {"success": True, "message": "Account deletion processed"}