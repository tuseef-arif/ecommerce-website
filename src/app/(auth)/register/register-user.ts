import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import type { RegisterAccountInput } from "@/lib/validation/register-account-schema";

export type CreateUserResult =
  | { ok: true }
  | { ok: false; error: "EMAIL_TAKEN" | "UNKNOWN" };

/**
 * Persists a new user from validated registration input (shared by page + popover flows).
 */
export const createRegisteredUser = async (
  data: RegisterAccountInput,
): Promise<CreateUserResult> => {
  const email = data.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { ok: false, error: "EMAIL_TAKEN" };
  }

  try {
    const hashedPassword = await hashPassword(data.password);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
};
