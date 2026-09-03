"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  const handleOpenPortal = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      setLoading(false);
      return;
    }

    try {
      const { data: settingData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "backend_url")
        .maybeSingle();

      const resolvedBackendUrl =
        settingData?.value ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:8000";

      const res = await fetch(`${resolvedBackendUrl}/api/v1/payments/customer-portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData.user.id,
          email: userData.user.email,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error("Portal redirection failure:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleOpenPortal}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "12px 20px",
        borderRadius: "999px",
        fontSize: "13px",
        fontWeight: 700,
        width: "100%",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        transition: "all 0.2s ease",
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: "#ffffff",
        border: "none",
        boxShadow: "0 4px 14px -2px rgba(16, 185, 129, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif",
      }}
      onMouseEnter={(e) => {
        if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {loading ? (
        <Loader2 style={{ width: "14px", height: "14px" }} className="animate-spin" />
      ) : (
        <CreditCard style={{ width: "14px", height: "14px" }} />
      )}
      <span>Manage Billing</span>
    </button>
  );
}