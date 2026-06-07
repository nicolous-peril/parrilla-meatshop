"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CartSummary } from "@/components/CartSummary";
import { useCart } from "@/components/CartProvider";
import { displayName, peso, productImagePath } from "@/lib/products";

export function CartPageClient({ products }) {
  const { cart, removeItem, syncProducts, updateQuantity } = useCart();

  useEffect(() => {
    syncProducts(products);
  }, [products, syncProducts]);

  return (
    <section className="section">
      <div className="section-inner checkout-grid">
        <div className="cart-list">
          {cart.length ? (
            cart.map((item) => {
              const product = products.find((candidate) => candidate.id === item.productId);
              if (!product) return null;

              return (
                <div className="cart-row" key={item.key}>
                  <div className="cart-thumb">
                    <img src={productImagePath(product, item.channel)} alt="" />
                  </div>
                  <div>
                    <strong>{displayName(product)}</strong>
                    <p className="muted">
                      {item.channel}
                      {item.channel === "reseller" ? " / minimum 5 packs" : ""} /{" "}
                      {product.packaging || "pack"}
                    </p>
                  </div>
                  <div className="qty-control">
                    <button onClick={() => updateQuantity(item.key, -1)}>-</button>
                    <strong>{item.qty}</strong>
                    <button onClick={() => updateQuantity(item.key, 1)}>+</button>
                  </div>
                  <div className="price">
                    {item.channel === "wholesale" ? "Quote required" : peso.format(item.price * item.qty)}
                  </div>
                  <button className="icon-btn" title="Remove" onClick={() => removeItem(item.key)}>
                    x
                  </button>
                </div>
              );
            })
          ) : (
            <div className="empty-state">Your cart is empty.</div>
          )}
        </div>
        <aside className="panel">
          <h2>Order summary</h2>
          <CartSummary cart={cart} />
          <div className="checkout-actions">
            <Link className="btn btn-primary" href="/checkout">
              Checkout
            </Link>
            <Link className="btn btn-secondary" href="/retail">
              Keep shopping
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
