"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { displayName, priceLabel, productImagePath } from "@/lib/products";

export function ProductCard({ product, channel }) {
  const { addToCart, cart, updateQuantity } = useCart();
  const item = cart.find((candidate) => candidate.key === `${product.id}:${channel}`);
  const out = product.stock === "out-of-stock";
  const isWholesale = channel === "wholesale";
  const hasPrice = Boolean(product.resellerPrice || product.price);
  const productName = displayName(product);
  const detailsHref = `/product/${product.id}?channel=${channel}`;

  return (
    <article
      className="product-card"
      data-name={product.name}
      data-category={product.category}
      data-sub-category={product.subCategory || ""}
    >
      <Link
        className="product-image"
        href={detailsHref}
        aria-label={`View details for ${productName}`}
      >
        <img
          src={productImagePath(product, channel)}
          alt={`${productName} product`}
        />
      </Link>
      <div className="product-body">
        <h3>{productName}</h3>
        <div className="price">{priceLabel(product, channel)}</div>
        {isWholesale ? (
          <>
            {product.brand ? (
              <p className="product-meta">
                <strong>Brand Name:</strong> {product.brand}
              </p>
            ) : null}
            {product.kgPerBox ? (
              <p className="product-meta">
                <strong>Weight per box:</strong> {product.kgPerBox}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="product-meta">
              <strong>Pack Size:</strong> {product.packaging || product.packSize || "Pack"}
            </p>
            {product.slabPrice ? (
              <p className="product-meta">
                <strong>Slab Price:</strong> {priceLabel({ price: product.slabPrice }, "retail")} / kg
              </p>
            ) : null}
          </>
        )}
        {product.promo && product.stock !== "out-of-stock" ? (
          <p className="product-promo">{product.promo}</p>
        ) : null}
        <div className="product-actions">
          {out || !hasPrice ? (
            <button className="btn btn-primary" disabled>
              {out ? "Out of stock" : "Ask price"}
            </button>
          ) : item ? (
            <div className="card-qty-control">
              <button type="button" onClick={() => updateQuantity(item.key, -1)} aria-label="Decrease quantity">
                -
              </button>
              <strong>{item.qty}</strong>
              <button type="button" onClick={() => updateQuantity(item.key, 1)} aria-label="Increase quantity">
                +
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => addToCart(product, channel)}>
              Add to cart
            </button>
          )}
          <Link className="btn btn-secondary" href={detailsHref}>
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
