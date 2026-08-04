/**
 * Cloudflare R2 storage helpers.
 *
 * Required environment variables:
 *   R2_ACCOUNT_ID      — Cloudflare account ID
 *   R2_ACCESS_KEY_ID   — R2 API token access key
 *   R2_SECRET_ACCESS_KEY — R2 API token secret key
 *   R2_BUCKET_NAME     — bucket name (e.g. "quizbunker-songs")
 *
 * The server streams audio directly from R2 — no file bytes are buffered in
 * Node.js memory, so playback never OOMs Render's free tier.
 */

import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { Readable } from "stream";
import fs from "fs";

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

function getClient(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID!;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

function getBucket(): string {
  return process.env.R2_BUCKET_NAME!;
}

/**
 * Upload a file from disk to R2 using a read stream (no full-file buffer).
 * @param key    R2 object key, e.g. "songs/1720000000000-track.mp3"
 * @param filePath  Absolute path to the local file
 * @param contentType  MIME type, e.g. "audio/mpeg"
 */
export async function uploadFileToR2(
  key: string,
  filePath: string,
  contentType: string,
): Promise<void> {
  const client = getClient();
  const fileStream = fs.createReadStream(filePath);

  const upload = new Upload({
    client,
    params: {
      Bucket: getBucket(),
      Key: key,
      Body: fileStream,
      ContentType: contentType,
    },
    // 5 MiB parts — keeps memory usage bounded even for large files
    partSize: 5 * 1024 * 1024,
    queueSize: 2,
  });

  await upload.done();
}

export interface R2StreamResult {
  body: Readable;
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  acceptRanges?: string;
  statusCode: 200 | 206;
}

/**
 * Stream an R2 object to the caller, optionally honouring an HTTP Range header.
 * The returned `body` stream must be piped to the response.
 */
export async function streamFromR2(
  key: string,
  rangeHeader?: string,
): Promise<R2StreamResult> {
  const client = getClient();

  const params: { Bucket: string; Key: string; Range?: string } = {
    Bucket: getBucket(),
    Key: key,
  };
  if (rangeHeader) params.Range = rangeHeader;

  const response = await client.send(new GetObjectCommand(params));

  return {
    body: response.Body as Readable,
    contentType: response.ContentType ?? "audio/mpeg",
    contentLength: response.ContentLength,
    contentRange: response.ContentRange,
    acceptRanges: response.AcceptRanges ?? "bytes",
    statusCode: rangeHeader ? 206 : 200,
  };
}

/**
 * Delete an R2 object. Silently ignores "key not found" errors.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
  );
}
