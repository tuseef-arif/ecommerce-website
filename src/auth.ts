import { getServerSession, type NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import { UserRole, UserStatus } from "@/generated/prisma/enums";
import { ensureUserForGoogleOAuth } from "@/lib/auth/google-oauth-user";
import { SITE_ROUTES } from "@/lib/config/site-config";
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
    status: UserStatus;
  },
) => {
  token.role = row.role;
  token.firstName = row.firstName;
  token.lastName = row.lastName;
  token.phone = row.phone;
  token.profileImagePath = row.profileImagePath;
  token.isActive = row.status !== UserStatus.INACTIVE;
  const full = [row.firstName, row.lastName]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s && s.length > 0))
    .join(" ");
  token.name = full.length > 0 ? full : undefined;
};

const stripAuthFromToken = (token: JWT): JWT => {
  delete token.sub;
  delete token.role;
  delete token.name;
  delete token.email;
  token.firstName = undefined;
  token.lastName = undefined;
  token.phone = undefined;
  token.profileImagePath = undefined;
  delete token.address;
  delete token.city;
  delete token.country;
  token.isActive = false;
  return token;
};

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: SITE_ROUTES.login,
    error: `${SITE_ROUTES.home}?authView=login`,
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            profile(profile) {
              const email =
                profile.email_verified && profile.email ? profile.email : "";
              const given = profile.given_name?.trim() ?? "";
              const family = profile.family_name?.trim() ?? "";
              let firstName: string | null = given || null;
              let lastName: string | null = family || null;
              if (!firstName && !lastName && profile.name?.trim()) {
                const parts = profile.name.trim().split(/\s+/);
                firstName = parts[0] ?? null;
                lastName =
                  parts.length > 1 ? parts.slice(1).join(" ") || null : null;
              }
              return {
                id: profile.sub,
                name: profile.name,
                role: UserRole.USER,
                email,
                image: profile.picture,
                firstName,
                lastName,
              };
            },
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

        if (user.status === UserStatus.INACTIVE) {
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
    signIn: async ({ user, account }) => {
      if (account?.provider === "credentials") return true;

      const email = user.email?.trim().toLowerCase();
      if (!email) return false;

      if (account?.provider === "google") {
        const ensured = await ensureUserForGoogleOAuth({
          email,
          firstName: user.firstName ?? null,
          lastName: user.lastName ?? null,
        });
        return ensured.ok;
      }

      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { status: true },
      });
      if (!dbUser) return false;
      if (dbUser.status === UserStatus.INACTIVE) return false;
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user?.email) {
        const dbUserByEmail = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            profileImagePath: true,
            status: true,
          },
        });

        if (dbUserByEmail) {
          if (dbUserByEmail.status === UserStatus.INACTIVE) {
            return stripAuthFromToken(token);
          }
          token.sub = dbUserByEmail.id;
          token.email = dbUserByEmail.email;
          applyProfileFieldsToToken(token, dbUserByEmail);
          if (!token.name) {
            token.name = user.name ?? undefined;
          }
          return token;
        }

        const dbUserById = user.id
          ? await prisma.user.findUnique({
              where: { id: user.id },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                profileImagePath: true,
                status: true,
              },
            })
          : null;

        if (dbUserById) {
          if (dbUserById.status === UserStatus.INACTIVE) {
            return stripAuthFromToken(token);
          }
          token.sub = dbUserById.id;
          token.email = dbUserById.email;
          applyProfileFieldsToToken(token, dbUserById);
          if (!token.name) {
            token.name = user.name ?? undefined;
          }
          return token;
        }

        token.sub = user.id;
        token.email =
          typeof user.email === "string" ? user.email.toLowerCase() : undefined;
        token.role = user.role;
        token.name = user.name ?? undefined;
        token.firstName = user.firstName ?? undefined;
        token.lastName = user.lastName ?? undefined;
        token.phone = user.phone ?? undefined;
        delete token.address;
        delete token.city;
        delete token.country;
        token.isActive = true;
        return token;
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            profileImagePath: true,
            status: true,
          },
        });

        if (dbUser?.status === UserStatus.INACTIVE) {
          return stripAuthFromToken(token);
        }

        if (dbUser) {
          token.email = dbUser.email;
          applyProfileFieldsToToken(token, dbUser);
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (!session.user) {
        return session;
      }

      const isSignedIn = Boolean(token.sub) && token.isActive !== false;

      if (!isSignedIn) {
        session.user.id = "";
        session.user.email = "";
        session.user.role = UserRole.USER;
        session.user.isActive = false;
        session.user.name = undefined;
        session.user.firstName = undefined;
        session.user.lastName = undefined;
        session.user.phone = undefined;
        session.user.profileImagePath = undefined;
        return session;
      }

      session.user.id = token.sub as string;

      const role = token.role;
      session.user.role =
        role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.USER;

      session.user.isActive = true;

      session.user.email =
        typeof token.email === "string"
          ? token.email
          : (session.user.email ?? "");

      if (token.name != null) {
        session.user.name = token.name as string;
      }

      session.user.firstName = token.firstName ?? null;
      session.user.lastName = token.lastName ?? null;
      session.user.phone = token.phone ?? null;
      session.user.profileImagePath = token.profileImagePath ?? null;

      return session;
    },
  },
};

export const auth = async () => getServerSession(authOptions);
