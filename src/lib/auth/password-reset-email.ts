import {
  sendTransactionalHtmlEmail,
  type MailSendResult,
} from "@/lib/auth/mail-transport";

/**
 * Sends a password reset email via Resend or SMTP (see `EMAIL_PROVIDER` in `mail-transport.ts`).
 */
export const sendPasswordResetEmail = async (opts: {
  to: string;
  resetUrl: string;
}): Promise<MailSendResult> => {
  const from =
    process.env.PASSWORD_RESET_EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    "";

  const href = opts.resetUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const html = `<p>We received a request to reset your password.</p><p><a href="${href}">Choose a new password</a></p><p>This link expires in one hour.</p>`;

  return sendTransactionalHtmlEmail({
    to: opts.to,
    from,
    subject: "Reset Password",
    html,
    logTag: "sendPasswordResetEmail",
  });
};
