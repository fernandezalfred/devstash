import { auth } from "@/auth";

// Protect /dashboard/* — redirect unauthenticated users to NextAuth's default
// sign-in page, preserving where they were headed via callbackUrl.
export const proxy = auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
