import { STORE_SHELL } from "@/lib/config/site-config";

export default function CartPage() {
  return (
    <main className={`flex-1 py-10 ${STORE_SHELL}`}>
      <h1 className="text-2xl font-semibold">Cart</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Your cart is empty — product checkout will appear here later.
      </p>
    </main>
  );
}
