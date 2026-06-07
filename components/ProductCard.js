"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import {
  displayName,
  optionSize,
  peso,
  priceLabel,
  productImagePath
} from "@/lib/products";

function bestOption(options) {
  return [...options].sort((left, right) => {
    if (left.defaultOption !== right.defaultOption) return left.defaultOption ? -1 : 1;
    if (left.brandPriority !== right.brandPriority) return left.brandPriority - right.brandPriority;
    return optionSize(right.configuration || right.packSize) - optionSize(left.configuration || left.packSize);
  })[0];
}

function availableWeights(product) {
  return (product.weightOptions || [])
    .filter((option) => option.status === "available")
    .sort((left, right) => (right.value || optionSize(right.label)) - (left.value || optionSize(left.label)));
}

export function ProductCard({ product, channel }) {
  const { addToCart, cart, updateQuantity } = useCart();
  const options = product.options?.length ? product.options : [product];
  const initial = bestOption(options);
  const [selectedId, setSelectedId] = useState(initial.id);
  const selectedProduct = options.find((option) => option.id === selectedId) || initial;
  const weights = availableWeights(selectedProduct);
  const [selectedWeightId, setSelectedWeightId] = useState(weights[0]?.id || "");
  const selectedWeight = weights.find((option) => option.id === selectedWeightId) || weights[0] || null;

  const brands = useMemo(
    () => [...new Set(options.map((option) => option.brand).filter(Boolean))],
    [options]
  );
  const brandOptions = selectedProduct.brand
    ? options.filter((option) => option.brand === selectedProduct.brand)
    : options.filter((option) => !option.brand);
  const configurations = [...new Set(
    brandOptions.map((option) => option.configuration || option.packSize).filter(Boolean)
  )];
  const item = cart.find((candidate) =>
    candidate.productId === selectedProduct.id &&
    candidate.selectedWeightId === (selectedWeight?.id || "")
  );
  const out =
    selectedProduct.stock === "out-of-stock" ||
    (selectedProduct.onHandQty <= 0 && selectedProduct.onHandQty !== 0) ||
    (selectedProduct.weightOptions?.length > 0 && !selectedWeight);
  const price = selectedWeight?.price ?? selectedProduct.price;
  const detailsHref = `/product/${selectedProduct.id}?channel=${channel}`;

  function chooseBrand(brand) {
    const next = bestOption(options.filter((option) => option.brand === brand));
    setSelectedId(next.id);
    setSelectedWeightId(availableWeights(next)[0]?.id || "");
  }

  function chooseConfiguration(configuration) {
    const next = bestOption(
      brandOptions.filter((option) => (option.configuration || option.packSize) === configuration)
    );
    setSelectedId(next.id);
    setSelectedWeightId(availableWeights(next)[0]?.id || "");
  }

  return (
    <article
      className="product-card"
      data-name={selectedProduct.name}
      data-category={selectedProduct.category}
      data-sub-category={selectedProduct.subCategory || ""}
    >
      <Link className="product-image" href={detailsHref} aria-label={`View details for ${displayName(selectedProduct)}`}>
        <img src={productImagePath(selectedProduct, channel)} alt={`${displayName(selectedProduct)} product`} />
      </Link>
      <div className="product-body">
        <h3>{displayName(selectedProduct)}</h3>
        <div className="price">
          {price ? peso.format(price) : priceLabel(selectedProduct, channel)}
          {channel === "wholesale" && !selectedWeight ? " / kg" : ""}
        </div>

        {brands.length > 1 ? (
          <label className="product-selector">
            <span>Brand</span>
            <select value={selectedProduct.brand} onChange={(event) => chooseBrand(event.target.value)}>
              {brands.map((brand) => <option key={brand}>{brand}</option>)}
            </select>
          </label>
        ) : selectedProduct.brand ? (
          <p className="product-meta"><strong>Brand:</strong> {selectedProduct.brand}</p>
        ) : null}

        {configurations.length > 1 ? (
          <label className="product-selector">
            <span>Configuration</span>
            <select
              value={selectedProduct.configuration || selectedProduct.packSize}
              onChange={(event) => chooseConfiguration(event.target.value)}
            >
              {configurations
                .sort((left, right) => optionSize(right) - optionSize(left))
                .map((configuration) => <option key={configuration}>{configuration}</option>)}
            </select>
          </label>
        ) : (
          <p className="product-meta">
            <strong>Pack Size:</strong> {selectedProduct.configuration || selectedProduct.packSize || selectedProduct.packaging || "Pack"}
          </p>
        )}

        {weights.length ? (
          <label className="product-selector">
            <span>Actual Weight</span>
            <select value={selectedWeight?.id || ""} onChange={(event) => setSelectedWeightId(event.target.value)}>
              {weights.map((weight) => (
                <option key={weight.id} value={weight.id}>{weight.label} - {peso.format(weight.price)}</option>
              ))}
            </select>
          </label>
        ) : null}

        <p className="product-meta"><strong>MOQ:</strong> {selectedProduct.moq} {selectedProduct.moqUnit}</p>
        {selectedProduct.notes ? <p className="product-notes">{selectedProduct.notes}</p> : null}
        {selectedProduct.promo && selectedProduct.stock !== "out-of-stock" ? (
          <p className="product-promo">{selectedProduct.promo}</p>
        ) : null}

        <div className="product-actions">
          {out || !price ? (
            <button className="btn btn-primary" disabled>{out ? "Out of stock" : "Ask price"}</button>
          ) : item ? (
            <div className="card-qty-control">
              <button type="button" onClick={() => updateQuantity(item.key, -1)} aria-label="Decrease quantity">-</button>
              <strong>{item.qty}</strong>
              <button type="button" onClick={() => updateQuantity(item.key, 1)} aria-label="Increase quantity">+</button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => addToCart(selectedProduct, channel, { selectedWeight })}
            >
              Add to cart
            </button>
          )}
          <Link className="btn btn-secondary" href={detailsHref}>Details</Link>
        </div>
      </div>
    </article>
  );
}
