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
  ["wholesale-chicken-leg-quarter", "wholesale-chicken-leg-quarter.jpg"],
  ["wholesale-chicken-thigh-quarter", "wholesale-chicken-thigh.jpg"],
  ["wholesale-chicken-breast-fillet", "wholesale-chicken-breast-fillet.jpg"],
  ["wholesale-chicken-wings-3-joints", "wholesale-chicken-wings-3-joints.jpg"],
  ["wholesale-chicken-fat", "wholesale-chicken-fat.jpg"],
  ["wholesale-whole-chicken-organic", "wholesale-whole-chicken-organic.jpg"],
  ["wholesale-pork-picnic-shoulder-kasim", "wholesale-pork-picnic-shoulder-kasim.jpg"],
  ["wholesale-pork-belly-biso", "wholesale-pork-belly-biso.jpg"],
  ["wholesale-porkloin-bisl", "wholesale-porkloin-bisl.jpg"],
  ["wholesale-pork-pata-front-whole", "wholesale-pork-pata-front-whole.jpg"],
  ["wholesale-pork-jowls-danish-crown", "wholesale-pork-jowls.jpg"],
  ["wholesale-pork-liver", "wholesale-pork-liver.jpg"],
  ["wholesale-pork-mask-w-out-snout-ear", "wholesale-pork-mask-without-snout-ear.jpg"],
  ["wholesale-pork-flower-fat-chicharong-bulaklak-ecofrigo", "wholesale-pork-flower-fat-10kg.jpg"],
  ["wholesale-pork-flower-fat-chicharong-bulaklak-famadesa", "wholesale-pork-flower-fat-20-25kg.jpg"],
  ["wholesale-beef-forequarter", "wholesale-beef-forequarter.jpg"],
  ["wholesale-french-fries", "wholesale-french-fries-box.jpg"],
  ["chicken-leg-quarter", "chicken-leg-quarter.jpg"],
  ["chicken-wings", "chicken-wings.jpg"],
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
  ["beef-samgyeopsal", "beef-samgyeopsal.jpg"],
  ["brazilian-ribeye-steak", "brazilian-ribeye-steak.jpg"],
  ["tomahawk-steak", "tomahawk-steak.jpg"],
  ["beef-laman-forequarter", "beef-laman-forequarter.jpg"],
  ["beef-shank-bulalo-cut", "beef-shank-bulalo-cut.jpg"],
  ["ground-beef-1-kg", "ground-beef-1kg.jpg"],
  ["ground-beef-500g", "ground-beef-500g.jpg"],
  ["pork-samgyeopsal", "pork-samgyeopsal.jpg"],
  ["ground-pork", "ground-pork.jpg"],
  ["pork-flower-fat", "flower-fat.jpg"],
  ["flower-fat", "flower-fat.jpg"],
  ["egg-tray-large", "egg-tray-large.jpg"],
  ["egg-piece", "egg-piece.jpg"],
  ["french-fries-1-kg", "french-fries-1kg.jpg"]
];

const packSizeOverrides = new Map([
  ["retail-chicken-leg-quarter-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-chicken-wings-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-chicken-breast-fillet-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-chicken-liver-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-chickengizzard-balunan-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-pork-laman-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-pork-liempo-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-pork-chop-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-pork-spare-ribs-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-pork-riblets-buto-buto-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-pork-liver-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-pork-jowl-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-pork-ear-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-pork-mask-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-pork-hock-pata-whole-sliced-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-flower-fat-chicharong-bulaklak-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-beef-laman-forequarter-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-beef-shank-bulalo-cut-pack-per-kg", "1 Kg (Approx.)"],
  ["retail-brazilian-ribeye-steak-pack", "Per Kg"],
  ["retail-tomahawk-steak-usda-choice-pack-per-kg", "Per Kg"]
]);

export function applyCatalogOverrides(product) {
  const packSize = packSizeOverrides.get(product?.id);
  if (!packSize) return product;

  return {
    ...product,
    packaging: packSize,
    packSize
  };
}

export function productImagePath(product, channel, prefix = "/images/products/") {
  const key = `${product?.id || ""} ${product?.name || ""}`.toLowerCase();
  const match = productImageRules.find(([needle]) => key.includes(needle));
  if (match) return `${prefix}${match[1]}`;

  if (product?.imagePath && !product.imagePath.includes("parrilla logo.png")) {
    return product.imagePath;
  }

  if (channel === "wholesale") {
    return "/images/parrilla logo.png";
  }
  if (!product?.channels?.some((item) => item === "retail" || item === "reseller")) {
    return "/images/parrilla logo.png";
  }

  return "/images/parrilla logo.png";
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
