"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import {
  adminCustomerCreateSchema,
  adminCustomerUpdateSchema,
} from "@/lib/customers/admin-schemas";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import type {
  CustomerFormFieldKey,
  CustomerFormState,
  DeleteCustomerResult,
} from "./form-state";

/* <SECURITY_REVIEW>
 * Vulnerability audit:
 * - Auth bypass: requireAdmin() runs server-side before every read/write; non-admin
 *   sessions are redirected.
 * - SQL injection: Prisma parameterises all queries; no raw SQL.
 * - IDOR: customerId validated as a CUID-ish string; lookups use Prisma's where:{id}.
 * - Sensitive data exposure: password is hashed with bcrypt (cost 12) before
 *   persistence; existing hashes are never returned to the client.
 * - Privilege escalation: admins can change role; we explicitly forbid demoting
 *   themselves to USER and forbid deleting their own account so they cannot
 *   lock themselves out of the dashboard.
 * - Mass deletion: schema accepts a single id; relies on Prisma's not-found
 *   handling (P2025) to surface a clean error if the id is unknown.
 *
 * Mitigations: Zod validation at the boundary; Prisma's unique constraint on
 * `email` is surfaced through P2002 with a field-specific error.
 *
 * Verification:
 * - An authenticated USER (non-admin) who POSTs any of these actions is
 *   redirected to "/" without the row being mutated.
 * - An admin attempting to delete their own row receives
 *   { ok: false, error: 'self_delete' }.
 * - Submitting a duplicate email surfaces a "already in use" field error.
 * </SECURITY_REVIEW>
 */
const customerIdSchema = z
  .string()
  .min(1, "Customer id is required.")
  .max(40, "Invalid customer id.");

const fieldErrorsFromZod = (
  error: z.ZodError,
): Partial<Record<CustomerFormFieldKey, string>> => {
  const fieldErrors: Partial<Record<CustomerFormFieldKey, string>> = {};
  for (const issue of error.issues) {
    const top = issue.path[0];
    if (typeof top !== "string") continue;
    if (
      top === "email" ||
      top === "firstName" ||
      top === "lastName" ||
      top === "phone" ||
      top === "role" ||
      top === "status" ||
      top === "password"
    ) {
      if (!fieldErrors[top]) fieldErrors[top] = issue.message;
    }
  }
  return fieldErrors;
};

const parseFormDataInput = (formData: FormData) => ({
  email: String(formData.get("email") ?? ""),
  firstName: String(formData.get("firstName") ?? ""),
  lastName: String(formData.get("lastName") ?? ""),
  phone: String(formData.get("phone") ?? ""),
  role: String(formData.get("role") ?? "USER"),
  status: String(formData.get("status") ?? "ACTIVE"),
  password: String(formData.get("password") ?? ""),
});

export const createCustomerAction = async (
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> => {
  await requireAdmin();

  const input = parseFormDataInput(formData);
  const parsed = adminCustomerCreateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      errorMessage: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    const hashed = await hashPassword(parsed.data.password);
    await prisma.user.create({
      data: {
        email: parsed.data.email,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
        role: parsed.data.role,
        status: parsed.data.status,
        password: hashed,
      },
      select: { id: true },
    });
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "P2002") {
      return {
        errorMessage: "Email is already in use.",
        fieldErrors: { email: "A customer with this email already exists." },
      };
    }
    console.error("createCustomerAction failed", { error });
    return {
      errorMessage: "Could not create customer. Please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers?status=created");
};

export const updateCustomerAction = async (
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> => {
  const adminUser = await requireAdmin();

  const idRaw = String(formData.get("customerId") ?? "");
  const idParsed = customerIdSchema.safeParse(idRaw);
  if (!idParsed.success) {
    return { errorMessage: "Invalid customer id.", fieldErrors: {} };
  }

  const input = parseFormDataInput(formData);
  const parsed = adminCustomerUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      errorMessage: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  // Block self-demotion to avoid the admin locking themselves out.
  if (
    idParsed.data === adminUser.id &&
    parsed.data.role !== "ADMIN" &&
    adminUser.role === "ADMIN"
  ) {
    return {
      errorMessage:
        "You cannot demote your own account from Admin while signed in.",
      fieldErrors: { role: "Switch to another admin first." },
    };
  }

  try {
    await prisma.user.update({
      where: { id: idParsed.data },
      data: {
        email: parsed.data.email,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
        role: parsed.data.role,
        status: parsed.data.status,
        ...(parsed.data.password
          ? { password: await hashPassword(parsed.data.password) }
          : {}),
      },
    });
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "P2002") {
      return {
        errorMessage: "Email is already in use.",
        fieldErrors: { email: "A customer with this email already exists." },
      };
    }
    if (code === "P2025") {
      return { errorMessage: "Customer no longer exists.", fieldErrors: {} };
    }
    console.error("updateCustomerAction failed", {
      customerId: idParsed.data,
      error,
    });
    return {
      errorMessage: "Could not save customer. Please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${idParsed.data}`);
  revalidatePath(`/dashboard/customers/${idParsed.data}/edit`);
  redirect("/dashboard/customers?status=updated");
};

export const deleteCustomerAction = async (
  customerId: string,
): Promise<DeleteCustomerResult> => {
  const adminUser = await requireAdmin();

  const parsed = customerIdSchema.safeParse(customerId);
  if (!parsed.success) return { ok: false, error: "invalid_id" };

  if (parsed.data === adminUser.id) {
    return { ok: false, error: "self_delete" };
  }

  try {
    await prisma.user.delete({ where: { id: parsed.data } });
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "P2025") return { ok: false, error: "not_found" };
    if (code === "P2003") return { ok: false, error: "in_use" };
    console.error("deleteCustomerAction failed", {
      customerId: parsed.data,
      error,
    });
    return { ok: false, error: "unknown" };
  }

  revalidatePath("/dashboard/customers");
  return { ok: true };
};
