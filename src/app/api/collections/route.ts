import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { createCollection } from "@/lib/db/collections";
import { checkCollectionQuota, getPlanContext } from "@/lib/plan";

const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

const CreateCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.preprocess(emptyToNull, z.string().nullable()).optional(),
});

// Creates a collection for the real authenticated user (not the demo user
// the rest of the collection/item reads are scoped to — see the Collection
// Create feature notes). Deliberately an API route rather than a Server
// Action, per explicit user direction for this feature.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateCollectionSchema.safeParse(body);
  if (!parsed.success) {
    const error = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  const { name, description } = parsed.data;

  const { isPro, collectionCount } = await getPlanContext(session.user.id);
  const gate = checkCollectionQuota(isPro, collectionCount);
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.error }, { status: 403 });
  }

  try {
    const collection = await createCollection(session.user.id, {
      name,
      description: description ?? null,
    });
    return NextResponse.json({ success: true, data: collection }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not create collection. Please try again." },
      { status: 500 },
    );
  }
}
