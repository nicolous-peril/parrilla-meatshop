import { CheckoutPageClient } from "@/components/CheckoutPageClient";
import { getStoreProducts } from "@/lib/productRepository";

export const metadata = {
  title: "Checkout | Parrilla Meat Shop"
};

export default async function CheckoutPage() {
  const products = await getStoreProducts();

  return (
    <main>
      <section className="page-hero">
        <div className="section-inner">
          <p className="eyebrow">Checkout</p>
          <h1>Submit order request</h1>
          <p>
            Wholesale box items are handled as quote requests. Parrilla Meat Shop confirms actual box
            weight, availability, and final price before payment.
          </p>
        </div>
      </section>
      <CheckoutPageClient products={products} />
    </main>
  );
}
