/**
 * Uses generated output under `src/generated/prisma`. After editing
 * `prisma/schema.prisma`, run `npx prisma generate` and **restart** `npm run dev`
 * so Next.js drops its cached Prisma bundle (otherwise `select` on new fields can
 * throw “Unknown field” at runtime).
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize Prisma.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
