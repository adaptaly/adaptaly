import { NextRequest } from "next/server";
import { getAdminClient } from "../../../../server/supabase";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token") || "";

  if (!token) {
    return htmlResponse("Missing consent token", 400, false);
  }

  const admin = getAdminClient();

  // Fetch pending consent record
  const { data, error } = await admin
    .from("waitlist_pending_consents")
    .select("child_email, parent_email")
    .eq("token", token)
    .limit(1);

  if (error) {
    console.error("Consent lookup error (token redacted):", error.code);
    return htmlResponse("Error processing consent", 500, false);
  }

  const record = data?.[0];
  if (!record) {
    return htmlResponse("This consent link is invalid or has already been used.", 404, false);
  }

  // Upsert child to waitlist_subscribers with parental consent
  const { error: upsertError } = await admin
    .from("waitlist_subscribers")
    .upsert(
      {
        email: record.child_email.toLowerCase(),
        unsubscribe_token: crypto.randomUUID(),
        unsubscribed_at: null,
        is_minor: true,
        parent_email: record.parent_email.toLowerCase(),
        parent_consented_at: new Date().toISOString()
      },
      { onConflict: "email" }
    );

  if (upsertError) {
    console.error("Consent finalization error (email redacted):", upsertError.code);
    return htmlResponse("Error finalizing consent", 500, false);
  }

  // Delete pending consent record
  await admin.from("waitlist_pending_consents").delete().eq("token", token);

  return htmlResponse("Thanks! Parental consent has been recorded. Your child is now on the waitlist. You can close this window.");
}

function htmlPage(message: string, success = true) {
  const title = success ? "Consent Recorded" : "Consent Issue";
  const statusClass = success ? "success" : "error";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Adaptaly</title>
  <style>
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Inter, Arial, sans-serif;
      margin: 0;
      padding: 32px;
      background: #fff;
      color: #111;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 32px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    h1 {
      margin: 0 0 16px 0;
      font-size: 28px;
      line-height: 1.2;
    }
    .success h1 {
      color: #0a7;
    }
    .error h1 {
      color: #d00;
    }
    p {
      margin: 0;
      color: #374151;
    }
    .brand {
      color: #4BC3B7;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container ${statusClass}">
    <h1>${title}</h1>
    <p>${message}</p>
    <p style="margin-top: 24px; font-size: 14px; color: #6B7280;">
      — <span class="brand">Adaptaly</span>
    </p>
  </div>
</body>
</html>`;
}

function htmlResponse(message: string, status = 200, success = true) {
  return new Response(htmlPage(message, success), {
    status,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
