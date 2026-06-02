import { ProductGrid } from "@/components/ProductGrid";
import { getStoreProducts } from "@/lib/productRepository";

export const metadata = {
  title: "Retail Meat Packs | Parrilla Meat Shop"
};

export default async function RetailPage() {
  const products = await getStoreProducts();

  return (
    <main>
      <section className="page-hero">
        <div className="section-inner">
          <p className="eyebrow">Retail packs</p>
          <h1>Shop packed meat cuts</h1>
          <p>Retail items are sold by pack or per kilogram depending on the cut.</p>
        </div>
      </section>
      <section className="section">
        <div className="section-inner">
          <ProductGrid products={products} channel="retail" showFilters />
        </div>
      </section>
    </main>
  );
}
