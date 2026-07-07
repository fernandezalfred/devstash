import { auth } from "@/auth";

// Protect /dashboard/*, /items/* and /profile/* — redirect unauthenticated users
// to the custom sign-in page (Phase 3), preserving where they were headed via callbackUrl.
export const proxy = auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    // Use a relative path (not the absolute href) so safeCallbackUrl accepts it
    // and the user returns to where they were headed after signing in.
    signInUrl.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search,
    );
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/items/:path*", "/profile/:path*"],
};
