import { Resend } from "resend";

// Sandbox sender works without domain setup but only delivers to the Resend
// account owner's email. Override with a verified domain via EMAIL_FROM for
// real delivery to arbitrary users.
const EMAIL_FROM = process.env.EMAIL_FROM ?? "DevStash <onboarding@resend.dev>";

// Lazily construct the client so a missing key doesn't break the build/import.
let client: Resend | null = null;
function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    client = new Resend(key);
  }
  return client;
}

interface SendVerificationEmailParams {
  to: string;
  name: string | null;
  verifyUrl: string;
}

// Escape user-controlled text before interpolating into the email HTML so a
// crafted name can't inject markup into the message body.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendVerificationEmail({
  to,
  name,
  verifyUrl,
}: SendVerificationEmailParams): Promise<{ ok: boolean; error?: string }> {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h1 style="font-size: 20px; margin-bottom: 16px;">Verify your email</h1>
      <p style="font-size: 14px; line-height: 1.6;">${greeting}</p>
      <p style="font-size: 14px; line-height: 1.6;">
        Thanks for signing up for DevStash. Please confirm your email address by
        clicking the button below. This link expires in 24 hours.
      </p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: #3b82f6; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Verify email
        </a>
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #64748b;">
        If the button doesn't work, copy and paste this link into your browser:<br />
        <a href="${verifyUrl}" style="color: #3b82f6; word-break: break-all;">${verifyUrl}</a>
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #64748b;">
        If you didn't create a DevStash account, you can safely ignore this email.
      </p>
    </div>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: "Verify your DevStash email",
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}

interface SendPasswordResetEmailParams {
  to: string;
  name: string | null;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailParams): Promise<{ ok: boolean; error?: string }> {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h1 style="font-size: 20px; margin-bottom: 16px;">Reset your password</h1>
      <p style="font-size: 14px; line-height: 1.6;">${greeting}</p>
      <p style="font-size: 14px; line-height: 1.6;">
        We received a request to reset your DevStash password. Click the button
        below to choose a new one. This link expires in 1 hour.
      </p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Reset password
        </a>
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #64748b;">
        If the button doesn't work, copy and paste this link into your browser:<br />
        <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #64748b;">
        If you didn't request a password reset, you can safely ignore this email —
        your password won't change.
      </p>
    </div>
  `;

  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: "Reset your DevStash password",
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}
