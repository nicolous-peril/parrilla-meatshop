"use client";

import { useState } from "react";
import { CartSummary } from "@/components/CartSummary";
import { useCart } from "@/components/CartProvider";
import { displayName, peso } from "@/lib/products";

function buildOrderMessage(cart, data, products) {
  const lines = cart
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return "";
      const amount = item.channel === "wholesale" ? "Quote required" : peso.format(item.price * item.qty);
      return `- ${displayName(product)} | ${item.channel} | Qty: ${item.qty} | ${product.packaging || "Pack"} | ${amount}`;
    })
    .filter(Boolean);

  return [
    "Parrilla Meat Shop Order Request",
    "",
    `Name: ${data.get("customerName") || ""}`,
    `Phone: ${data.get("customerPhone") || ""}`,
    `Email: ${data.get("customerEmail") || ""}`,
    `Fulfillment: ${data.get("fulfillment") || ""}`,
    "",
    "Items:",
    lines.join("\n") || "- No items",
    "",
    `Notes: ${data.get("orderNotes") || ""}`,
    "",
    "Please confirm availability, final pricing, and payment details."
  ].join("\n");
}

export function CheckoutPageClient({ products }) {
  const { cart, clearCart } = useCart();
  const [confirmation, setConfirmation] = useState("");
  const [mailto, setMailto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitOrder(event) {
    event.preventDefault();

    if (!cart.length) {
      setConfirmation("Your cart is empty. Add products before submitting an order request.");
      setMailto("");
      return;
    }

    const invalidResellerItem = cart.find((item) => item.channel === "reseller" && item.qty < 5);
    if (invalidResellerItem) {
      setConfirmation("Reseller orders require a minimum quantity of 5 per item.");
      setMailto("");
      return;
    }

    const data = new FormData(event.currentTarget);
    const subject = "Parrilla Meat Shop Order Request";
    const message = buildOrderMessage(cart, data, products);
    const form = event.currentTarget;
    setConfirmation("Saving order request...");
    setMailto("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerName: data.get("customerName") || "",
          customerPhone: data.get("customerPhone") || "",
          customerEmail: data.get("customerEmail") || "",
          fulfillment: data.get("fulfillment") || "Pickup",
          notes: data.get("orderNotes") || "",
          cart
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Order request could not be saved.");
      }

      setConfirmation(
        `Order request saved. Reference: ${result.orderNumber}. Staff will confirm availability, final price, delivery schedule, and payment details.`
      );
      clearCart();
      form.reset();
    } catch (error) {
      setConfirmation(
        `${error.message} Please send the prepared order to Parrilla Meat Shop so staff can still process it.`
      );
      setMailto(
        `mailto:parrillameatshop@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section">
      <div className="section-inner checkout-grid">
        <form className="panel form-grid" onSubmit={submitOrder}>
          <h2>Customer information</h2>
          <div className="form-grid two">
            <input className="field" name="customerName" required placeholder="Full name" />
            <input className="field" name="customerPhone" required placeholder="Phone number" />
          </div>
          <input className="field" name="customerEmail" placeholder="Email address" />
          <select className="select" name="fulfillment">
            <option>Pickup</option>
            <option>Delivery</option>
          </select>
          <textarea className="textarea" name="orderNotes" placeholder="Address, preferred date, and notes" />
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit order request"}
          </button>
          {confirmation ? (
            <div className="notice">
              {confirmation}
              {mailto ? (
                <div className="order-route-actions">
                  <a className="btn btn-secondary" href={mailto}>
                    Open email draft
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}
        </form>
        <aside className="panel">
          <h2>Order summary</h2>
          <CartSummary cart={cart} />
          <p className="muted">
            Wholesale items will not show estimated totals. Staff will send the confirmed quote before payment.
          </p>
        </aside>
      </div>
    </section>
  );
}
