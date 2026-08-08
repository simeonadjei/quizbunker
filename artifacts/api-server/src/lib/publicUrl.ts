import type { Request } from "express";

/**
 * The frontend's public origin used in links sent by email.
 *
 * PUBLIC_APP_URL/APP_URL should be set in production. The Quiz Bunker domain
 * remains the safe fallback for existing deployments.
 */
export function publicAppUrl(_req?: Request): string {
  return (
    process.env.PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "https://quizbunker.com"
  ).replace(/\/+$/, "");
}