import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/auth";

type GuardOptions = {
  redirectTo?: string;
};

/** Subset of session user fields needed after auth checks. */
export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
};

export const requireUser = async (
  options?: GuardOptions,
): Promise<AuthenticatedUser> => {
  const session = await auth();

  if (!session?.user?.id || session.user.isActive === false) {
    redirect(options?.redirectTo ?? "/login");
  }

  const u = session.user;
  const trimmedFirst = u.firstName?.trim();
  return {
    id: u.id,
    email: u.email ?? "",
    role: u.role,
    firstName: trimmedFirst && trimmedFirst.length > 0 ? trimmedFirst : null,
  };
};

export const requireAdmin = async (
  options?: GuardOptions,
): Promise<AuthenticatedUser> => {
  const user = await requireUser(options);

  if (user.role !== UserRole.ADMIN) {
    redirect("/");
  }

  return user;
};
