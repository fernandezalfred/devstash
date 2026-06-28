import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Delete the authenticated user's account. Cascades to their items,
// collections, accounts, and sessions via the schema's onDelete: Cascade.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  // deleteMany so a since-deleted user (stale JWT) doesn't throw.
  await prisma.user.deleteMany({ where: { id: session.user.id } });

  // The JWT cookie is cleared client-side via signOut() after this resolves.
  return NextResponse.json({ success: true }, { status: 200 });
}
