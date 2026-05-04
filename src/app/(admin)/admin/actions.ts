"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

const updateGlobalSaleSchema = z.object({
  globalSaleEnabled: z.coerce.boolean(),
  globalSalePercent: z.coerce.number().min(0).max(90),
});

export const updateGlobalSaleAction = async (formData: FormData) => {
  await requireAdmin();

  const parsedData = updateGlobalSaleSchema.safeParse({
    globalSaleEnabled: formData.get("globalSaleEnabled") === "on",
    globalSalePercent: formData.get("globalSalePercent"),
  });

  if (!parsedData.success) {
    throw new Error("Invalid global sale payload.");
  }

  await prisma.globalSetting.upsert({
    where: { id: 1 },
    update: {
      globalSaleEnabled: parsedData.data.globalSaleEnabled,
      globalSalePercent: parsedData.data.globalSalePercent.toFixed(2),
    },
    create: {
      id: 1,
      globalSaleEnabled: parsedData.data.globalSaleEnabled,
      globalSalePercent: parsedData.data.globalSalePercent.toFixed(2),
    },
  });
};
