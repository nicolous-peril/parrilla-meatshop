import { ProductGrid } from "@/components/ProductGrid";
import { getStoreProducts } from "@/lib/productRepository";

export const metadata = {
  title: "Reseller Meat Pricing | Parrilla Meat Shop"
};

export default async function ResellerPage() {
  const products = await getStoreProducts();

  return (
    <main>
      <section className="page-hero">
        <div className="section-inner">
          <p className="eyebrow">Reseller pricing</p>
          <h1>Discounted packs for repeat sellers</h1>
          <p>Reseller prices apply to selected retail items with a 5-pack minimum per item.</p>
        </div>
      </section>
      <section className="section">
        <div className="section-inner">
          <ProductGrid products={products} channel="reseller" showFilters />
        </div>
      </section>
    </main>
  );
}
