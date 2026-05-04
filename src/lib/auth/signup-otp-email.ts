import {
  sendTransactionalHtmlEmail,
  type MailSendResult,
} from "@/lib/auth/mail-transport";

/** Same shape as {@link MailSendResult}; kept for call-site clarity. */
export type SendSignupOtpEmailResult = MailSendResult;

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Sends sign-up verification OTP via Resend (`EMAIL_PROVIDER=resend` or unset)
 * or SMTP (`EMAIL_PROVIDER=smtp`). See `mail-transport.ts` for env variables.
 */
export const sendSignupOtpEmail = async (opts: {
  to: string;
  code: string;
  firstName?: string | null;
  lastName?: string | null;
}): Promise<SendSignupOtpEmailResult> => {
  const from =
    process.env.SIGNUP_OTP_EMAIL_FROM?.trim() ||
    process.env.PASSWORD_RESET_EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    "";

  const safeCode = escapeHtml(opts.code);
  const displayName = [opts.firstName?.trim(), opts.lastName?.trim()]
    .filter((p): p is string => Boolean(p && p.length > 0))
    .join(" ")
    .trim();
  const safeDisplayName = escapeHtml(displayName || "User");

  return sendTransactionalHtmlEmail({
    to: opts.to,
    from,
    subject: `[${safeCode}] - FSM Sign-up Verification`,
    html: `
      <div style="margin:0;padding:24px;background:var(--email-surface-bg,#f5f5f5);font-family:Arial,'Segoe UI',sans-serif;color:var(--email-body-text,#111827);">
        <div style="max-width:620px;margin:0 auto;background:var(--email-card-bg,#ffffff);border:1px solid var(--email-card-border,#e5e7eb);border-radius:8px;padding:32px;text-align:center;">
          <h1 style="margin:0 0 14px 0;font-size:32px;line-height:1.15;color:var(--email-brand-navy,#1e3a8a);font-weight:800;">Five Star Mobile</h1>

          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:var(--email-body-text,#111827);">Verify your email.</p>

          <div style="margin:20px 0 20px 0;text-align:left;">
            <p style="margin:0 0 12px 0;font-size:16px;line-height:1.7;">Hello ${safeDisplayName},</p>
            <p style="margin:0 0 8px 0;font-size:16px;line-height:1.7;">We have received a sign-up attempt.</p>
            <p style="margin:0;font-size:16px;line-height:1.7;">To complete the sign-up process use this 6-digit code.</p>
          </div>

          <div style="margin:0 auto 24px auto;max-width:430px;background:var(--email-code-bg,#f3f4f6);border-radius:6px;padding:14px 16px;font-size:34px;line-height:1;font-weight:700;letter-spacing:0.24em;color:var(--email-accent,#f59e0b);">
            ${safeCode}
          </div>

          <hr style="border:0;border-top:1px solid var(--email-card-border,#e5e7eb);margin:0 0 20px 0;" />
          <p style="margin:0;text-align:left;font-size:14px;line-height:1.7;color:var(--email-muted-text,#6b7280);">
            If you did not attempt to sign in but received this email, or if the location does not match, please ignore this email.
            Don't share or forward the 6-digit code with anyone. Our customer service will never ask for it.
          </p>
        </div>
      </div>
    `,
    logTag: "sendSignupOtpEmail",
  });
};
