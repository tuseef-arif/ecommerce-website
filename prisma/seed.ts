import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for seeding.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const main = async () => {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@mobileshop.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

  const passwordHash = await hashPassword(adminPassword);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      email: adminEmail,
      password: passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const categories = [
    { name: "Mobiles", slug: "mobiles" },
    { name: "Earbuds", slug: "earbuds" },
    { name: "Smart Watches", slug: "smart-watches" },
    { name: "Power Banks", slug: "power-banks" },
    { name: "Data Cables", slug: "data-cables" },
    { name: "Chargers", slug: "chargers" },
    { name: "Speakers", slug: "speakers" },
    { name: "Tablets", slug: "tablets" },
    { name: "Headphones", slug: "headphones" },
    { name: "Car Accessories", slug: "car-accessories" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  // Products are no longer seeded from this file — admins create them via
  // the `/dashboard/products` UI. Categories above are still seeded so the
  // dropdowns and storefront nav have something to link to on a fresh install.

  await prisma.globalSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      globalSaleEnabled: false,
      globalSalePercent: "0",
    },
  });

  console.log("Seed completed: admin user, categories, global settings.");
};

main()
  .catch((error) => {
    console.error("Seeding failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
