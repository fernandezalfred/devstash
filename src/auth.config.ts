import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// Edge-compatible config: providers + their field definitions, but no adapter
// and no DB/bcrypt logic. The Credentials `authorize` here is a placeholder —
// auth.ts overrides it with the real bcrypt validation (Node runtime only).
export default {
  // Custom sign-in page (Phase 3) — replaces NextAuth's default page.
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;
