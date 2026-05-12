import { UserRole } from "@/generated/prisma/enums";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      /** Mirrors `User.status`; false when deactivated or JWT cleared. */
      isActive: boolean;
      name?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      profileImagePath?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    profileImagePath?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    email?: string;
    role?: UserRole;
    name?: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    profileImagePath?: string | null;
    /** Present when JWT was refreshed against DB and account is ACTIVE. */
    isActive?: boolean;
  }
}
