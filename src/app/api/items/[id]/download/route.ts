import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemFile } from "@/lib/db/items";
import { getFromR2 } from "@/lib/r2";
import { contentTypeForFileName } from "@/lib/uploads";

// Stream a FILE item's stored object from R2 through the app, so the browser
// never talks to the bucket (no CORS, bucket stays private). Serves inline by
// default (image previews); `?download=1` forces a save-as attachment.
// Requires an authenticated session; the item lookup is demo-user-scoped
// (matching the rest of the data layer).

// RFC 5987 filename* fallback for non-ASCII names; the plain filename= keeps a
// sanitized ASCII version for older clients.
function contentDisposition(kind: "inline" | "attachment", fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const file = await getItemFile(id);
  if (!file) {
    return NextResponse.json(
      { success: false, error: "File not found" },
      { status: 404 },
    );
  }

  let object: Awaited<ReturnType<typeof getFromR2>>;
  try {
    object = await getFromR2(file.fileKey);
  } catch (error) {
    console.error(`R2 fetch failed for ${file.fileKey}:`, error);
    return NextResponse.json(
      { success: false, error: "Could not fetch the file" },
      { status: 502 },
    );
  }
  if (!object) {
    return NextResponse.json(
      { success: false, error: "File not found" },
      { status: 404 },
    );
  }

  const download = new URL(request.url).searchParams.get("download") === "1";

  const headers = new Headers({
    "Content-Type": contentTypeForFileName(file.fileName),
    "Content-Disposition": contentDisposition(
      download ? "attachment" : "inline",
      file.fileName,
    ),
    // Uploads are user content: sandbox inline rendering so an uploaded SVG
    // (or HTML-ish file) can't run scripts on our origin if opened directly.
    "Content-Security-Policy":
      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, max-age=0, must-revalidate",
  });
  if (object.size !== null) {
    headers.set("Content-Length", String(object.size));
  }

  return new Response(object.body, { status: 200, headers });
}
