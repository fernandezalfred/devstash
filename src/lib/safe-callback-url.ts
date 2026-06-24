// Guard against open redirects: only allow same-origin relative paths as a
// post-auth destination. Anything else (absolute URLs, protocol-relative
// "//evil.com", etc.) falls back to the dashboard.
export function safeCallbackUrl(callbackUrl?: string | null): string {
  if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
    return callbackUrl;
  }
  return "/dashboard";
}
