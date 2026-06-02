import { ContactForm } from "@/components/ContactForm";

export const metadata = {
  title: "Contact | Parrilla Meat Shop"
};

export default function ContactPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="section-inner">
          <p className="eyebrow">Contact</p>
          <h1>Talk to Parrilla Meat Shop</h1>
          <p>Ask about delivery, pickup, wholesale availability, reseller pricing, and custom orders.</p>
        </div>
      </section>
      <section className="section">
        <div className="section-inner info-grid">
          <ContactForm />
          <aside className="panel">
            <h2>Store details</h2>
            <p>
              <strong>Address:</strong> 167 Virata St. Brgy. Pajo, Alfonso, Cavite
            </p>
            <p>
              <strong>Phone:</strong> 0976-2812267 / 0916-9894188
            </p>
            <p>
              <strong>Email:</strong> parrillameatshop@gmail.com
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
