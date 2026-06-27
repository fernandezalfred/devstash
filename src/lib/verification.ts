import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

// How long a verification link stays valid after it is issued.
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// Reuses the NextAuth `VerificationToken` model (identifier/token/expires).
// `identifier` holds the user's email; `token` is an opaque random string.

export async function createVerificationToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  // Invalidate any outstanding tokens for this email so only the newest link works.
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  return token;
}

export type ConsumeResult =
  | { status: "ok"; email: string }
  | { status: "expired" }
  | { status: "invalid" };

// Single-use: the token is always deleted on consumption, valid or not.
export async function consumeVerificationToken(
  token: string,
): Promise<ConsumeResult> {
  const record = await prisma.verificationToken.findFirst({ where: { token } });
  if (!record) return { status: "invalid" };

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: record.identifier, token } },
  });

  if (record.expires < new Date()) return { status: "expired" };
  return { status: "ok", email: record.identifier };
}

// Absolute URL the email links to. Prefers AUTH_URL when set, otherwise the
// origin of the incoming request (works in local dev).
export function buildVerifyUrl(origin: string, token: string): string {
  const base = process.env.AUTH_URL ?? origin;
  const url = new URL("/verify-email", base);
  url.searchParams.set("token", token);
  return url.toString();
}
