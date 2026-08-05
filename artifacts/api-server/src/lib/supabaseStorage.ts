/**
 * Supabase Storage helpers.
 *
 * Required environment variables:
 *   SUPABASE_URL              — e.g. https://xxxxxxxxxxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service-role key (not anon key)
 *   SUPABASE_BUCKET_NAME      — storage bucket name, e.g. "songs"
 *
 * Songs are uploaded from a temp disk file, then served via a short-lived
 * signed URL redirect — Supabase CDN handles HTTP Range requests natively,
 * so audio seeking / range playback just works with no extra server code.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_BUCKET_NAME
  );
}

function getClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

function getBucket(): string {
  return process.env.SUPABASE_BUCKET_NAME!;
}

/**
 * Upload a Buffer directly to Supabase Storage (preferred — no disk I/O needed).
 * @param key         Storage path, e.g. "songs/1720000000000-track.mp3"
 * @param buffer      File contents as a Node.js Buffer
 * @param contentType MIME type, e.g. "audio/mpeg"
 */
export async function uploadBufferToSupabase(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const client = getClient();
  const { error } = await client.storage
    .from(getBucket())
    .upload(key, buffer, { contentType, upsert: false });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
}

/**
 * Upload a file from disk to Supabase Storage.
 * @param key         Storage path, e.g. "songs/1720000000000-track.mp3"
 * @param filePath    Absolute local path
 * @param contentType MIME type, e.g. "audio/mpeg"
 */
export async function uploadFileToSupabase(
  key: string,
  filePath: string,
  contentType: string,
): Promise<void> {
  const client = getClient();
  const fileBuffer = fs.readFileSync(filePath);

  const { error } = await client.storage
    .from(getBucket())
    .upload(key, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
}

/**
 * Generate a signed URL for a stored object (valid for 1 hour).
 * Redirect the browser here — Supabase CDN handles Range requests natively.
 */
export async function getSupabaseSignedUrl(key: string): Promise<string> {
  const client = getClient();
  const { data, error } = await client.storage
    .from(getBucket())
    .createSignedUrl(key, 3600); // 1-hour expiry

  if (error || !data?.signedUrl) {
    throw new Error(`Supabase signed URL failed: ${error?.message ?? "no URL"}`);
  }
  return data.signedUrl;
}

/**
 * Create a signed URL that lets the browser upload directly to Supabase Storage.
 * The returned `signedUrl` accepts a PUT request with the file bytes.
 */
export async function createSupabaseUploadUrl(key: string): Promise<{ signedUrl: string; token: string; path: string }> {
  const client = getClient();
  const { data, error } = await client.storage
    .from(getBucket())
    .createSignedUploadUrl(key);

  if (error || !data) {
    throw new Error(`Supabase signed upload URL failed: ${error?.message ?? "no data"}`);
  }
  return { signedUrl: data.signedUrl, token: data.token, path: data.path };
}

/**
 * Delete a stored object. Silently ignores "not found" errors.
 */
export async function deleteFromSupabase(key: string): Promise<void> {
  const client = getClient();
  const { error } = await client.storage.from(getBucket()).remove([key]);
  if (error && !error.message.includes("Not Found")) {
    throw new Error(`Supabase delete failed: ${error.message}`);
  }
}
