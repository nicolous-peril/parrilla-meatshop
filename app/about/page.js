export const metadata = {
  title: "About | Parrilla Meat Shop"
};

export default function AboutPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="section-inner">
          <p className="eyebrow">About us</p>
          <h1>Reliable meat supply from Alfonso, Cavite</h1>
          <p>
            Parrilla Meat Shop serves households, food businesses, wholesalers, and resellers with
            packed meats and frozen products.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="section-inner info-grid">
          <div className="panel">
            <h2>What we do</h2>
            <p>
              We make meat buying simple for everyday cooking, business supply, and reseller orders.
              Customers can choose from retail packs, wholesale boxes, and reseller-friendly products
              with clear pack sizes and pricing.
            </p>
            <p>
              Our goal is straightforward: dependable meat products, practical choices, and service
              that feels close to home.
            </p>
          </div>
          <div className="panel">
            <h2>Visit or call</h2>
            <p><strong>Address:</strong><br />167 Virata St. Brgy. Pajo, Alfonso, Cavite</p>
            <p><strong>Phones:</strong><br />0976-2812267<br />0916-9894188</p>
          </div>
        </div>
      </section>
      <section className="section section-alt">
        <div className="section-inner feature-grid">
          <div className="feature">
            <strong>Retail packs</strong>
            <p>Convenient packed cuts for household cooking.</p>
          </div>
          <div className="feature">
            <strong>Wholesale boxes</strong>
            <p>Box supply with brand and estimated weight details.</p>
          </div>
          <div className="feature">
            <strong>Reseller support</strong>
            <p>Discounted pricing for customers who order multiple packs.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
