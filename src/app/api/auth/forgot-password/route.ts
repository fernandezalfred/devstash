import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { buildResetUrl, createPasswordResetToken } from "@/lib/password-reset";

const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const parsed = ForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid email address" },
      { status: 400 },
    );
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Only send for an existing account that actually has a password (OAuth-only
  // users have no passwordHash and can't reset one). Always respond the same
  // way so this endpoint can't be used to probe which emails are registered.
  if (user?.passwordHash) {
    try {
      const token = await createPasswordResetToken(email);
      const origin = new URL(request.url).origin;
      const result = await sendPasswordResetEmail({
        to: email,
        name: user.name,
        resetUrl: buildResetUrl(origin, token),
      });
      if (!result.ok) {
        console.error("Password reset email not sent:", result.error);
      }
    } catch (err) {
      console.error("Failed to send password reset email", err);
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
