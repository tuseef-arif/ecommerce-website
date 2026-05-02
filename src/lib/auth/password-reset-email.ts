type SendResult = { ok: boolean };

/**
 * Sends a password reset email via [Resend](https://resend.com) when
 * `RESEND_API_KEY` and `PASSWORD_RESET_EMAIL_FROM` are set.
 * Fails closed (returns ok: false) without throwing.
 */
export const sendPasswordResetEmail = async (opts: {
  to: string;
  resetUrl: string;
}): Promise<SendResult> => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.PASSWORD_RESET_EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    return { ok: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: "Reset Password",
        html: `<p>We received a request to reset your password.</p><p><a href="${opts.resetUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">Choose a new password</a></p><p>This link expires in one hour.</p>`,
      }),
    });

    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
};
