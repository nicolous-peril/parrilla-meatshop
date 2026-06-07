"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { displayName, optionSize, peso, productImagePath } from "@/lib/products";

function sortOptions(options) {
  return [...options].sort((left, right) => {
    if (left.defaultOption !== right.defaultOption) return left.defaultOption ? -1 : 1;
    if (left.brandPriority !== right.brandPriority) return left.brandPriority - right.brandPriority;
    return optionSize(right.configuration || right.packSize) - optionSize(left.configuration || left.packSize);
  });
}

function weightsFor(product) {
  return (product.weightOptions || [])
    .filter((weight) => weight.status === "available")
    .sort((left, right) => (right.value || optionSize(right.label)) - (left.value || optionSize(left.label)));
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

  const brands = useMemo(
    () => [...new Set(options.map((option) => option.brand).filter(Boolean))],
    [options]
  );
  const sameBrandOptions = selectedProduct.brand
    ? options.filter((option) => option.brand === selectedProduct.brand)
    : options.filter((option) => !option.brand);
  const configurations = [...new Set(
    sameBrandOptions.map((option) => option.configuration || option.packSize).filter(Boolean)
  )];
  const canAdd =
    selectedProduct.stock !== "out-of-stock" &&
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
        <p className="product-meta"><strong>SKU:</strong> {selectedProduct.sku || "Pending"}</p>

        {brands.length > 1 ? (
          <label className="product-selector">
            <span>Brand</span>
            <select
              value={selectedProduct.brand}
              onChange={(event) => selectProduct(sortOptions(options.filter((option) => option.brand === event.target.value))[0])}
            >
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
              onChange={(event) => selectProduct(
                sortOptions(sameBrandOptions.filter((option) =>
                  (option.configuration || option.packSize) === event.target.value
                ))[0]
              )}
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
                <option value={weight.id} key={weight.id}>{weight.label} - {peso.format(weight.price)}</option>
              ))}
            </select>
          </label>
        ) : null}

        <p className="product-meta"><strong>MOQ:</strong> {selectedProduct.moq} {selectedProduct.moqUnit}</p>
        <p>{selectedProduct.description || ""}</p>
        {selectedProduct.notes ? <p className="product-notes"><strong>Notes:</strong> {selectedProduct.notes}</p> : null}
        <div className="product-actions">
          <button
            className="btn btn-primary"
            disabled={!canAdd}
            onClick={() => addToCart(selectedProduct, channel, { selectedWeight })}
          >
            {selectedProduct.stock === "out-of-stock" ? "Out of stock" : !canAdd ? "Ask price" : "Add to cart"}
          </button>
          <Link className="btn btn-secondary" href="/contact">Ask about bulk orders</Link>
        </div>
      </div>
    </div>
  );
}
