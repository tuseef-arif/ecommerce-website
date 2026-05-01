import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/auth";

type GuardOptions = {
  redirectTo?: string;
};

export const requireUser = async (
  options?: GuardOptions,
): Promise<{ id: string; email: string; role: UserRole }> => {
  const session = await auth();

  if (!session?.user) {
    redirect(options?.redirectTo ?? "/login");
  }

  return session.user;
};

export const requireAdmin = async (
  options?: GuardOptions,
): Promise<{ id: string; email: string; role: UserRole }> => {
  const user = await requireUser(options);

  if (user.role !== UserRole.ADMIN) {
    redirect("/");
  }

  return user;
};
