// Runtime feature flags.

// Whether the email-verification system is active. Defaults to ENABLED; set
// EMAIL_VERIFICATION_ENABLED=false (or 0) to turn it off — e.g. while no Resend
// sending domain is verified, so any email can register without a working link.
//
// Server/Node only. Do NOT import this into the edge auth config
// (`auth.config.ts`); `auth.ts`'s `authorize` runs in Node and can use it.
export function isEmailVerificationEnabled(): boolean {
  const value = process.env.EMAIL_VERIFICATION_ENABLED?.trim().toLowerCase();
  return value !== "false" && value !== "0";
}
