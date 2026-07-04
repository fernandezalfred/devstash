import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { buildVerifyUrl, createVerificationToken } from "@/lib/verification";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

const ResendSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const parsed = ResendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid email address" },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  // Keyed by IP + email so a single client can't hammer the send endpoint.
  const ip = getClientIp(request);
  const { success, reset } = await checkRateLimit(
    "resendVerification",
    `${ip}:${email}`,
  );
  if (!success) return tooManyRequests(reset);

  const user = await prisma.user.findUnique({ where: { email } });

  // Only send for an existing, still-unverified account. Always respond the
  // same way so this endpoint can't be used to probe which emails are registered.
  if (user && !user.emailVerified) {
    try {
      const token = await createVerificationToken(email);
      const origin = new URL(request.url).origin;
      const result = await sendVerificationEmail({
        to: email,
        name: user.name,
        verifyUrl: buildVerifyUrl(origin, token),
      });
      if (!result.ok) {
        console.error("Verification email not sent:", result.error);
      }
    } catch (err) {
      console.error("Failed to resend verification email", err);
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
