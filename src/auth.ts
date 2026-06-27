import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";

// Thrown when credentials are valid but the email hasn't been verified yet.
// The `code` surfaces to the client via signIn()'s result so the form can show
// a specific "verify your email" message (and offer to resend).
export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

// Real credentials validation. Kept here (not in auth.config.ts) so bcrypt and
// the Prisma adapter stay out of the edge config. This overrides the placeholder
// Credentials provider from auth.config.ts with a Node-runtime `authorize`.
const credentials = Credentials({
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  authorize: async (creds) => {
    const email =
      typeof creds?.email === "string" ? creds.email.trim().toLowerCase() : null;
    const password = typeof creds?.password === "string" ? creds.password : null;
    if (!email || !password) return null;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    // Credentials are correct but the email must be verified before sign-in.
    if (!user.emailVerified) throw new EmailNotVerifiedError();

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
