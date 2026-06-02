import { peso } from "@/lib/products";

export function CartSummary({ cart }) {
  const hasWholesale = cart.some((item) => item.channel === "wholesale");
  const subtotal = cart
    .filter((item) => item.channel !== "wholesale")
    .reduce((sum, item) => sum + item.price * item.qty, 0);

  if (hasWholesale) {
    return (
      <>
        {subtotal > 0 ? (
          <div className="summary-line">
            <span>Retail/Reseller subtotal</span>
            <strong>{peso.format(subtotal)}</strong>
          </div>
        ) : null}
        <div className="summary-line">
          <span>Wholesale items</span>
          <strong>Quote required</strong>
        </div>
        <div className="notice quote-notice">
          Wholesale box orders are submitted as a quote request. Parrilla Meat Shop will confirm actual
          box weight, availability, and final price before payment.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="summary-line">
        <span>Subtotal</span>
        <strong>{peso.format(subtotal)}</strong>
      </div>
      <div className="summary-line">
        <span>Delivery</span>
        <strong>To confirm</strong>
      </div>
      <div className="summary-line">
        <span>Total</span>
        <strong>{peso.format(subtotal)}</strong>
      </div>
    </>
  );
}
