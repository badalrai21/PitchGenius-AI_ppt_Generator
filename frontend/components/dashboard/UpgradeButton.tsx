"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { config } from "@/lib/config";

interface UpgradeButtonProps {
  plan?: string;
  label?: string;
  interval?: "monthly" | "yearly";
  variant?: "primary" | "gradient" | "outline";
}

export function UpgradeButton({
  plan = "pro",
  label = "Upgrade to Pro",
  interval = "monthly",
  variant = "gradient",
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login?redirect=/dashboard";
        return;
      }

      const { data: settingData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "backend_url")
        .maybeSingle();

      const backendUrl =
        settingData?.value ||
        config.app.backendUrl ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:8000";

      const endpoint = `${backendUrl}/api/v1/payments/create-checkout-session`;

      const payload = {
        user_id: user.id,
        email: user.email,
        plan,
        billing_interval: interval,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Backend error response:", text);
        throw new Error("Payment server returned an invalid response.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to create checkout session.");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Checkout could not be started.");
      setLoading(false);
    }
  };

  // ★ FIXED: Solid, high-contrast styles that work in ALL modes
  const getButtonStyle = (): React.CSSProperties => {
    if (variant === "primary") {
      return {
        background: "#1d1d1f",
        color: "#ffffff",
        boxShadow: "0 4px 14px -2px rgba(0, 0, 0, 0.25)",
      };
    }
    if (variant === "outline") {
      return {
        background: "#ffffff",
        color: "#0071e3",
        border: "2px solid #0071e3",
        boxShadow: "0 2px 8px -2px rgba(0, 113, 227, 0.15)",
      };
    }
    // Gradient (default) — Apple blue gradient, ALWAYS visible
    return {
      background: "linear-gradient(135deg, #0071e3 0%, #0077B6 100%)",
      color: "#ffffff",
      boxShadow: "0 4px 14px -2px rgba(0, 113, 227, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
    };
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      style={{
        ...getButtonStyle(),
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
        border: variant === "outline" ? "2px solid #0071e3" : "none",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = "translateY(-1px)";
          if (variant === "gradient") {
            e.currentTarget.style.boxShadow = "0 6px 20px -2px rgba(0, 113, 227, 0.6), inset 0 1px 0 rgba(255,255,255,0.2)";
          }
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        const style = getButtonStyle();
        e.currentTarget.style.boxShadow = style.boxShadow as string;
      }}
    >
      {loading ? (
        <>
          <Loader2 style={{ width: "14px", height: "14px" }} className="animate-spin" />
          <span>Opening Checkout...</span>
        </>
      ) : (
        <>
          <Sparkles style={{ width: "14px", height: "14px" }} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}