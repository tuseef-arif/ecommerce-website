/**
 * Transactional mail: Resend (HTTP) or SMTP (Nodemailer, e.g. Gmail).
 *
 * **Choose provider**
 * - `EMAIL_PROVIDER` unset or `resend` → Resend API
 * - `EMAIL_PROVIDER=smtp` (or `gmail` / `nodemailer`) → SMTP
 *
 * **Resend (.env.local)**
 * `RESEND_API_KEY` — API key
 * From header: set per feature (`SIGNUP_OTP_EMAIL_FROM`, `PASSWORD_RESET_EMAIL_FROM`,
 * `ORDER_PLACED_EMAIL_FROM`) or `SMTP_FROM`
 *
 * **SMTP / Gmail (.env.local)**
 * `EMAIL_PROVIDER=smtp`
 * `SMTP_HOST=smtp.gmail.com`
 * `SMTP_PORT=465` (SSL) or `587` (STARTTLS)
 * `SMTP_SECURE=true` for port 465; omit or `false` for 587
 * `SMTP_USER=you@gmail.com`
 * `SMTP_PASS=` Google App Password (16 chars, not your normal password)
 * `SMTP_FROM="My App <you@gmail.com>"` or use per-feature `*_EMAIL_FROM` values
 *
 * Restart `npm run dev` after changing env.
 */
import nodemailer from "nodemailer";

export type MailSendFailureKind =
  | "MISSING_FROM"
  | "MISSING_RESEND_API_KEY"
  | "MISSING_SMTP_CONFIG"
  | "PROVIDER_REJECTED"
  | "NETWORK_ERROR";

export type MailSendResult =
  | { ok: true }
  | { ok: false; kind: MailSendFailureKind };

/**
 * `resend` (default) uses Resend’s HTTP API. `smtp` uses Nodemailer (Gmail and other SMTP servers).
 * Set `EMAIL_PROVIDER=smtp` for SMTP.
 */
export const getMailProvider = (): "resend" | "smtp" => {
  const raw = process.env.EMAIL_PROVIDER?.trim().toLowerCase() ?? "";
  if (raw === "smtp" || raw === "gmail" || raw === "nodemailer") {
    return "smtp";
  }
  return "resend";
};

const sendViaResend = async (opts: {
  to: string;
  from: string;
  subject: string;
  html: string;
  logTag: string;
}): Promise<MailSendResult> => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, kind: "MISSING_RESEND_API_KEY" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: opts.from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });

    if (!res.ok) {
      let message = "";
      try {
        const body = (await res.json()) as { message?: string };
        message = typeof body?.message === "string" ? body.message : "";
      } catch {
        /* ignore */
      }
      console.error(
        `[${opts.logTag}] Resend rejected request:`,
        res.status,
        message || "(no message body)",
      );
      return { ok: false, kind: "PROVIDER_REJECTED" };
    }

    return { ok: true };
  } catch (err) {
    console.error(`[${opts.logTag}] Resend network error:`, err);
    return { ok: false, kind: "NETWORK_ERROR" };
  }
};

const sendViaSmtp = async (opts: {
  to: string;
  from: string;
  subject: string;
  html: string;
  logTag: string;
}): Promise<MailSendResult> => {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    return { ok: false, kind: "MISSING_SMTP_CONFIG" };
  }

  const portRaw = process.env.SMTP_PORT?.trim();
  const portParsed = portRaw ? Number(portRaw) : NaN;
  const port = Number.isFinite(portParsed) && portParsed > 0 ? portParsed : 587;

  const secureRaw = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure =
    secureRaw === "true" || secureRaw === "1" || (!secureRaw && port === 465);

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure && port === 587,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });

    if (info.rejected.length > 0) {
      console.error(
        `[${opts.logTag}] SMTP rejected recipients:`,
        info.rejected,
      );
      return { ok: false, kind: "PROVIDER_REJECTED" };
    }

    return { ok: true };
  } catch (err) {
    console.error(`[${opts.logTag}] SMTP error:`, err);
    return { ok: false, kind: "PROVIDER_REJECTED" };
  }
};

/**
 * Sends one HTML email through Resend or SMTP based on `EMAIL_PROVIDER`.
 */
export const sendTransactionalHtmlEmail = async (opts: {
  to: string;
  from: string;
  subject: string;
  html: string;
  logTag: string;
}): Promise<MailSendResult> => {
  const from = opts.from.trim();
  if (!from) {
    return { ok: false, kind: "MISSING_FROM" };
  }

  const provider = getMailProvider();
  if (provider === "smtp") {
    return sendViaSmtp({ ...opts, from });
  }

  return sendViaResend({ ...opts, from });
};
