import { auth } from "@/auth";
import { Prisma } from "@/generated/prisma/client";
import { parseEditorPreferences, type EditorPreferences } from "@/lib/editor-preferences";
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

// The given user's Monaco editor preferences, or the defaults when they've
// never changed a preference (the column is null). Takes an explicit userId
// like the other list-page DB helpers — every caller here already resolved
// the current user before reaching this.
export async function getEditorPreferences(
  userId: string,
): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });
  return parseEditorPreferences(user?.editorPreferences ?? null);
}

// Persists the given user's editor preferences wholesale (the settings form
// always submits the full object, not a partial patch).
export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences,
): Promise<EditorPreferences> {
  await prisma.user.update({
    where: { id: userId },
    // Prisma's Json input type requires an index signature that the named
    // EditorPreferences interface doesn't have; every field is a plain
    // JSON-compatible primitive, so this widening is safe.
    data: {
      editorPreferences: preferences as unknown as Prisma.InputJsonValue,
    },
  });
  return preferences;
}
