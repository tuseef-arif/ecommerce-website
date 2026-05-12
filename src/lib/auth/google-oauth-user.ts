import { randomUUID } from "node:crypto";
import { UserRole, UserStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

/* <SECURITY_REVIEW>
 * Trust boundary: Google OAuth callback — email and names come from the IdP
 * after Google has verified the account; we only persist when `email` is
 * present (caller must pass a verified address, same as existing Google profile
 * mapping).
 *
 * Vulnerability audit:
 * - SQL injection: Prisma only (parameterised).
 * - Auth bypass: This helper only runs from NextAuth `signIn` for provider
 *   `google`; it does not issue sessions by itself.
 * - Account takeover: Uses normalized email as unique key; concurrent creates
 *   handled via P2002 + re-read.
 * - Privilege escalation: New rows are always `role: USER`, `status: ACTIVE`.
 *
 * Mitigations: Fail closed on INACTIVE existing rows; random bcrypt password
 * so credentials provider cannot guess OAuth-only accounts.
 *
 * Verification: First Google login for a new email creates one `User` row;
 * second login finds existing row; INACTIVE email still returns `inactive`.
 * </SECURITY_REVIEW>
 */

export type EnsureGoogleOAuthUserInput = {
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type EnsureGoogleOAuthUserResult =
  | { ok: true }
  | { ok: false; reason: "inactive" | "create_failed" };

export const ensureUserForGoogleOAuth = async (
  input: EnsureGoogleOAuthUserInput,
): Promise<EnsureGoogleOAuthUserResult> => {
  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName?.trim() || null;
  const lastName = input.lastName?.trim() || null;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { status: true },
  });

  if (existing) {
    if (existing.status === UserStatus.INACTIVE) {
      return { ok: false, reason: "inactive" };
    }
    return { ok: true };
  }

  const passwordHash = await hashPassword(randomUUID());

  try {
    await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        firstName,
        lastName,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        autoCreated: false,
      },
    });
    return { ok: true };
  } catch (err) {
    const code = (err as { code?: string } | undefined)?.code;
    if (code === "P2002") {
      const again = await prisma.user.findUnique({
        where: { email },
        select: { status: true },
      });
      if (again?.status === UserStatus.ACTIVE) {
        return { ok: true };
      }
      if (again?.status === UserStatus.INACTIVE) {
        return { ok: false, reason: "inactive" };
      }
    }
    console.error("[ensureUserForGoogleOAuth] user create failed", err);
    return { ok: false, reason: "create_failed" };
  }
};
