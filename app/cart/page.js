import { CartPageClient } from "@/components/CartPageClient";
import { getStoreProducts } from "@/lib/productRepository";

export const metadata = {
  title: "Cart | Parrilla Meat Shop"
};

export default async function CartPage() {
  const products = await getStoreProducts();

  return (
    <main>
      <section className="page-hero">
        <div className="section-inner">
          <p className="eyebrow">Cart</p>
          <h1>Your selected products</h1>
          <p>Review quantities before submitting a pickup, delivery, or wholesale quote request.</p>
        </div>
      </section>
      <CartPageClient products={products} />
    </main>
  );
}
