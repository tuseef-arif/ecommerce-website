-- CreateTable
CREATE TABLE "HeroSlideProduct" (
    "slideId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeroSlideProduct_pkey" PRIMARY KEY ("slideId","productId")
);

-- CreateIndex
CREATE INDEX "HeroSlideProduct_slideId_position_idx" ON "HeroSlideProduct"("slideId", "position");

-- CreateIndex
CREATE INDEX "HeroSlideProduct_productId_idx" ON "HeroSlideProduct"("productId");

-- AddForeignKey
ALTER TABLE "HeroSlideProduct" ADD CONSTRAINT "HeroSlideProduct_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "HeroSlide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeroSlideProduct" ADD CONSTRAINT "HeroSlideProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
