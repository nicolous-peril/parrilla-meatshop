import { createSupabaseClient } from "./supabase.js";
import { fallbackProducts } from "./products.js";

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subCategory: row.sub_category,
    channels: row.channels || [],
    packaging: row.packaging,
    packSize: row.pack_size,
    price: row.price === null ? null : Number(row.price),
    resellerPrice: row.reseller_price === null ? null : Number(row.reseller_price),
    slabPrice: row.slab_price === null ? null : Number(row.slab_price),
    kgPerBox: row.kg_per_box,
    brand: row.brand || "",
    stock: row.stock,
    featured: row.featured,
    homeRetailFeatured: row.home_retail_featured,
    homeWholesaleFeatured: row.home_wholesale_featured,
    promo: row.promo || "",
    description: row.description || "",
    imagePath: row.image_path || ""
  };
}

export async function getStoreProducts() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return fallbackProducts;

  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.warn("Supabase product fetch failed; using local fallback.", error.message);
      return fallbackProducts;
    }

    return data?.length ? data.map(mapProduct) : fallbackProducts;
  } catch (error) {
    console.warn("Supabase product fetch failed; using local fallback.", error.message);
    return fallbackProducts;
  }
}

export async function getStoreProduct(id) {
  const items = await getStoreProducts();
  return items.find((product) => product.id === id);
}
