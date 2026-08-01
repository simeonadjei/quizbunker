/**
 * Shared email sender using Resend (HTTP API).
 * Resend works on all cloud hosts including Render free tier,
 * unlike SMTP which is blocked on ports 465 and 587.
 */
import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/** Returns the "from" address: uses GMAIL_USER / ADMIN_EMAIL as the display
 *  name + address when verified on Resend, otherwise falls back to the safe
 *  Resend sandbox sender which works without domain verification. */
function fromAddress(): string {
  const configured = (process.env.GMAIL_USER || process.env.ADMIN_EMAIL || "").trim();
  // If the user has verified their domain on Resend, use their address.
  // Otherwise Resend requires using onboarding@resend.dev (sandbox) or a
  // verified address. We try to use their address and let Resend reject it
  // with a clear error if it isn't verified, rather than silently swapping it.
  return configured ? `Quiz Bunker <${configured}>` : "Quiz Bunker <onboarding@resend.dev>";
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
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Email not configured — RESEND_API_KEY must be set." };
  }

  const { data, error } = await resend.emails.send({
    from: fromAddress(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    return { ok: false, error: `Resend error: ${error.message}` };
  }

  return { ok: true };
}

/** Call once at startup to log whether email is configured. */
export function logEmailConfigStatus(): void {
  if (isEmailConfigured()) {
    console.log("[EMAIL] ✅ Resend configured — email sending enabled.");
  } else {
    console.error("[EMAIL] ⚠️  Email NOT configured — set RESEND_API_KEY to enable email sending.");
  }
}
