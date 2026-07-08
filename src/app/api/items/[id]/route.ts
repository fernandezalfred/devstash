import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";

// Full detail for a single item, loaded when the item drawer opens. Requires an
// authenticated session; the item itself is demo-user-scoped (matching the list
// views) until the data layer moves off the demo user. Returns 404 when the item
// doesn't exist, 401 when not signed in.
export async function GET(
  _request: Request,
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
  const item = await getItemDetail(id);
  if (!item) {
    return NextResponse.json(
      { success: false, error: "Item not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: item }, { status: 200 });
}
