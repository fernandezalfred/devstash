import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";
import { isEmailVerificationEnabled } from "@/lib/flags";
import { checkRateLimit, getClientIp, retryAfter } from "@/lib/rate-limit";

// Thrown when credentials are valid but the email hasn't been verified yet.
// The `code` surfaces to the client via signIn()'s result so the form can show
// a specific "verify your email" message (and offer to resend).
export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

// Thrown when too many sign-in attempts come from the same IP+email. The `code`
// surfaces to the client so the form can show a "too many attempts" message.
// The credentials callback (/api/auth/callback/credentials) is handled inside
// NextAuth, so this is where we can hook rate limiting for login. The retry time
// (minutes) is packed into the code — `rate_limited_<minutes>` — since the JSON
// body/headers other endpoints use aren't available through NextAuth's error.
export class RateLimitError extends CredentialsSignin {
  code: string;
  constructor(retryMinutes?: number) {
    super();
    this.code = retryMinutes ? `rate_limited_${retryMinutes}` : "rate_limited";
  }
}

// Real credentials validation. Kept here (not in auth.config.ts) so bcrypt and
// the Prisma adapter stay out of the edge config. This overrides the placeholder
// Credentials provider from auth.config.ts with a Node-runtime `authorize`.
const credentials = Credentials({
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  authorize: async (creds, request) => {
    const email =
      typeof creds?.email === "string" ? creds.email.trim().toLowerCase() : null;
    const password = typeof creds?.password === "string" ? creds.password : null;
    if (!email || !password) return null;

    // Throttle before the (expensive) DB lookup + bcrypt compare, keyed by
    // IP + email. Fails open when rate limiting isn't configured.
    const ip = getClientIp(request);
    const { success, reset } = await checkRateLimit("login", `${ip}:${email}`);
    if (!success) throw new RateLimitError(retryAfter(reset).minutes);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    // Credentials are correct but the email must be verified before sign-in
    // (only enforced while the verification system is enabled).
    if (isEmailVerificationEnabled() && !user.emailVerified) {
      throw new EmailNotVerifiedError();
    }

    return { id: user.id, name: user.name, email: user.email, image: user.image };
  },
});

// Full config: the Prisma adapter persists users/accounts, and the JWT session
// strategy keeps the proxy edge-compatible (no DB access in middleware).
export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  // Swap the placeholder credentials provider for the real one above.
  providers: authConfig.providers.map((provider) =>
    typeof provider !== "function" && provider.id === "credentials"
      ? credentials
      : provider,
  ),
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present on initial sign-in.
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
