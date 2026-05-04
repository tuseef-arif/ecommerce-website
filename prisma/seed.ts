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
    { name: "Mobiles", slug: "smartphones" },
    { name: "Accessories", slug: "accessories" },
    { name: "Wearables", slug: "wearables" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  const categoryMap = new Map(
    (
      await prisma.category.findMany({
        where: { slug: { in: categories.map((category) => category.slug) } },
        select: { id: true, slug: true },
      })
    ).map((category) => [category.slug, category.id]),
  );

  const products = [
    {
      name: "Nova X1",
      slug: "nova-x1",
      brand: "Nova",
      model: "X1",
      description: "Mid-range 5G smartphone with AMOLED display.",
      price: "699.00",
      stock: 30,
      categorySlug: "smartphones",
      specs: { ram: "8GB", storage: "256GB", battery: "4800mAh" },
    },
    {
      name: "Nova Buds Pro",
      slug: "nova-buds-pro",
      brand: "Nova",
      model: "Buds Pro",
      description: "Wireless ANC earbuds with fast charging case.",
      price: "129.00",
      stock: 80,
      categorySlug: "accessories",
      specs: { batteryLife: "28h", noiseCancellation: true },
    },
    {
      name: "Pulse Watch 2",
      slug: "pulse-watch-2",
      brand: "Pulse",
      model: "Watch 2",
      description: "Fitness smartwatch with heart-rate and GPS tracking.",
      price: "249.00",
      stock: 45,
      categorySlug: "wearables",
      specs: { display: "1.43in OLED", waterResistance: "5ATM" },
    },
  ];

  for (const product of products) {
    const categoryId = categoryMap.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Missing category for slug: ${product.categorySlug}`);
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        brand: product.brand,
        model: product.model,
        description: product.description,
        price: product.price,
        stock: product.stock,
        specs: product.specs,
        categoryId,
      },
      create: {
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        model: product.model,
        description: product.description,
        price: product.price,
        stock: product.stock,
        specs: product.specs,
        categoryId,
      },
    });
  }

  await prisma.globalSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      globalSaleEnabled: false,
      globalSalePercent: "0",
    },
  });

  console.log(
    "Seed completed: admin user, categories, products, global settings.",
  );
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
