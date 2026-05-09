import { z } from "zod";
import type { DiscountTypeValue } from "@/lib/discounts/constants";
import { storeCalendarDayAnchorInstant } from "@/lib/datetime/display-timezone";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const trimmed = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim());

const parseOptionalDate = (raw: string): Date | null => {
  const t = raw.trim();
  if (t.length === 0) return null;
  if (!ISO_DATE_RE.test(t)) return null;
  const d = storeCalendarDayAnchorInstant(t);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const optionalMoneyInput = z
  .string()
  .max(24)
  .transform((value) => value.trim())
  .transform((value) => (value.length === 0 ? "" : value.replace(/,/g, "")));

const requiredMoneyInput = z
  .string()
  .max(24)
  .transform((value) => value.trim())
  .transform((value) => value.replace(/,/g, ""));

/**
 * Boundary schema for admin create/edit discount forms.
 * Inputs come from FormData as strings; outputs are Prisma-ready values.
 */
export const adminDiscountFormSchema = z
  .object({
    name: trimmed(200).pipe(z.string().min(1, "Discount name is required.")),
    code: trimmed(40).pipe(z.string().min(1, "Discount code is required.")),
    discountType: z.enum(["FIXED", "PERCENTAGE"]),
    discountValue: requiredMoneyInput,
    minOrderAmount: optionalMoneyInput,
    maxDiscountAmount: optionalMoneyInput,
    startDate: trimmed(12),
    endDate: trimmed(12),
    isActive: z
      .string()
      .optional()
      .transform((value) => value === "on" || value === "true"),
  })
  .superRefine((data, ctx) => {
    const codeNorm = data.code.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(codeNorm)) {
      ctx.addIssue({
        code: "custom",
        path: ["code"],
        message:
          "Use letters, numbers, hyphens, or underscores (must start with a letter or number).",
      });
    }

    if (!/^\d+(\.\d{1,2})?$/.test(data.discountValue)) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Enter a number with up to 2 decimal places.",
      });
      return;
    }
    const valueNum = Number.parseFloat(data.discountValue);
    if (data.discountType === "FIXED") {
      if (!(valueNum > 0)) {
        ctx.addIssue({
          code: "custom",
          path: ["discountValue"],
          message: "Fixed discount must be greater than 0.",
        });
      }
      if (valueNum > 1_000_000) {
        ctx.addIssue({
          code: "custom",
          path: ["discountValue"],
          message: "Amount is too large.",
        });
      }
    } else {
      if (valueNum < 1 || valueNum > 100) {
        ctx.addIssue({
          code: "custom",
          path: ["discountValue"],
          message: "Percentage must be between 1 and 100.",
        });
      }
    }

    const parseOptionalMoney = (
      raw: string,
      path: "minOrderAmount" | "maxDiscountAmount",
    ) => {
      if (raw.length === 0) return null;
      if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
        ctx.addIssue({
          code: "custom",
          path: [path],
          message: "Enter a number with up to 2 decimal places.",
        });
        return Number.NaN;
      }
      return Number.parseFloat(raw);
    };

    const minOrder = parseOptionalMoney(data.minOrderAmount, "minOrderAmount");
    if (minOrder !== null && Number.isFinite(minOrder)) {
      if (minOrder < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["minOrderAmount"],
          message: "Minimum order amount cannot be negative.",
        });
      }
      if (minOrder > 1_000_000) {
        ctx.addIssue({
          code: "custom",
          path: ["minOrderAmount"],
          message: "Amount is too large.",
        });
      }
    }

    const maxDisc = parseOptionalMoney(
      data.maxDiscountAmount,
      "maxDiscountAmount",
    );
    if (maxDisc !== null && Number.isFinite(maxDisc)) {
      if (!(maxDisc > 0)) {
        ctx.addIssue({
          code: "custom",
          path: ["maxDiscountAmount"],
          message: "When set, maximum discount must be greater than 0.",
        });
      }
      if (maxDisc > 1_000_000) {
        ctx.addIssue({
          code: "custom",
          path: ["maxDiscountAmount"],
          message: "Amount is too large.",
        });
      }
    }

    const startRaw = data.startDate.trim();
    const endRaw = data.endDate.trim();
    if (startRaw.length > 0 && !ISO_DATE_RE.test(startRaw)) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Use a valid start date.",
      });
    }
    if (endRaw.length > 0 && !ISO_DATE_RE.test(endRaw)) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Use a valid end date.",
      });
    }
    if (
      ISO_DATE_RE.test(startRaw) &&
      ISO_DATE_RE.test(endRaw) &&
      endRaw < startRaw
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date cannot be before start date.",
      });
    }
  })
  .transform((data) => {
    const discountValue = Number.parseFloat(data.discountValue);
    const minRaw = data.minOrderAmount.trim();
    const maxRaw = data.maxDiscountAmount.trim();
    const minOrderAmount =
      minRaw.length === 0 ? null : Number.parseFloat(minRaw.replace(/,/g, ""));
    const maxDiscountAmount =
      maxRaw.length === 0 ? null : Number.parseFloat(maxRaw.replace(/,/g, ""));

    return {
      name: data.name,
      code: data.code.toUpperCase(),
      discountType: data.discountType as DiscountTypeValue,
      discountValue,
      minOrderAmount:
        minOrderAmount !== null && Number.isFinite(minOrderAmount)
          ? minOrderAmount
          : null,
      maxDiscountAmount:
        maxDiscountAmount !== null && Number.isFinite(maxDiscountAmount)
          ? maxDiscountAmount
          : null,
      startAt: parseOptionalDate(data.startDate),
      endAt: parseOptionalDate(data.endDate),
      isActive: data.isActive,
    };
  });

export type AdminDiscountFormParsed = z.infer<typeof adminDiscountFormSchema>;
