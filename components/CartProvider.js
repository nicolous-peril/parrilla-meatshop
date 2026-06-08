"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { channelPrice, minQtyFor } from "@/lib/products";

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
        const key = cartKey(product.id, channel, selectedWeight?.id || "");
        const existing = current.find((item) => item.key === key);
        if (existing) {
          const next = current.map((item) =>
            item.key === key ? { ...item, qty: item.qty + 1 } : item
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
            qty: minQtyFor(channel, product),
            price: selectedWeight?.price ?? channelPrice(product, channel),
            sku: product.sku || "",
            configuration: product.configuration || "",
            selectedWeightId: selectedWeight?.id || "",
            selectedWeight: selectedWeight?.label || "",
            moq: minQtyFor(channel, product),
            moqUnit: product.moqUnit || product.packaging || "item",
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
          if (item.channel !== "reseller" && step < 0 && item.qty <= minQty) return [];
          return { ...item, qty: Math.max(minQty, item.qty + step) };
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
          const { brand: _legacyBrand, ...storedItem } = item;
          return {
            ...storedItem,
            price: selectedWeight?.price ?? channelPrice(product, item.channel),
            sku: product.sku || item.sku || "",
            configuration: product.configuration || "",
            selectedWeightId: selectedWeight?.id || "",
            selectedWeight: selectedWeight?.label || "",
            moq: minQtyFor(item.channel, product),
            moqUnit: product.moqUnit || product.packaging || "item",
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
