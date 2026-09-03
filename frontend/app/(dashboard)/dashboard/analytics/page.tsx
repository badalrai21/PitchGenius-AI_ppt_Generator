import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AnalyticsOverviewClient } from "@/components/dashboard/AnalyticsOverviewClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AnalyticsOverviewPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all presentations
  const { data: presentations } = await supabase
    .from("presentations")
    .select("id, title, slide_count, created_at, is_public, view_count, share_token, updated_at")
    .eq("user_id", user.id)
    .order("view_count", { ascending: false });

  const activePresentations = presentations || [];
  const presentationIds = activePresentations.map(p => p.id);

  // Fetch analytics events
  let analyticsData: any[] = [];
  if (presentationIds.length > 0) {
    const { data: rawAnalytics } = await supabase
      .from("presentation_analytics")
      .select("event_type, created_at, presentation_id, referrer, country, device_type")
      .in("presentation_id", presentationIds)
      .order("created_at", { ascending: false });
    if (rawAnalytics) analyticsData = rawAnalytics;
  }

  return (
    <AnalyticsOverviewClient
      presentations={activePresentations}
      analyticsData={analyticsData}
    />
  );
}