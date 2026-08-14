import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { toggleCollectionFavorite } from "@/lib/db/collections";

// Toggle a collection's favorite flag. Its own tiny endpoint rather than
// folding into PATCH /api/collections/[id] (whose body requires a name) — an
// API route, not a Server Action, matching this app's existing convention for
// collection mutations (see POST /api/collections and that route's notes).
export async function PATCH(
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

  try {
    const isFavorite = await toggleCollectionFavorite(id, session.user.id);
    if (isFavorite === null) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: true, data: { isFavorite } },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not update favorite. Please try again." },
      { status: 500 },
    );
  }
}
