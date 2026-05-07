import { auth } from "@/auth";
import { CategorySlider } from "@/components/store/category-slider";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";
import { FeatureCardsStrip } from "@/components/ui/feature-cards-strip";

export default async function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <StoreHeader
        user={
          user
            ? {
                email: user.email,
                role: user.role,
                name: user.name ?? undefined,
                firstName: user.firstName ?? undefined,
                lastName: user.lastName ?? undefined,
                phone: user.phone ?? undefined,
                profileImagePath: user.profileImagePath ?? undefined,
              }
            : null
        }
      />
      <CategorySlider />
      {children}
      <FeatureCardsStrip />
      <StoreFooter />
    </div>
  );
}
