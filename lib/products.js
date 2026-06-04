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

const productImageRules = [
  ["chicken-leg-quarter", "chicken-leg-quarter.jpg"],
  ["chicken-breast-fillet", "chicken-breast-fillet.jpg"],
  ["chickengizzard", "chicken-gizzard.jpg"],
  ["vibra-whole-chicken", "whole-chicken-variant.jpg"],
  ["dressed-half-chicken", "half-chicken.jpg"],
  ["magnolia-whole-chicken", "whole-chicken.jpg"],
  ["dressed-whole-chicken", "whole-chicken.jpg"],
  ["whole-chicken", "whole-chicken.jpg"],
  ["chicken-liver", "chicken-liver.jpg"],
  ["chicken-gizzard", "chicken-gizzard.jpg"],
  ["half-chicken", "half-chicken.jpg"],
  ["pork-picnic-shoulder", "pork-laman.jpg"],
  ["pork-laman", "pork-laman.jpg"],
  ["pork-belly", "pork-liempo.jpg"],
  ["liempo", "pork-liempo.jpg"],
  ["pork-chop", "pork-chop.jpg"],
  ["pork-spareribs", "pork-spare-ribs.jpg"],
  ["pork-spare-ribs", "pork-spare-ribs.jpg"],
  ["riblets", "pork-riblets.jpg"],
  ["pork-liver", "pork-liver.jpg"],
  ["pork-jowls", "pork-jowl.jpg"],
  ["pork-jowl", "pork-jowl.jpg"],
  ["pork-ear", "pork-ear.jpg"],
  ["pork-mask", "pork-mask.jpg"],
  ["pork-hock-pata-whole-sliced", "pork-hock-combination.jpg"],
  ["pork-pata-front-whole", "pork-hock-whole.jpg"],
  ["pork-hock-whole", "pork-hock-whole.jpg"],
  ["pork-hock-slice", "pork-hock-slice.jpg"],
  ["pork-samgyeopsal", "pork-samgyeopsal.jpg"],
  ["samgyeopsal", "pork-samgyeopsal.jpg"],
  ["ground-pork", "ground-pork.jpg"],
  ["pork-flower-fat", "flower-fat.jpg"],
  ["flower-fat", "flower-fat.jpg"]
];

export function productImagePath(product, channel, prefix = "/images/products/") {
  if (channel === "wholesale") return "/images/parrilla logo.png";
  if (product?.imagePath && !product.imagePath.includes("parrilla logo.png")) {
    return product.imagePath;
  }
  if (!product?.channels?.some((item) => item === "retail" || item === "reseller")) {
    return "/images/parrilla logo.png";
  }

  const key = `${product?.id || ""} ${product?.name || ""}`.toLowerCase();
  const match = productImageRules.find(([needle]) => key.includes(needle));

  return match ? `${prefix}${match[1]}` : "/images/parrilla logo.png";
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
