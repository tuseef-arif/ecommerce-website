import { UserRole } from "@/generated/prisma/enums";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      name?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
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
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    name?: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  }
}
