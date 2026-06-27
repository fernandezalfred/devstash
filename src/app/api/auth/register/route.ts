import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { buildVerifyUrl, createVerificationToken } from "@/lib/verification";
import { isEmailVerificationEnabled } from "@/lib/flags";

const RegisterSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    const error = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "A user with that email already exists" },
      { status: 409 },
    );
  }

  // When verification is disabled, mark the account verified immediately and
  // skip the email entirely (e.g. no Resend sending domain configured yet).
  const verificationRequired = isEmailVerificationEnabled();

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      emailVerified: verificationRequired ? null : new Date(),
    },
  });

  // Send the verification email. A failure here doesn't fail registration —
  // the account exists and the user can request a fresh link later.
  if (verificationRequired) {
    try {
      const token = await createVerificationToken(email);
      const origin = new URL(request.url).origin;
      const result = await sendVerificationEmail({
        to: email,
        name,
        verifyUrl: buildVerifyUrl(origin, token),
      });
      if (!result.ok) {
        console.error("Verification email not sent:", result.error);
      }
    } catch (err) {
      console.error("Failed to send verification email", err);
    }
  }

  return NextResponse.json(
    {
      success: true,
      data: { id: user.id, email: user.email, verificationRequired },
    },
    { status: 201 },
  );
}
