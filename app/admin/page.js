import Link from "next/link";

export const metadata = {
  title: "Admin | Parrilla Meat Shop"
};

export default function AdminPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="section-inner">
          <p className="eyebrow">Admin</p>
          <h1>Production admin is moving to Supabase</h1>
          <p>
            The old static-site admin password was visible in browser code. This route is reserved for
            secure Supabase Auth and database-backed catalog/order management.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="section-inner admin-dashboard">
          <Link className="admin-card" href="/admin/catalogue">
            <strong>Catalogue</strong>
            <span>Supabase-backed product management will be added here.</span>
          </Link>
          <Link className="admin-card" href="/admin/orders">
            <strong>Orders</strong>
            <span>Database-backed order processing will be added here.</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
