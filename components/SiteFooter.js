import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <strong>Parrilla Meat Shop</strong>
          <p>167 Virata St. Brgy. Pajo, Alfonso, Cavite</p>
        </div>
        <div className="footer-links">
          <strong>Shop</strong>
          <Link href="/retail">Retail</Link>
          <Link href="/wholesale">Wholesale</Link>
          <Link href="/reseller">Reseller</Link>
        </div>
        <div className="footer-links">
          <strong>Help</strong>
          <Link href="/cart">Cart</Link>
          <Link href="/checkout">Checkout</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div className="footer-links">
          <strong>Admin</strong>
          <Link href="/admin">Staff login</Link>
        </div>
        <div>
          <strong>Call us</strong>
          <p>
            0976-2812267
            <br />
            0916-9894188
          </p>
        </div>
      </div>
    </footer>
  );
}
