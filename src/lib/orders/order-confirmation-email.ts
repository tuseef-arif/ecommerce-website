import type { PaymentMethod } from "@/generated/prisma/enums";
import {
  sendTransactionalHtmlEmail,
  type MailSendResult,
} from "@/lib/auth/mail-transport";
import {
  SITE_PRODUCT_SLIDER,
  SITE_URL_ORIGIN,
  STORE_PHONE_DISPLAY,
  STORE_SOCIAL_WHATSAPP,
} from "@/lib/config/site-config";
import { formatInstantForStoreDate } from "@/lib/datetime/display-timezone";
import {
  paymentMethodDescription,
  paymentMethodDescriptionSegments,
  paymentMethodLabel,
} from "@/lib/orders/payment-method";
import { formatProductPriceWithPrefix } from "@/lib/products/format-price";

type OrderConfirmationEmailItem = {
  productName: string;
  quantity: number;
  lineTotal: unknown;
};

export type OrderConfirmationEmailOrder = {
  id: string;
  createdAt: Date;
  paymentMethod: PaymentMethod;
  subtotal: unknown;
  discountAmount: unknown;
  voucherCode: string | null;
  voucherDiscountAmount: unknown;
  totalAmount: unknown;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingCountry: string | null;
  shippingPhone: string | null;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
  items: OrderConfirmationEmailItem[];
};

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const displayOrDash = (value: string | null | undefined): string => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "-";
};

const formatMoney = (value: unknown): string =>
  formatProductPriceWithPrefix(Number(value), SITE_PRODUCT_SLIDER.pricePrefix);

const buildOrderReceivedUrl = (orderId: string): string =>
  `${SITE_URL_ORIGIN}/order-received/${encodeURIComponent(orderId)}`;

/**
 * Sends the customer a receipt-style confirmation when checkout creates an order.
 */
export const sendOrderConfirmationEmail = async (
  order: OrderConfirmationEmailOrder,
): Promise<MailSendResult> => {
  const from =
    process.env.ORDER_PLACED_EMAIL_FROM?.trim() ||
    process.env.SIGNUP_OTP_EMAIL_FROM?.trim() ||
    process.env.PASSWORD_RESET_EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    "";

  const orderNumber = order.id.slice(-8).toUpperCase();
  const orderDate = formatInstantForStoreDate(order.createdAt);
  const displayName = [
    order.user.firstName?.trim(),
    order.user.lastName?.trim(),
  ]
    .filter((p): p is string => Boolean(p && p.length > 0))
    .join(" ")
    .trim();
  const safeDisplayName = escapeHtml(displayName || "Customer");
  const safeOrderNumber = escapeHtml(orderNumber);
  const paymentLabel = paymentMethodLabel(order.paymentMethod);
  const paymentBlurb = paymentMethodDescription(order.paymentMethod);
  const paymentBlurbSegments = paymentMethodDescriptionSegments(
    order.paymentMethod,
  );
  const paymentBlurbHtml =
    paymentBlurbSegments.kind === "bank_transfer"
      ? `${escapeHtml(paymentBlurbSegments.leadingText)}<strong>${escapeHtml(paymentBlurbSegments.emphasizedText)}</strong>${escapeHtml(paymentBlurbSegments.trailingText)}`
      : escapeHtml(paymentBlurb);
  const safeWhatsappNumber = escapeHtml(STORE_PHONE_DISPLAY);
  const safeWhatsappUrl = STORE_SOCIAL_WHATSAPP.replace(/&/g, "&amp;").replace(
    /"/g,
    "&quot;",
  );
  const orderUrl = buildOrderReceivedUrl(order.id)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");

  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-top:1px solid var(--email-card-border,#e5e7eb);color:var(--email-body-text,#111827);">
            ${escapeHtml(item.productName)} x ${item.quantity}
          </td>
          <td style="padding:12px 0;border-top:1px solid var(--email-card-border,#e5e7eb);text-align:right;font-weight:700;color:var(--email-body-text,#111827);">
            ${escapeHtml(formatMoney(item.lineTotal))}
          </td>
        </tr>
      `,
    )
    .join("");

  const voucherRow =
    Number(order.voucherDiscountAmount) > 0
      ? `
        <tr>
          <td style="padding:8px 0;color:var(--email-muted-text,#6b7280);">
            Voucher${order.voucherCode ? ` (${escapeHtml(order.voucherCode)})` : ""}
          </td>
          <td style="padding:8px 0;text-align:right;font-weight:700;color:#047857;">
            - ${escapeHtml(formatMoney(order.voucherDiscountAmount))}
          </td>
        </tr>
      `
      : "";

  const html = `
    <div style="margin:0;padding:24px;background:var(--email-surface-bg,#f5f5f5);font-family:Arial,'Segoe UI',sans-serif;color:var(--email-body-text,#111827);">
      <div style="max-width:680px;margin:0 auto;background:var(--email-card-bg,#ffffff);border:1px solid var(--email-card-border,#e5e7eb);border-radius:8px;padding:32px;">
        <div style="text-align:center;">
          <h1 style="margin:0 0 14px 0;font-size:32px;line-height:1.15;color:var(--email-brand-navy,#1e3a8a);font-weight:800;">Five Star Mobile</h1>
          <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:var(--email-body-text,#111827);">Thank you. Your order has been received.</p>
        </div>

        <div style="margin:20px 0;text-align:left;">
          <p style="margin:0 0 12px 0;font-size:16px;line-height:1.7;">Hello ${safeDisplayName},</p>
          <p style="margin:0;font-size:16px;line-height:1.7;">We have received your order <strong>#${safeOrderNumber}</strong> placed on ${escapeHtml(orderDate)}.</p>
        </div>

        <div style="margin:0 0 22px 0;border:1px solid var(--email-card-border,#e5e7eb);border-radius:8px;padding:16px;background:var(--email-code-bg,#f9fafb);">
          <p style="margin:0 0 8px 0;font-size:14px;color:var(--email-muted-text,#6b7280);">Payment method</p>
          <p style="margin:0 0 8px 0;font-size:16px;font-weight:700;color:var(--email-body-text,#111827);">${escapeHtml(paymentLabel)}</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:var(--email-muted-text,#6b7280);">${paymentBlurbHtml}</p>
        </div>

        <h2 style="margin:0 0 10px 0;font-size:22px;line-height:1.3;color:var(--email-body-text,#111827);">Order details</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tbody>
            ${itemRows}
            <tr>
              <td style="padding:12px 0;border-top:1px solid var(--email-card-border,#e5e7eb);font-weight:700;">Subtotal</td>
              <td style="padding:12px 0;border-top:1px solid var(--email-card-border,#e5e7eb);text-align:right;font-weight:700;">${escapeHtml(formatMoney(order.subtotal))}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:var(--email-muted-text,#6b7280);">Discount</td>
              <td style="padding:8px 0;text-align:right;font-weight:700;color:#047857;">- ${escapeHtml(formatMoney(order.discountAmount))}</td>
            </tr>
            ${voucherRow}
            <tr>
              <td style="padding:12px 0;border-top:1px solid var(--email-card-border,#e5e7eb);font-size:16px;font-weight:800;">Order total</td>
              <td style="padding:12px 0;border-top:1px solid var(--email-card-border,#e5e7eb);text-align:right;font-size:16px;font-weight:800;color:var(--email-brand-navy,#1e3a8a);">${escapeHtml(formatMoney(order.totalAmount))}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin:24px 0;border:1px solid var(--email-card-border,#e5e7eb);border-radius:8px;padding:16px;background:var(--email-code-bg,#f9fafb);">
          <h2 style="margin:0 0 10px 0;font-size:18px;line-height:1.3;color:var(--email-body-text,#111827);">Shipping details</h2>
          <p style="margin:0 0 4px 0;font-size:14px;line-height:1.6;">${escapeHtml(displayName || "Customer")}</p>
          <p style="margin:0 0 4px 0;font-size:14px;line-height:1.6;">${escapeHtml(displayOrDash(order.shippingAddress))}</p>
          <p style="margin:0 0 4px 0;font-size:14px;line-height:1.6;">${escapeHtml(displayOrDash(order.shippingCity))}, ${escapeHtml(displayOrDash(order.shippingCountry))}</p>
          <p style="margin:0 0 4px 0;font-size:14px;line-height:1.6;">${escapeHtml(displayOrDash(order.shippingPhone || order.user.phone))}</p>
          <p style="margin:0;font-size:14px;line-height:1.6;">${escapeHtml(order.user.email)}</p>
        </div>

        <div style="margin:0 auto 24px auto;text-align:center;">
          <a href="${orderUrl}" style="display:inline-block;border-radius:999px;background:var(--email-accent,#f59e0b);padding:12px 20px;font-size:15px;line-height:1.4;font-weight:700;color:#111827;text-decoration:none;">
            View order
          </a>
        </div>

        <hr style="border:0;border-top:1px solid var(--email-card-border,#e5e7eb);margin:0 0 20px 0;" />
        <p style="margin:0;text-align:left;font-size:14px;line-height:1.7;color:var(--email-muted-text,#6b7280);">
          If you have questions about this order, reply to this email or contact Five Star Mobile on WhatsApp at
          <a href="${safeWhatsappUrl}" style="color:var(--email-accent,#f59e0b);font-weight:700;text-decoration:underline;">${safeWhatsappNumber}</a>.
        </p>
      </div>
    </div>
  `;

  return sendTransactionalHtmlEmail({
    to: order.user.email,
    from,
    subject: `FSM Order Confirmation #${orderNumber}`,
    html,
    logTag: "sendOrderConfirmationEmail",
  });
};
