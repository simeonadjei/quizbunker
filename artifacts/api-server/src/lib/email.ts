/**
 * Shared email sender using Brevo's HTTP API.
 * Uses plain fetch — no SDK required, works on all cloud hosts.
 */

export function isEmailConfigured(): boolean {
  return !!process.env.BREVO_API_KEY;
}

function senderEmail(): string {
  return (process.env.GMAIL_USER || process.env.ADMIN_EMAIL || "").trim() || "noreply@quizbunker.com";
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Email not configured — BREVO_API_KEY must be set." };
  }

  const from = senderEmail();

  const body = {
    sender: { name: "Quiz Bunker", email: from },
    to: [{ email: opts.to }],
    subject: opts.subject,
    htmlContent: opts.html,
  };

  let res: Response;
  try {
    res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Network error sending email: ${msg}` };
  }

  if (!res.ok) {
    let detail = "";
    try {
      const json = (await res.json()) as { message?: string; code?: string };
      detail = json.message ?? json.code ?? "";
    } catch {
      detail = await res.text().catch(() => "");
    }
    return { ok: false, error: `Brevo API error ${res.status}: ${detail}` };
  }

  return { ok: true };
}

/** Call once at startup to log whether email is configured. */
export function logEmailConfigStatus(): void {
  if (isEmailConfigured()) {
    console.log("[EMAIL] ✅ Brevo configured — email sending enabled.");
  } else {
    console.error("[EMAIL] ⚠️  Email NOT configured — set BREVO_API_KEY to enable email sending.");
  }
}
