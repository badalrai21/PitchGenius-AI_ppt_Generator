import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export async function sendWelcomeEmail(toEmail: string, userName: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not set. Skipping welcome email.");
    return { success: false, error: "No API key" };
  }

  try {
    const supabase = createClient();

    // ★ DYNAMIC EMAIL CONTENT & SETTINGS QUERY
    const [templateRes, settingsRes, pricingRes] = await Promise.all([
      supabase
        .from("email_templates")
        .select("subject, body_html, is_active")
        .eq("key", "welcome")
        .maybeSingle(),
      supabase
        .from("settings")
        .select("key, value")
        .in("key", ["app_name", "app_url", "support_email", "email_from"]),
      supabase
        .from("pricing")
        .select("limits")
        .eq("plan_name", "free")
        .maybeSingle(),
    ]);

    const settingsMap: Record<string, string> = (settingsRes.data || []).reduce(
      (acc: Record<string, string>, item: { key: string; value: string }) => {
        acc[item.key] = item.value;
        return acc;
      },
      {}
    );

    const appName = settingsMap.app_name || process.env.NEXT_PUBLIC_APP_NAME || "PitchGenius";
    const appUrl = settingsMap.app_url || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const supportEmail = settingsMap.support_email || "support@pitchgenius.com";
    const emailFrom =
      settingsMap.email_from ||
      process.env.EMAIL_FROM ||
      `${appName} <onboarding@resend.dev>`;

    let freePresentations = 5;
    if (pricingRes.data?.limits) {
      const lim = pricingRes.data.limits as any;
      if (typeof lim.presentations === "number") freePresentations = lim.presentations;
    }

    let subject = `Welcome to ${appName}! 🚀 Let's create your first presentation`;
    let htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; color: #0f172a; }
            .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0, 119, 182, 0.06); }
            .logo { display: inline-block; font-size: 24px; font-weight: 800; color: #0077B6; }
            h1 { font-size: 24px; font-weight: 700; margin-top: 24px; color: #0f172a; }
            p { font-size: 15px; line-height: 1.6; color: #475569; }
            .cta-btn { display: inline-block; margin-top: 20px; padding: 14px 32px; background: #0077B6; color: #ffffff !important; text-decoration: none; font-weight: 600; border-radius: 50px; box-shadow: 0 4px 15px rgba(0, 119, 182, 0.25); }
            .perks { margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 16px; border: 1px solid #e0f2fe; }
            .perk-item { display: flex; align-items: center; margin-bottom: 10px; font-size: 14px; color: #0369a1; }
            .footer { margin-top: 35px; text-align: center; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="container">
            <span class="logo">✨ ${appName}</span>
            <h1>Welcome aboard, ${userName}! 👋</h1>
            <p>You're now ready to transform any idea, document, or outline into a stunning, presentation-ready deck in under 30 seconds with AI.</p>
            
            <div class="perks">
              <div class="perk-item">⚡ <strong>${freePresentations} Free AI Presentations</strong> per month</div>
              <div class="perk-item">🎨 <strong>Designer Themes</strong> with animations</div>
              <div class="perk-item">📥 <strong>Instant Export</strong> to PPTX and PDF</div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${appUrl}/dashboard" class="cta-btn">
                Create Your First Presentation →
              </a>
            </div>

            <div class="footer">
              <p>Questions? Reply to this email or reach us at ${supportEmail}.</p>
              <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Override with active database template if available
    if (templateRes.data && templateRes.data.is_active) {
      if (templateRes.data.subject) {
        subject = templateRes.data.subject
          .replace(/\{\{\s*name\s*\}\}/g, userName)
          .replace(/\{\{\s*app_name\s*\}\}/g, appName);
      }
      if (templateRes.data.body_html) {
        htmlBody = templateRes.data.body_html
          .replace(/\{\{\s*name\s*\}\}/g, userName)
          .replace(/\{\{\s*email\s*\}\}/g, toEmail)
          .replace(/\{\{\s*app_name\s*\}\}/g, appName)
          .replace(/\{\{\s*app_url\s*\}\}/g, appUrl)
          .replace(/\{\{\s*support_email\s*\}\}/g, supportEmail)
          .replace(/\{\{\s*free_limit\s*\}\}/g, String(freePresentations));
      }
    }

    const resend = new Resend(resendApiKey);
    const data = await resend.emails.send({
      from: emailFrom,
      to: toEmail,
      subject: subject,
      html: htmlBody,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return { success: false, error };
  }
}