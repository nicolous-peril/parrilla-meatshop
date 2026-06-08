"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { channelPrice, formatWeightLabel, minQtyFor } from "@/lib/products";

const CART_KEY = "parrilla.cart";
const CartContext = createContext(null);

function readCart() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeCart(cart) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
}

function cartKey(productId, channel, selectedWeightId = "") {
  return `${productId}:${channel}:${selectedWeightId}`;
}

function availableQty(product, selectedWeight = null) {
  if (!product) return 0;
  if (selectedWeight) return Number(selectedWeight.onHandQty || selectedWeight.on_hand_qty || 0);
  return Number(product.onHandQty || product.on_hand_qty || 0);
}

function isPurchasable(product, selectedWeight = null) {
  if (!product) return false;
  const hasWeights = Array.isArray(product.weightOptions) && product.weightOptions.length > 0;
  if (product.productStatus === "inactive" || product.active === false) return false;
  if (product.stock === "out-of-stock") return false;
  if (hasWeights && !selectedWeight) return false;
  if (selectedWeight && selectedWeight.status !== "available") return false;
  return availableQty(product, selectedWeight) > 0;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(readCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && typeof window !== "undefined") {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  const value = useMemo(() => {
    function addToCart(product, channel = "retail", selection = {}) {
      if (!product) return;

      setCart((current) => {
        const selectedWeight = selection.selectedWeight || null;
        const maxQty = availableQty(product, selectedWeight);
        const minQty = minQtyFor(channel, product);
        if (!isPurchasable(product, selectedWeight) || maxQty < minQty) return current;
        const key = cartKey(product.id, channel, selectedWeight?.id || "");
        const existing = current.find((item) => item.key === key);
        if (existing) {
          if (existing.qty >= maxQty) return current;
          const next = current.map((item) =>
            item.key === key ? { ...item, qty: Math.min(maxQty, item.qty + 1), availableQty: maxQty } : item
          );
          writeCart(next);
          return next;
        }

        const next = [
          ...current,
          {
            key,
            productId: product.id,
            channel,
            qty: minQty,
            price: selectedWeight?.price ?? channelPrice(product, channel),
            sku: product.sku || "",
            configuration: product.configuration || "",
            selectedWeightId: selectedWeight?.id || "",
            selectedWeight: selectedWeight ? formatWeightLabel(selectedWeight) : "",
            moq: minQty,
            moqUnit: product.moqUnit || product.packaging || "item",
            availableQty: maxQty,
            notes: product.notes || ""
          }
        ];
        writeCart(next);
        return next;
      });
    }

    function updateQuantity(key, step) {
      setCart((current) => {
        const next = current.flatMap((item) => {
          if (item.key !== key) return item;
          const minQty = Number(item.moq || minQtyFor(item.channel));
          const maxQty = Number(item.availableQty || 0);
          if (maxQty <= 0) return [];
          if (step < 0 && item.qty <= minQty) return [];
          return { ...item, qty: Math.min(maxQty, Math.max(minQty, item.qty + step)) };
        });
        writeCart(next);
        return next;
      });
    }

    function removeItem(key) {
      setCart((current) => {
        const next = current.filter((item) => item.key !== key);
        writeCart(next);
        return next;
      });
    }

    function clearCart() {
      writeCart([]);
      setCart([]);
    }

    function syncProducts(products) {
      setCart((current) => {
        const productById = new Map(products.map((product) => [product.id, product]));
        const next = current.flatMap((item) => {
          const product = productById.get(item.productId);
          if (!product || !product.channels.includes(item.channel)) return [];
          const selectedWeight = item.selectedWeightId
            ? product.weightOptions?.find((option) => option.id === item.selectedWeightId)
            : null;
          if (item.selectedWeightId && !selectedWeight) return [];
          const maxQty = availableQty(product, selectedWeight);
          const minQty = minQtyFor(item.channel, product);
          if (!isPurchasable(product, selectedWeight) || maxQty < minQty) return [];
          const { brand: _legacyBrand, ...storedItem } = item;
          return {
            ...storedItem,
            qty: Math.min(maxQty, Math.max(minQty, Number(item.qty || minQty))),
            price: selectedWeight?.price ?? channelPrice(product, item.channel),
            sku: product.sku || item.sku || "",
            configuration: product.configuration || "",
            selectedWeightId: selectedWeight?.id || "",
            selectedWeight: selectedWeight ? formatWeightLabel(selectedWeight) : "",
            moq: minQty,
            moqUnit: product.moqUnit || product.packaging || "item",
            availableQty: maxQty,
            notes: product.notes || ""
          };
        });

        if (JSON.stringify(next) === JSON.stringify(current)) return current;
        writeCart(next);
        return next;
      });
    }

    return {
      cart,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      syncProducts,
      count: cart.reduce((sum, item) => sum + item.qty, 0)
    };
  }, [cart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
