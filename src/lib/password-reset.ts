import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

// How long a password-reset link stays valid after it is issued. Shorter than
// email verification (24h) since a reset grants account access.
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

// Reuses the NextAuth `VerificationToken` model (identifier/token/expires).
// To avoid colliding with email-verification tokens (which store the bare
// email as `identifier`), reset tokens namespace the identifier with a prefix.
// This keeps the two flows from clobbering each other's tokens.
const RESET_PREFIX = "password-reset:";

function resetIdentifier(email: string): string {
  return `${RESET_PREFIX}${email}`;
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);
  const identifier = resetIdentifier(email);

  // Invalidate any outstanding reset tokens for this email so only the newest
  // link works. Scoped to the namespaced identifier, so verification tokens
  // for the same email are left untouched.
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export type ConsumeResetResult =
  | { status: "ok"; email: string }
  | { status: "expired" }
  | { status: "invalid" };

// Single-use: a matching reset token is always deleted on consumption, valid
// or not. Tokens whose identifier isn't namespaced as a reset token are
// treated as invalid (e.g. an email-verification token).
export async function consumePasswordResetToken(
  token: string,
): Promise<ConsumeResetResult> {
  const record = await prisma.verificationToken.findFirst({ where: { token } });
  if (!record || !record.identifier.startsWith(RESET_PREFIX)) {
    return { status: "invalid" };
  }

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: record.identifier, token } },
  });

  if (record.expires < new Date()) return { status: "expired" };
  return { status: "ok", email: record.identifier.slice(RESET_PREFIX.length) };
}

// Absolute URL the reset email links to. Prefers AUTH_URL when set, otherwise
// the origin of the incoming request (works in local dev).
export function buildResetUrl(origin: string, token: string): string {
  const base = process.env.AUTH_URL ?? origin;
  const url = new URL("/reset-password", base);
  url.searchParams.set("token", token);
  return url.toString();
}
