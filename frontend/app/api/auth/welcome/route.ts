import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, fullName } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const name = fullName || email.split("@")[0];
    const supabase = createClient();

    // ★ DYNAMIC EMAIL TEMPLATE & SETTINGS QUERY: Fetch live template and app config from database
    const [templateRes, settingsRes] = await Promise.all([
      supabase
        .from("email_templates")
        .select("subject, body_html, is_active")
        .eq("key", "welcome")
        .maybeSingle(),
      supabase
        .from("settings")
        .select("key, value")
        .in("key", ["app_name", "app_tagline", "support_email", "app_url"]),
    ]);

    const settingsMap = (settingsRes.data || []).reduce(
      (acc: Record<string, string>, item: { key: string; value: string }) => {
        acc[item.key] = item.value;
        return acc;
      },
      {}
    );

    const appName = settingsMap.app_name || process.env.NEXT_PUBLIC_APP_NAME || "PitchGenius";
    const appUrl = settingsMap.app_url || process.env.NEXT_PUBLIC_APP_URL || "https://pitchgenius.com";
    const supportEmail = settingsMap.support_email || "support@pitchgenius.com";

    // Dynamic subject and body with variable interpolation
    let subject = `Welcome to ${appName}, ${name}!`;
    let bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #1e293b;">
        <h1 style="color: #0077B6; font-size: 24px; font-weight: 700; margin-bottom: 16px;">Welcome to ${appName}!</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">Hi ${name},</p>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">Thank you for joining ${appName}. We're excited to help you transform your ideas into stunning presentations in seconds with AI.</p>
        <div style="margin: 28px 0;">
          <a href="${appUrl}/dashboard" style="background-color: #0077B6; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">Go to Your Dashboard</a>
        </div>
        <p style="font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
          Need help? Reply directly to this email or reach us at ${supportEmail}.
        </p>
      </div>
    `;

    // Override with active database template if configured
    if (templateRes.data && templateRes.data.is_active) {
      if (templateRes.data.subject) {
        subject = templateRes.data.subject
          .replace(/\{\{\s*name\s*\}\}/g, name)
          .replace(/\{\{\s*app_name\s*\}\}/g, appName);
      }
      if (templateRes.data.body_html) {
        bodyHtml = templateRes.data.body_html
          .replace(/\{\{\s*name\s*\}\}/g, name)
          .replace(/\{\{\s*email\s*\}\}/g, email)
          .replace(/\{\{\s*app_name\s*\}\}/g, appName)
          .replace(/\{\{\s*app_url\s*\}\}/g, appUrl)
          .replace(/\{\{\s*support_email\s*\}\}/g, supportEmail);
      }
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not found. Skipping welcome email delivery.");
      return NextResponse.json({ success: true, message: "Email skipped (no API key configured)" });
    }

    const resend = new Resend(resendApiKey);
    const emailFrom = process.env.EMAIL_FROM || `${appName} <hello@pitchgenius.com>`;

    const data = await resend.emails.send({
      from: emailFrom,
      to: [email],
      subject: subject,
      html: bodyHtml,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Welcome email dispatch error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}