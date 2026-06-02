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

      <section className="section">
        <div className="section-inner">
          <div className="section-title">
            <div>
              <p className="eyebrow">Shop by need</p>
              <h2>Fresh supply for every customer</h2>
              <p>Choose packed retail items, box pricing for bulk buyers, or reseller pricing for repeat orders.</p>
            </div>
          </div>
          <div className="category-grid">
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
            <Link className="category-tile" href="/contact">
              <strong>Custom Orders</strong>
              <span>Ask for availability, delivery, and special bulk requirements.</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-inner">
          <div className="section-title">
            <div>
              <p className="eyebrow">Featured retail products</p>
              <h2>Steaks, samgyeopsal, and chicken cuts</h2>
            </div>
            <SearchForm />
          </div>
          <ProductGrid products={products} channel="retail" featuredGroup="homeRetailFeatured" />
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-title">
            <div>
              <p className="eyebrow">Featured wholesale products</p>
              <h2>Fast-moving box items</h2>
              <p>
                Popular wholesale products including chicken wings box, pork laman-style box supply,
                and beef laman-style box supply.
              </p>
            </div>
            <Link className="btn btn-secondary" href="/wholesale">
              View all wholesale
            </Link>
          </div>
          <ProductGrid products={products} channel="wholesale" featuredGroup="homeWholesaleFeatured" />
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-inner feature-grid">
          <div className="feature">
            <strong>Vacuum-packed quality</strong>
            <p>Retail packs are prepared for convenient storage and consistent freshness.</p>
          </div>
          <div className="feature">
            <strong>Bulk-ready boxes</strong>
            <p>Wholesale orders list brand, box weight, and per-kilo box pricing.</p>
          </div>
          <div className="feature">
            <strong>Production-ready foundation</strong>
            <p>The new app structure is ready for Supabase catalog, order, and admin integration.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
