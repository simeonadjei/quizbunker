import { db, activityLogsTable } from "@workspace/db";
import type { Request } from "express";

export type ActivityType =
  | "register"
  | "login"
  | "logout"
  | "email_verify"
  | "resend_verification"
  | "password_reset_request"
  | "password_reset"
  | "payment_init"
  | "payment_success"
  | "quiz_start"
  | "quiz_complete"
  | "admin_login";

export interface LogActivityOptions {
  type: ActivityType;
  req?: Request;
  userId?: number | null;
  userEmail?: string | null;
  userName?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logActivity(opts: LogActivityOptions): Promise<void> {
  try {
    const ip = opts.req
      ? (opts.req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim() ||
        opts.req.socket?.remoteAddress ||
        null
      : null;

    await db.insert(activityLogsTable).values({
      type: opts.type,
      userId: opts.userId ?? null,
      userEmail: opts.userEmail ?? null,
      userName: opts.userName ?? null,
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
      ip,
    });
  } catch {
    // Activity logging must never crash the main request
  }
}
