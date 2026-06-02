import { PARRILLA_DEFAULT_PRODUCTS } from "../src/data/products.js";

export const fallbackProducts = PARRILLA_DEFAULT_PRODUCTS;
export const products = fallbackProducts;

export const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0
});

export function titleCase(value) {
  const smallWords = new Set(["and", "or", "of", "with", "w", "out", "per"]);

  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (!word) return word;
      if (index > 0 && smallWords.has(word)) return word;
      return word
        .split(/([/&()-])/)
        .map((part) =>
          /^[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part
        )
        .join("");
    })
    .join(" ")
    .replace(/\bUsda\b/g, "USDA")
    .replace(/\bCdo\b/g, "CDO")
    .replace(/\bCj\b/g, "CJ")
    .replace(/\bO' Food\b/g, "O' Food");
}

export function displayName(product) {
  return titleCase(product?.name || "");
}

export function getProduct(items, id) {
  return items.find((product) => product.id === id);
}

export function channelPrice(product, channel) {
  if (channel === "reseller" && product.resellerPrice) return product.resellerPrice;
  return product.price;
}

export function priceLabel(product, channel) {
  const price = channelPrice(product, channel);
  if (!price) return "Contact for price";
  const suffix = channel === "wholesale" ? " / kg" : "";
  return `${peso.format(price)}${suffix}`;
}

export function minQtyFor(channel) {
  return channel === "reseller" ? 5 : 1;
}

export function productsForChannel(items, channel) {
  if (channel === "all") return items;
  return items.filter((product) => product.channels.includes(channel));
}

export function categoriesFor(items) {
  return [...new Set(items.map((product) => product.category))].sort();
}

export function subCategoriesFor(items) {
  return [...new Set(items.map((product) => product.subCategory).filter(Boolean))].sort();
}
