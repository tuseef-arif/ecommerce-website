/**
 * Uses generated output under `src/generated/prisma`. After editing
 * `prisma/schema.prisma`, run `npx prisma generate`. In dev we invalidate the
 * global Prisma singleton when `schema.prisma` or generated `Order` model output
 * changes so Turbopack HMR does not keep a client whose runtime rejects new
 * `select` fields (e.g. `shippingAddress`).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize Prisma.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

declare global {
  var prisma: PrismaClient | undefined;
  /** Fingerprint of schema + generated Order model; dev singleton invalidation. */
  var prismaDevClientFingerprint: string | undefined;
}

/** Bumps when dev should drop `globalThis.prisma` (schema or generated client drift). */
const getDevPrismaClientFingerprint = (): string => {
  try {
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const orderModelPath = path.join(
      process.cwd(),
      "src",
      "generated",
      "prisma",
      "models",
      "Order.ts",
    );
    const h = createHash("sha256");
    h.update(readFileSync(schemaPath));
    try {
      h.update(readFileSync(orderModelPath));
    } catch {
      // generated path missing before first generate — still hash schema only
    }
    return h.digest("hex").slice(0, 32);
  } catch {
    return "";
  }
};

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

  const fingerprint = getDevPrismaClientFingerprint();
  const existing = globalThis.prisma;
  if (
    existing &&
    prismaHasDiscountDelegate(existing) &&
    fingerprint.length > 0 &&
    globalThis.prismaDevClientFingerprint === fingerprint
  ) {
    return existing;
  }

  if (existing) {
    void existing.$disconnect().catch(() => {
      // best-effort: stale dev client after schema/client regenerate
    });
  }

  const created = createPrismaClient();
  globalThis.prisma = created;
  if (fingerprint.length > 0) {
    globalThis.prismaDevClientFingerprint = fingerprint;
  }
  return created;
};

export const prisma = getOrCreatePrisma();
