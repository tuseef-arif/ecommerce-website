import { getServerSession, type NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "./lib/password";

const applyProfileFieldsToToken = (
  token: JWT,
  row: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    role: UserRole;
    profileImagePath: string | null;
  },
) => {
  token.role = row.role;
  token.firstName = row.firstName;
  token.lastName = row.lastName;
  token.phone = row.phone;
  token.profileImagePath = row.profileImagePath;
  const full = [row.firstName, row.lastName]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s && s.length > 0))
    .join(" ");
  token.name = full.length > 0 ? full : undefined;
};

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsedCredentials.data.email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        const isValidPassword = await verifyPassword(
          parsedCredentials.data.password,
          user.password,
        );

        if (!isValidPassword) {
          return null;
        }

        const displayName = [user.firstName, user.lastName]
          .filter((part): part is string => Boolean(part?.trim()))
          .join(" ")
          .trim();

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: displayName.length > 0 ? displayName : undefined,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          profileImagePath: user.profileImagePath,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            profileImagePath: true,
          },
        });

        if (dbUser) {
          token.sub = dbUser.id;
          applyProfileFieldsToToken(token, dbUser);
          if (!token.name) {
            token.name = user.name ?? undefined;
          }
          return token;
        }

        token.sub = user.id;
        token.role = user.role;
        token.name = user.name ?? undefined;
        token.firstName = user.firstName ?? undefined;
        token.lastName = user.lastName ?? undefined;
        token.phone = user.phone ?? undefined;
        return token;
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            profileImagePath: true,
          },
        });
        if (dbUser) {
          applyProfileFieldsToToken(token, dbUser);
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      if (session.user && token.role) {
        session.user.role = token.role as "ADMIN" | "USER";
      }

      if (session.user && token.name != null) {
        session.user.name = token.name as string;
      }

      if (session.user) {
        session.user.firstName = token.firstName ?? null;
        session.user.lastName = token.lastName ?? null;
        session.user.phone = token.phone ?? null;
        session.user.profileImagePath = token.profileImagePath ?? null;
      }

      return session;
    },
  },
};

export const auth = async () => getServerSession(authOptions);
