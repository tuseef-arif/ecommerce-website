/**
 * Uses generated output under `src/generated/prisma`. After editing
 * `prisma/schema.prisma`, run `npx prisma generate` and **restart** `npm run dev`
 * so Next.js drops its cached Prisma bundle (otherwise `select` on new fields can
 * throw “Unknown field” at runtime).
 *
 * In development, `globalThis.prisma` can survive Turbopack HMR across a
 * `prisma generate` that adds new models — the old client instance then lacks new
 * delegates (e.g. `prisma.discount`). We detect that and replace the singleton.
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

/** True when this client was generated with the Discount admin model. */
const prismaHasDiscountDelegate = (
  client: PrismaClient | undefined,
): boolean => {
  if (!client) return false;
  const delegate = (
    client as unknown as {
      discount?: { findMany?: (...args: unknown[]) => Promise<unknown> };
    }
  ).discount;
  return typeof delegate?.findMany === "function";
};

let productionClient: PrismaClient | undefined;

const createPrismaClient = (): PrismaClient => new PrismaClient({ adapter });

const getOrCreatePrisma = (): PrismaClient => {
  if (process.env.NODE_ENV === "production") {
    productionClient ??= createPrismaClient();
    return productionClient;
  }

  const existing = globalThis.prisma;
  if (existing && prismaHasDiscountDelegate(existing)) {
    return existing;
  }

  if (existing) {
    void existing.$disconnect().catch(() => {
      // best-effort: stale dev client after schema/client regenerate
    });
  }

  const created = createPrismaClient();
  globalThis.prisma = created;
  return created;
};

export const prisma = getOrCreatePrisma();
