"use client";

import { useMemo, useState } from "react";
import { categoriesFor, groupProductsForChannel, subCategoriesFor } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export function ProductGrid({
  products,
  channel = "retail",
  featuredGroup = "",
  query = "",
  showFilters = false
}) {
  const baseProducts = useMemo(() => {
    return groupProductsForChannel(products, channel).filter((product) => {
      const matchesFeatured = !featuredGroup || product.options.some((option) => Boolean(option[featuredGroup]));
      const haystack = `${product.name} ${product.category} ${product.subCategory || ""} ${product.description || ""}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      return matchesFeatured && matchesQuery;
    });
  }, [products, channel, featuredGroup, query]);

  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  const visibleProducts = baseProducts.filter((product) => {
    const matchesTerm = !term || product.name.toLowerCase().includes(term.toLowerCase());
    const matchesCategory = !category || product.category === category;
    const matchesSubCategory = !subCategory || product.subCategory === subCategory;
    return matchesTerm && matchesCategory && matchesSubCategory;
  });

  return (
    <>
      {showFilters ? (
        <div className="toolbar">
          <input
            className="field"
            type="search"
            placeholder="Filter visible results"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
          <select
            className="select"
            aria-label="Filter category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categoriesFor(baseProducts).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            className="select"
            aria-label="Filter sub-category"
            value={subCategory}
            onChange={(event) => setSubCategory(event.target.value)}
          >
            <option value="">All sub-categories</option>
            {subCategoriesFor(baseProducts).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="product-grid">
        {visibleProducts.length ? (
          visibleProducts.map((product) => (
            <ProductCard
              key={`${product.id}-${channel}`}
              product={product}
              channel={channel === "all" ? product.channels[0] : channel}
            />
          ))
        ) : (
          <div className="empty-state">No products found.</div>
        )}
      </div>
    </>
  );
}
