import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  // Fail loudly in non-production so misconfiguration is caught early in dev.
  // In production, route handlers will surface a 500 if the client is used.
  console.warn("[email] RESEND_API_KEY is not set — email sending will fail.");
}

export const resend = new Resend(apiKey ?? "");

export const FROM_EMAIL = process.env.EMAIL_FROM || "DevStash <onboarding@resend.dev>";

function getAppUrl(): string {
  return process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3000";
}

export async function sendVerificationEmail(params: {
  to: string;
  token: string;
  name?: string | null;
}) {
  const verifyUrl = `${getAppUrl()}/api/auth/verify?token=${encodeURIComponent(params.token)}`;
  const greeting = params.name ? `Hi ${params.name},` : "Hi there,";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">Verify your email for DevStash</h1>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">${greeting}</p>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Welcome to DevStash. Click the button below to verify your email address and activate your account.
      </p>
      <p style="margin: 0 0 24px;">
        <a href="${verifyUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">Verify email</a>
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 8px;">
        Or paste this link into your browser:
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #475569; word-break: break-all; margin: 0 0 24px;">
        ${verifyUrl}
      </p>
      <p style="font-size: 12px; line-height: 1.6; color: #64748b; margin: 0;">
        This link expires in 24 hours. If you didn't create a DevStash account, you can safely ignore this email.
      </p>
    </div>
  `;

  const text = [
    "Verify your email for DevStash",
    "",
    greeting,
    "",
    "Welcome to DevStash. Click the link below to verify your email address and activate your account:",
    "",
    verifyUrl,
    "",
    "This link expires in 24 hours. If you didn't create a DevStash account, you can safely ignore this email.",
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Verify your email for DevStash",
    html,
    text,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
  return data;
}
