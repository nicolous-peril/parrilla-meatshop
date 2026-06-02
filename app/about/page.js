export const metadata = {
  title: "About | Parrilla Meat Shop"
};

export default function AboutPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="section-inner">
          <p className="eyebrow">About us</p>
          <h1>Fresh meat supply from Alfonso, Cavite</h1>
          <p>
            Parrilla Meat Shop serves retail customers, wholesale buyers, and resellers with packed
            meats, frozen goods, K-BBQ cuts, and bulk meat supply.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="section-inner info-grid">
          <div className="panel">
            <h2>Built for households and businesses</h2>
            <p>
              The shop supports daily meat needs, bulk stock requests, and reseller-friendly packs with
              clear pricing and order confirmation before payment.
            </p>
          </div>
          <div className="panel">
            <h2>What is changing online</h2>
            <p>
              This Next.js migration prepares the website for live catalog updates, secure admin access,
              order tracking, and future payment integration.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
