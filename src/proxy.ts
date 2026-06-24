import { auth } from "@/auth";

// Protect /dashboard/* and /profile/* — redirect unauthenticated users to the
// custom sign-in page (Phase 3), preserving where they were headed via callbackUrl.
export const proxy = auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
