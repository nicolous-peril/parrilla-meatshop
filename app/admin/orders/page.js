import { AdminOrdersClient } from "@/components/AdminOrdersClient";

export const metadata = {
  title: "Admin Orders | Parrilla Meat Shop"
};

export default function AdminOrdersPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="section-inner">
          <p className="eyebrow">Admin orders</p>
          <h1>Received orders</h1>
          <p>Review customer requests, line items, payment status, and processing status.</p>
        </div>
      </section>
      <AdminOrdersClient />
    </main>
  );
}
