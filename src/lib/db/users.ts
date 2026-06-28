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

export interface ProfileUser extends CurrentUser {
  createdAt: Date;
  // True when the user signed up with email/password (has a passwordHash);
  // false for OAuth-only users (gates the change-password action).
  hasPassword: boolean;
}

// Like getCurrentUser, but with the extra fields the profile page needs.
export async function getProfileUser(): Promise<ProfileUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isPro: true,
      createdAt: true,
      passwordHash: true,
    },
  });
  if (!user) return null;

  const { passwordHash, ...rest } = user;
  return { ...rest, hasPassword: passwordHash !== null };
}
