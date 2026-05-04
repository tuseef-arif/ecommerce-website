import {
  sendTransactionalHtmlEmail,
  type MailSendResult,
} from "@/lib/auth/mail-transport";

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Sends a password reset email via Resend or SMTP (see `EMAIL_PROVIDER` in `mail-transport.ts`).
 */
export const sendPasswordResetEmail = async (opts: {
  to: string;
  resetUrl: string;
  firstName?: string | null;
  lastName?: string | null;
}): Promise<MailSendResult> => {
  const from =
    process.env.PASSWORD_RESET_EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    "";

  const href = opts.resetUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const displayName = [opts.firstName?.trim(), opts.lastName?.trim()]
    .filter((p): p is string => Boolean(p && p.length > 0))
    .join(" ")
    .trim();
  const safeDisplayName = escapeHtml(displayName || "User");
  const html = `
    <div style="margin:0;padding:24px;background:var(--email-surface-bg,#f5f5f5);font-family:Arial,'Segoe UI',sans-serif;color:var(--email-body-text,#111827);">
      <div style="max-width:620px;margin:0 auto;background:var(--email-card-bg,#ffffff);border:1px solid var(--email-card-border,#e5e7eb);border-radius:8px;padding:32px;text-align:center;">
        <h1 style="margin:0 0 14px 0;font-size:32px;line-height:1.15;color:var(--email-brand-navy,#1e3a8a);font-weight:800;">Five Star Mobile</h1>

        <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:var(--email-body-text,#111827);">Reset your password</p>

        <div style="margin:20px 0 20px 0;text-align:left;">
          <p style="margin:0 0 12px 0;font-size:16px;line-height:1.7;">Hello ${safeDisplayName},</p>
          <p style="margin:0;font-size:16px;line-height:1.7;">We have received a password reset request for your account.</p>
        </div>

        <div style="margin:0 auto 24px auto;max-width:430px;background:var(--email-code-bg,#f3f4f6);border-radius:6px;padding:14px 16px;">
          <a href="${href}" style="display:inline-block;font-size:17px;line-height:1.4;font-weight:700;color:var(--email-accent,#f59e0b);text-decoration:underline;">
            Click here to Update Password
          </a>
        </div>

        <p style="margin:0 0 20px 0;text-align:left;font-size:14px;line-height:1.7;color:var(--email-muted-text,#6b7280);">This link expires in one hour.</p>

        <hr style="border:0;border-top:1px solid var(--email-card-border,#e5e7eb);margin:0 0 20px 0;" />
        <p style="margin:0;text-align:left;font-size:14px;line-height:1.7;color:var(--email-muted-text,#6b7280);">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  return sendTransactionalHtmlEmail({
    to: opts.to,
    from,
    subject: "FSM Reset Password",
    html,
    logTag: "sendPasswordResetEmail",
  });
};
