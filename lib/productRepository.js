import { createSupabaseClient } from "./supabase.js";
import { unstable_noStore as noStore } from "next/cache";

export function mapProduct(row) {
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
    featured: Boolean(row.featured || row.home_retail_featured || row.home_wholesale_featured),
    promo: row.promo || "",
    description: row.description || "",
    imagePath: row.image_path || "/images/parrilla logo.png",
    sortOrder: row.sort_order,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getStoreProducts() {
  noStore();
  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Supabase product fetch failed.", error.message);
      return [];
    }

    return (data || []).map(mapProduct);
  } catch (error) {
    console.error("Supabase product fetch failed.", error.message);
    return [];
  }
}

export async function getStoreProduct(id) {
  noStore();
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("Supabase product fetch failed.", error.message);
      return null;
    }
    return data ? mapProduct(data) : null;
  } catch (error) {
    console.error("Supabase product fetch failed.", error.message);
    return null;
  }
}
