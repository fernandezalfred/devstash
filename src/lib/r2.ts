import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// Cloudflare R2 via the S3-compatible API. Server-only — never import from
// client components (credentials live in env).

// Lazily construct the client so missing env vars don't break the build/import.
let client: S3Client | null = null;
function getR2(): S3Client {
  if (!client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "R2 is not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)",
      );
    }
    client = new S3Client({
      region: "auto", // required by the SDK, unused by R2
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      // AWS SDK ≥3.729 defaults to CRC32 checksums R2 doesn't accept on all
      // operations; only send checksums when an operation requires them.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME is not set");
  return bucket;
}

// Object key for a new upload: a random prefix guarantees uniqueness while the
// sanitized original name keeps keys/browser downloads readable.
export function buildObjectKey(typeName: string, fileName: string): string {
  const safeName = fileName
    .replace(/[\\/]/g, "-") // no path separators
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(-120); // keep keys bounded; the tail preserves the extension
  return `${typeName}s/${randomUUID()}/${safeName || "file"}`;
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await getR2().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

// Fetch an object as a web ReadableStream (plus its size) for proxying to the
// browser. Returns null when the object doesn't exist.
export async function getFromR2(
  key: string,
): Promise<{ body: ReadableStream; size: number | null } | null> {
  try {
    const response = await getR2().send(
      new GetObjectCommand({ Bucket: getBucket(), Key: key }),
    );
    if (!response.Body) return null;
    return {
      body: response.Body.transformToWebStream() as ReadableStream,
      size: response.ContentLength ?? null,
    };
  } catch (error) {
    if ((error as { name?: string }).name === "NoSuchKey") return null;
    throw error;
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  await getR2().send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
  );
}
