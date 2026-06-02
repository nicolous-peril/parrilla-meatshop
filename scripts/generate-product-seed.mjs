import { mkdir, writeFile } from "node:fs/promises";
import { PARRILLA_DEFAULT_PRODUCTS } from "../src/data/products.js";

function sqlValue(value) {
  if (value === null || value === undefined || value === "") return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlArray(values) {
  return `array[${values.map(sqlValue).join(", ")}]::text[]`;
}

function productRow(product, index) {
  return `(
  ${sqlValue(product.id)},
  ${sqlValue(product.name)},
  ${sqlValue(product.category)},
  ${sqlValue(product.subCategory)},
  ${sqlArray(product.channels || [])},
  ${sqlValue(product.packaging)},
  ${sqlValue(product.packSize)},
  ${sqlValue(product.price)},
  ${sqlValue(product.resellerPrice)},
  ${sqlValue(product.slabPrice)},
  ${sqlValue(product.kgPerBox)},
  ${sqlValue(product.brand)},
  ${sqlValue(product.stock)},
  ${sqlValue(product.featured)},
  ${sqlValue(product.homeRetailFeatured)},
  ${sqlValue(product.homeWholesaleFeatured)},
  ${sqlValue(product.promo)},
  ${sqlValue(product.description)},
  ${index}
)`;
}

function seedSql(products, startIndex = 0, label = "Generated from src/data/products.js. Run after 001_initial_schema.sql.") {
  const rows = products.map((product, index) => productRow(product, startIndex + index)).join(",\n");

  return `-- ${label}

insert into public.products (
  id,
  name,
  category,
  sub_category,
  channels,
  packaging,
  pack_size,
  price,
  reseller_price,
  slab_price,
  kg_per_box,
  brand,
  stock,
  featured,
  home_retail_featured,
  home_wholesale_featured,
  promo,
  description,
  sort_order
)
values
${rows}
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  sub_category = excluded.sub_category,
  channels = excluded.channels,
  packaging = excluded.packaging,
  pack_size = excluded.pack_size,
  price = excluded.price,
  reseller_price = excluded.reseller_price,
  slab_price = excluded.slab_price,
  kg_per_box = excluded.kg_per_box,
  brand = excluded.brand,
  stock = excluded.stock,
  featured = excluded.featured,
  home_retail_featured = excluded.home_retail_featured,
  home_wholesale_featured = excluded.home_wholesale_featured,
  promo = excluded.promo,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();
`;
}

await writeFile("supabase/seed-products.sql", seedSql(PARRILLA_DEFAULT_PRODUCTS));

const chunkSize = 20;
await mkdir("supabase/seed-products", { recursive: true });

for (let index = 0; index < PARRILLA_DEFAULT_PRODUCTS.length; index += chunkSize) {
  const chunk = PARRILLA_DEFAULT_PRODUCTS.slice(index, index + chunkSize);
  const fileNumber = String(index / chunkSize + 1).padStart(2, "0");
  const label = `Product seed chunk ${fileNumber}. Run after 001_initial_schema.sql.`;
  await writeFile(
    `supabase/seed-products/${fileNumber}.sql`,
    seedSql(chunk, index, label)
  );
}

console.log(`Generated supabase/seed-products.sql for ${PARRILLA_DEFAULT_PRODUCTS.length} products.`);
console.log(`Generated ${Math.ceil(PARRILLA_DEFAULT_PRODUCTS.length / chunkSize)} chunked seed files in supabase/seed-products/.`);
