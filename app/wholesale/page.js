import { ProductGrid } from "@/components/ProductGrid";
import { getStoreProducts } from "@/lib/productRepository";

export const metadata = {
  title: "Wholesale Meat Supply | Parrilla Meat Shop"
};

export default async function WholesalePage() {
  const products = await getStoreProducts();

  return (
    <main>
      <section className="page-hero">
        <div className="section-inner">
          <p className="eyebrow">Wholesale boxes</p>
          <h1>Box pricing for bulk meat supply</h1>
          <p>Items are sold per box with a minimum order of 1 box. Box weights vary by item and brand.</p>
        </div>
      </section>
      <section className="section">
        <div className="section-inner">
          <ProductGrid products={products} channel="wholesale" showFilters />
        </div>
      </section>
    </main>
  );
}
