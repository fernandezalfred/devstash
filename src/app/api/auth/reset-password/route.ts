import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { consumePasswordResetToken } from "@/lib/password-reset";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Missing reset token"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export async function POST(request: Request) {
  const { success, reset } = await checkRateLimit(
    "resetPassword",
    getClientIp(request),
  );
  if (!success) return tooManyRequests(reset);

  const body = await request.json().catch(() => null);

  const parsed = ResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const error = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  const { token, password } = parsed.data;

  // Single-use: the token is consumed (deleted) here whether or not it's valid.
  const result = await consumePasswordResetToken(token);
  if (result.status !== "ok") {
    const error =
      result.status === "expired"
        ? "This reset link has expired. Request a new one."
        : "This reset link is invalid or has already been used.";
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  // updateMany so a since-deleted user doesn't throw — it just updates 0 rows.
  // Completing a reset proves control of the inbox, so verify the email if it
  // wasn't already — otherwise an unverified user could reset their password
  // and still be blocked at sign-in by the verification gate. Only touch
  // still-unverified rows so an existing verification timestamp is preserved.
  await prisma.user.updateMany({
    where: { email: result.email },
    data: { passwordHash },
  });
  await prisma.user.updateMany({
    where: { email: result.email, emailVerified: null },
    data: { emailVerified: new Date() },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
