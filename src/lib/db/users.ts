import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isPro: boolean;
}

// Resolve the authenticated user from the session, then load the authoritative
// row from the DB (so fields like `isPro` are fresh, not stale JWT claims).
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, isPro: true },
  });
}
