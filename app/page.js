import Link from "next/link";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductGrid } from "@/components/ProductGrid";
import { SearchForm } from "@/components/SearchForm";
import { getStoreProducts } from "@/lib/productRepository";

export default async function HomePage() {
  const products = await getStoreProducts();

  return (
    <main>
      <HeroCarousel />

      <section className="section section-alt">
        <div className="section-inner">
          <div className="section-title">
            <div>
              <p className="eyebrow">Featured retail products</p>
            </div>
            <SearchForm className="nav-search section-search" compact />
          </div>
          <ProductGrid products={products} channel="retail" featuredGroup="featured" />
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-title">
            <div>
              <p className="eyebrow">Featured wholesale products</p>
            </div>
          </div>
          <ProductGrid products={products} channel="wholesale" featuredGroup="featured" />
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-inner">
          <div className="section-title">
            <div>
              <p className="eyebrow">Shop by need</p>
              <h2>Fresh supply for every customer</h2>
              <p>Choose packed retail items, box pricing for bulk buyers, or reseller pricing for repeat orders.</p>
            </div>
          </div>
          <div className="category-grid category-grid-three">
            <Link className="category-tile" href="/retail">
              <strong>Retail</strong>
              <span>Pre-cut and vacuum-packed meats, usually 500g or 1kg.</span>
            </Link>
            <Link className="category-tile" href="/wholesale">
              <strong>Wholesale</strong>
              <span>Box orders with slab meats and branded frozen supply.</span>
            </Link>
            <Link className="category-tile" href="/reseller">
              <strong>Reseller</strong>
              <span>Discounted pricing for 5 packs and above on most items.</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
