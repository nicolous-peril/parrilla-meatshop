export const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0
});

const DISPLAY_SETTINGS_PREFIX = "__PARRILLA_DISPLAY__:";

export function parseProductDisplaySettings(value) {
  const defaults = {
    brand: true,
    moq: true,
    notes: true,
    publicPromo: ""
  };

  if (!value?.startsWith(DISPLAY_SETTINGS_PREFIX)) {
    return { ...defaults, publicPromo: value || "" };
  }

  try {
    const stored = JSON.parse(value.slice(DISPLAY_SETTINGS_PREFIX.length));
    return {
      brand: stored.brand !== false,
      moq: stored.moq !== false,
      notes: stored.notes !== false,
      publicPromo: stored.publicPromo || ""
    };
  } catch {
    return defaults;
  }
}

export function encodeProductDisplaySettings(settings, publicPromo = "") {
  return `${DISPLAY_SETTINGS_PREFIX}${JSON.stringify({
    brand: settings.brand !== false,
    moq: settings.moq !== false,
    notes: settings.notes !== false,
    publicPromo: publicPromo || ""
  })}`;
}

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

export function productImagePath(product) {
  if (product?.imagePath && !product.imagePath.includes("parrilla logo.png")) {
    return product.imagePath;
  }
  return "/images/parrilla logo.png";
}

export function getProduct(items, id) {
  return items.find((product) => product.id === id);
}

export function channelPrice(product, channel) {
  if (product?.salesChannel) return product.price;
  if (channel === "reseller" && product?.resellerPrice) return product.resellerPrice;
  return product.price;
}

export function priceLabel(product, channel) {
  const price = channelPrice(product, channel);
  if (!price) return "Contact for price";
  const suffix = channel === "wholesale" ? " / kg" : "";
  return `${peso.format(price)}${suffix}`;
}

export function minQtyFor(channel, product) {
  return Number(product?.moq || (channel === "reseller" ? 5 : 1));
}

export function productsForChannel(items, channel) {
  if (channel === "all") return items;
  return items.filter((product) =>
    product.salesChannel ? product.salesChannel === channel : product.channels.includes(channel)
  );
}

export function optionSize(value) {
  const text = String(value || "").toLowerCase();
  const number = Number.parseFloat(text.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(number)) return 0;
  if (text.includes("kg")) return number * 1000;
  if (text.includes("g")) return number;
  return number;
}

export function groupProductsForChannel(items, channel) {
  const groups = new Map();

  productsForChannel(items, channel).forEach((product) => {
    const baseKey = product.baseProductKey || product.id;
    const key = channel === "all" ? `${baseKey}:${product.salesChannel || product.channels[0]}` : baseKey;
    const current = groups.get(key) || [];
    current.push(product);
    groups.set(key, current);
  });

  return [...groups.entries()].map(([baseProductKey, options]) => {
    const sorted = [...options].sort((left, right) => {
      if (left.defaultOption !== right.defaultOption) return left.defaultOption ? -1 : 1;
      if (left.brandPriority !== right.brandPriority) return left.brandPriority - right.brandPriority;
      return optionSize(right.configuration || right.packSize) - optionSize(left.configuration || left.packSize);
    });
    return {
      ...sorted[0],
      id: sorted[0].id,
      baseProductKey,
      options: sorted
    };
  });
}

export function categoriesFor(items) {
  return [...new Set(items.map((product) => product.category))].sort();
}

export function subCategoriesFor(items) {
  return [...new Set(items.map((product) => product.subCategory).filter(Boolean))].sort();
}
