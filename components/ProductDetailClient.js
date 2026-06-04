"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { channelPrice, displayName, priceLabel, productImagePath } from "@/lib/products";

export function ProductDetailClient({ product, channel }) {
  const { addToCart } = useCart();
  const isWholesale = channel === "wholesale";
  const canAdd = product.stock !== "out-of-stock" && channelPrice(product, channel);

  return (
    <div className="section-inner info-grid">
      <div className="product-image">
        <img src={productImagePath(product, channel)} alt="" />
      </div>
      <div className="panel">
        <p className="eyebrow">
          {product.category}
          {product.subCategory ? ` / ${product.subCategory}` : ""}
        </p>
        <h1>{displayName(product)}</h1>
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
          </>
        )}
        <p>{product.description || ""}</p>
        <div className="product-actions">
          <button className="btn btn-primary" disabled={!canAdd} onClick={() => addToCart(product, channel)}>
            {product.stock === "out-of-stock" ? "Out of stock" : !canAdd ? "Ask price" : "Add to cart"}
          </button>
          <Link className="btn btn-secondary" href="/contact">
            Ask about bulk orders
          </Link>
        </div>
      </div>
    </div>
  );
}
