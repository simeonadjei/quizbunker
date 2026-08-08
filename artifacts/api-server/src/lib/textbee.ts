import { logger } from "./logger";

// TextBee's device-scoped endpoint still works, but is deprecated. Use the
// current gateway endpoint and target the registered phone in the payload.
const TEXTBEE_ENDPOINT = "https://api.textbee.dev/api/v1/gateway/send-sms";

export interface TextBeeSendResult {
  ok: boolean;
  error?: string;
}

export function isTextBeeConfigured(): boolean {
  return Boolean(
    process.env.TEXTBEE_API_KEY?.trim() &&
      process.env.TEXTBEE_DEVICE_ID?.trim(),
  );
}

/**
 * Convert Ghanaian local numbers (e.g. 0241234567) to E.164.
 * E.164 numbers are passed through unchanged apart from whitespace.
 */
export function normalizePhoneNumber(value: string | null | undefined): string | null {
  const raw = value?.trim().replace(/[\s().-]/g, "");
  if (!raw) return null;

  if (raw.startsWith("+")) {
    return /^\+[1-9]\d{7,14}$/.test(raw) ? raw : null;
  }

  if (raw.startsWith("00")) {
    const international = `+${raw.slice(2)}`;
    return /^\+[1-9]\d{7,14}$/.test(international) ? international : null;
  }

  if (/^0\d{9}$/.test(raw)) {
    const ghana = `+233${raw.slice(1)}`;
    return ghana;
  }

  if (/^233\d{9}$/.test(raw)) {
    return `+${raw}`;
  }

  return null;
}

export async function sendTextBeeSms(opts: {
  to: string;
  message: string;
}): Promise<TextBeeSendResult> {
  const apiKey = process.env.TEXTBEE_API_KEY?.trim();
  const deviceId = process.env.TEXTBEE_DEVICE_ID?.trim();
  const recipient = normalizePhoneNumber(opts.to);

  if (!apiKey || !deviceId) {
    return {
      ok: false,
      error: "TextBee is not configured — TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID are required.",
    };
  }

  if (!recipient) {
    return { ok: false, error: "Recipient phone number is invalid." };
  }

  let response: Response;
  try {
    response = await fetch(
      TEXTBEE_ENDPOINT,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          deviceId,
          recipients: [recipient],
          message: opts.message,
        }),
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Network error sending SMS: ${message}` };
  }

  if (!response.ok) {
    // Do not include the response body: third-party error payloads can contain
    // request details that should not be copied into application logs.
    return { ok: false, error: `TextBee API error ${response.status}.` };
  }

  return { ok: true };
}

/** Call once at startup to make SMS configuration visible without exposing secrets. */
export function logTextBeeConfigStatus(): void {
  if (isTextBeeConfigured()) {
    logger.info("TextBee configured — SMS sending enabled.");
  } else {
    logger.warn(
      "TextBee not configured — set TEXTBEE_API_KEY and TEXTBEE_DEVICE_ID to enable SMS.",
    );
  }
}