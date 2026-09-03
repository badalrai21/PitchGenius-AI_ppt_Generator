import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignored in Server Route Handlers
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 1. Password recovery — go to reset password page
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // 2. Fetch authenticated user session
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // ★ SELF-HEALING PROFILE SYNC: Check if user profile exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, last_login_at")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingProfile) {
          const resolvedName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User";

          await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            full_name: resolvedName,
            avatar_url: user.user_metadata?.avatar_url || null,
            role: "user",
            plan: "free",
            onboarding_completed: false,
            last_login_at: new Date().toISOString(),
          });
        } else {
          await supabase
            .from("profiles")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", user.id);
        }
      }

      // ★ KEY FIX: Always redirect to /dashboard after email confirmation
      // (unless a specific 'next' param was provided)
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Code exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}