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
}): Promise<SendSignupOtpEmailResult> => {
  const from =
    process.env.SIGNUP_OTP_EMAIL_FROM?.trim() ||
    process.env.PASSWORD_RESET_EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    "";

  const safeCode = escapeHtml(opts.code);

  return sendTransactionalHtmlEmail({
    to: opts.to,
    from,
    subject: "Your verification code",
    html: `<p>Your sign-up verification code is:</p><p style="font-size:1.5rem;letter-spacing:0.25em;font-weight:600;">${safeCode}</p><p>This code expires in 15 minutes.</p><p>If you did not request this, you can ignore this email.</p>`,
    logTag: "sendSignupOtpEmail",
  });
};
