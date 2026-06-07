import { AdminProductsClient } from "@/components/AdminProductsClient";

export const metadata = {
  title: "Admin Products | Parrilla Meat Shop"
};

export default function AdminProductsPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="section-inner">
          <p className="eyebrow">Admin products</p>
          <h1>Products management</h1>
          <p>Review the full catalogue, update product details, and add new products.</p>
        </div>
      </section>
      <AdminProductsClient />
    </main>
  );
}
