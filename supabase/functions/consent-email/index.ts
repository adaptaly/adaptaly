// Supabase Edge Function for sending parent consent emails via Resend
// Deno runtime

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "no-reply@adaptaly.com";
const FUNC_SECRET = Deno.env.get("FUNC_SECRET");

interface RequestBody {
  parentEmail: string;
  consentUrl: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, x-func-secret",
      },
    });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  // Verify secret header
  const providedSecret = req.headers.get("x-func-secret");
  if (!FUNC_SECRET || providedSecret !== FUNC_SECRET) {
    console.error("Unauthorized: Invalid or missing secret");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check environment
  if (!RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body: RequestBody = await req.json();
    const { parentEmail, consentUrl } = body;

    if (!parentEmail || !consentUrl) {
      return new Response(
        JSON.stringify({ error: "Missing parentEmail or consentUrl" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [parentEmail],
        subject: "Parental Consent Required — Adaptaly Waitlist",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #4BC3B7; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #ffffff; letter-spacing: -0.02em;">Adaptaly</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827; line-height: 1.3;">Parental Consent Required</h2>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #374151;">
                Hi there,
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #374151;">
                A young person under 16 years old has requested to join the Adaptaly waitlist using this email address as their parent or guardian.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #374151;">
                In accordance with GDPR Article 8, we require verifiable parental consent before processing personal data of children under 16.
              </p>

              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.7; color: #374151;">
                <strong style="color: #111827;">To provide your consent</strong>, please click the button below:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${consentUrl}" style="display: inline-block; background-color: #4BC3B7; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 12px; transition: opacity 0.2s;">
                      Confirm Parental Consent
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0 0; font-size: 14px; line-height: 1.6; color: #6B7280;">
                If you did not request this or believe this was sent in error, you can safely ignore this email. No action will be taken without your explicit consent.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280;">
                © ${new Date().getFullYear()} Adaptaly B.V. — Netherlands
              </p>
              <p style="margin: 0; font-size: 13px; color: #9CA3AF;">
                AI-powered adaptive learning for students
              </p>
            </td>
          </tr>
        </table>

        <!-- Additional footer text -->
        <p style="margin: 24px 0 0 0; font-size: 13px; color: #9CA3AF; text-align: center; max-width: 600px;">
          Questions? Contact us at <a href="mailto:privacy@adaptaly.com" style="color: #4BC3B7; text-decoration: none;">privacy@adaptaly.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error (email redacted):", resendResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await resendResponse.json();
    console.log("Email sent successfully (ID redacted)");

    return new Response(
      JSON.stringify({ ok: true, messageId: result.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Function error:", err instanceof Error ? err.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
