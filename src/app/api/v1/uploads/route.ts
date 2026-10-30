import { NextRequest, NextResponse } from "next/server";
import { uploadReportPhoto } from "@/lib/uploads";
import { requireAuth, isAuthError } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

/**
 * Item 18: Magic-byte sniffing to verify real image headers,
 * preventing malicious executable or script files disguised as images.
 */
function verifyMagicBytes(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export async function POST(request: NextRequest) {
  // Authentication required to upload media files
  const user = await requireAuth();
  if (isAuthError(user)) return user;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Size limit: 5 MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 5 MB limit." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sniff magic bytes
    const verifiedMime = verifyMagicBytes(buffer);
    if (!verifiedMime) {
      return NextResponse.json(
        {
          error:
            "Invalid image file signature. Only authentic JPG, PNG, and WebP images are permitted.",
        },
        { status: 400 }
      );
    }

    // Process photo with Sharp (strip EXIF GPS, auto-orient, compress to WebP)
    const uploadResult = await uploadReportPhoto(buffer, verifiedMime);

    return NextResponse.json({
      success: true,
      publicUrl: uploadResult.publicUrl,
      storageKey: uploadResult.storageKey,
      mimeType: uploadResult.mimeType,
      sizeBytes: uploadResult.sizeBytes,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Image processing or upload failed." },
      { status: 500 }
    );
  }
}
