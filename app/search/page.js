import { ProductGrid } from "@/components/ProductGrid";
import { SearchForm } from "@/components/SearchForm";
import { getStoreProducts } from "@/lib/productRepository";

export const metadata = {
  title: "Search Products | Parrilla Meat Shop"
};

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || "";
  const products = await getStoreProducts();

  return (
    <main>
      <section className="page-hero">
        <div className="section-inner">
          <p className="eyebrow">Search</p>
          <h1>{query ? `Search results for "${query}"` : "Search the catalog"}</h1>
          <p>Find retail packs, reseller items, wholesale boxes, and promos.</p>
        </div>
      </section>
      <section className="section">
        <div className="section-inner">
          <SearchForm initialValue={query} />
          <ProductGrid products={products} channel="all" query={query} showFilters />
        </div>
      </section>
    </main>
  );
}
