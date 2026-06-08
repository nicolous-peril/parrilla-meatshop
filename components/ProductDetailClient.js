"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { displayName, formatWeightLabel, optionSize, peso, productImagePath } from "@/lib/products";

function sortOptions(options) {
  return [...options].sort((left, right) => {
    if (left.defaultOption !== right.defaultOption) return left.defaultOption ? -1 : 1;
    return optionSize(right.configuration || right.packSize) - optionSize(left.configuration || left.packSize);
  });
}

function weightsFor(product) {
  return (product.weightOptions || [])
    .filter((weight) => weight.status === "available" && Number(weight.onHandQty || 0) > 0)
    .sort((left, right) => (right.value || optionSize(right.label)) - (left.value || optionSize(left.label)));
}

function availableQty(product, selectedWeight) {
  if (selectedWeight) return Number(selectedWeight.onHandQty || 0);
  return Number(product.onHandQty || 0);
}

export function ProductDetailClient({ product, channel }) {
  const { addToCart } = useCart();
  const options = product.options?.length ? product.options : [product];
  const [selectedId, setSelectedId] = useState(sortOptions(options)[0].id);
  const selectedProduct = options.find((option) => option.id === selectedId) || sortOptions(options)[0];
  const weights = weightsFor(selectedProduct);
  const [selectedWeightId, setSelectedWeightId] = useState(weights[0]?.id || "");
  const selectedWeight = weights.find((weight) => weight.id === selectedWeightId) || weights[0] || null;
  const price = selectedWeight?.price ?? selectedProduct.price;
  const selectedAvailableQty = availableQty(selectedProduct, selectedWeight);

  const configurations = [...new Set(
    options.map((option) => option.configuration || option.packSize).filter(Boolean)
  )];
  const canAdd =
    selectedProduct.productStatus !== "inactive" &&
    selectedProduct.stock !== "out-of-stock" &&
    selectedAvailableQty > 0 &&
    Boolean(price) &&
    (!selectedProduct.weightOptions?.length || Boolean(selectedWeight));

  function selectProduct(nextProduct) {
    setSelectedId(nextProduct.id);
    setSelectedWeightId(weightsFor(nextProduct)[0]?.id || "");
  }

  return (
    <div className="section-inner info-grid">
      <div className="product-image">
        <img src={productImagePath(selectedProduct, channel)} alt={`${displayName(selectedProduct)} product`} />
      </div>
      <div className="panel">
        <p className="eyebrow">
          {selectedProduct.category}
          {selectedProduct.subCategory ? ` / ${selectedProduct.subCategory}` : ""}
        </p>
        <h1>{displayName(selectedProduct)}</h1>
        <div className="price">
          {price ? peso.format(price) : "Contact for price"}
          {channel === "wholesale" && !selectedWeight ? " / kg" : ""}
        </div>
        {!canAdd ? <span className="product-stock-badge is-out">Out of Stock</span> : null}
        <p className="product-meta"><strong>Product ID:</strong> {selectedProduct.sku || "Pending"}</p>

        {!weights.length && configurations.length > 1 ? (
          <label className="product-selector">
            <span>Configuration</span>
            <select
              value={selectedProduct.configuration || selectedProduct.packSize}
              onChange={(event) => selectProduct(
                sortOptions(options.filter((option) =>
                  (option.configuration || option.packSize) === event.target.value
                ))[0]
              )}
            >
              {configurations
                .sort((left, right) => optionSize(right) - optionSize(left))
                .map((configuration) => <option key={configuration}>{configuration}</option>)}
            </select>
          </label>
        ) : !weights.length ? (
          <p className="product-meta">
            <strong>Pack Size:</strong> {selectedProduct.configuration || selectedProduct.packSize || selectedProduct.packaging || "Pack"}
          </p>
        ) : null}

        {weights.length ? (
          <label className="product-selector product-selector-inline">
            <span>Pack Size:</span>
            <select value={selectedWeight?.id || ""} onChange={(event) => setSelectedWeightId(event.target.value)}>
              {weights.map((weight) => (
                <option value={weight.id} key={weight.id}>{formatWeightLabel(weight)}</option>
              ))}
            </select>
          </label>
        ) : null}

        {selectedProduct.displayFields?.moq !== false ? <p className="product-meta"><strong>MOQ:</strong> {selectedProduct.moq} {selectedProduct.moqUnit}</p> : null}
        <p>{selectedProduct.description || ""}</p>
        {selectedProduct.displayFields?.notes !== false && selectedProduct.notes ? <p className="product-notes"><strong>Notes:</strong> {selectedProduct.notes}</p> : null}
        <div className="product-actions">
          <button
            className="btn btn-primary"
            disabled={!canAdd}
            onClick={() => addToCart(selectedProduct, channel, { selectedWeight })}
          >
            {!canAdd ? "Out of stock" : "Add to cart"}
          </button>
          <Link className="btn btn-secondary" href="/contact">Ask about bulk orders</Link>
        </div>
      </div>
    </div>
  );
}
