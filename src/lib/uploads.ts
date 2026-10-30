import sharp from "sharp";
import { createWriteStream, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// ─── Allowed MIME types ───────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES ?? "5242880");

// ─── Storage backend ──────────────────────────────────────────────────────────

const USE_LOCAL =
  process.env.USE_LOCAL_STORAGE === "true" ||
  !process.env.R2_ACCOUNT_ID ||
  !process.env.R2_ACCESS_KEY_ID;

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

// ─── Local storage helpers ────────────────────────────────────────────────────

const LOCAL_UPLOAD_DIR = join(process.cwd(), "public", "uploads");

function ensureLocalDir() {
  if (!existsSync(LOCAL_UPLOAD_DIR)) {
    mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
}

// ─── Main upload function ─────────────────────────────────────────────────────

export interface UploadResult {
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export async function uploadReportPhoto(
  fileBuffer: Buffer,
  originalMimeType: string
): Promise<UploadResult> {
  // 1. Validate MIME type
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(originalMimeType)) {
    throw new Error(`Unsupported file type: ${originalMimeType}`);
  }

  // 2. Validate size
  if (fileBuffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`File too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
  }

  // 3. Process with Sharp: resize, strip metadata, convert to WebP
  const processed = await sharp(fileBuffer)
    .rotate() // auto-orient from EXIF
    .resize(1280, 960, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .withMetadata({ orientation: undefined }) // strip location/device EXIF
    .toBuffer();

  const storageKey = `reports/${randomUUID()}.webp`;

  if (USE_LOCAL) {
    ensureLocalDir();
    const filePath = join(LOCAL_UPLOAD_DIR, storageKey.replace("reports/", ""));
    await sharp(processed).toFile(filePath);
    return {
      storageKey,
      publicUrl: `/uploads/${storageKey.replace("reports/", "")}`,
      mimeType: "image/webp",
      sizeBytes: processed.length,
    };
  }

  // Upload to Cloudflare R2
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: storageKey,
      Body: processed,
      ContentType: "image/webp",
      // No public read ACL on R2 — served via public URL
    })
  );

  return {
    storageKey,
    publicUrl: `${process.env.R2_PUBLIC_URL}/${storageKey}`,
    mimeType: "image/webp",
    sizeBytes: processed.length,
  };
}

export async function deleteUpload(storageKey: string): Promise<void> {
  if (USE_LOCAL) {
    const { unlink } = await import("fs/promises");
    const filePath = join(LOCAL_UPLOAD_DIR, storageKey.replace("reports/", ""));
    try {
      await unlink(filePath);
    } catch {
      // Ignore missing files
    }
    return;
  }

  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: storageKey,
    })
  );
}
