import { createSupabaseClient } from "./supabase.js";
import { unstable_noStore as noStore } from "next/cache";
import { parseProductDisplaySettings } from "./products.js";

export function mapProduct(row) {
  const displaySettings = parseProductDisplaySettings(row.promo);

  return {
    id: row.id,
    sku: row.sku || "",
    baseProductKey: row.base_product_key || row.id,
    name: row.name,
    category: row.category,
    subCategory: row.sub_category,
    salesChannel: row.sales_channel || row.channels?.[0] || "retail",
    channels: row.sales_channel ? [row.sales_channel] : (row.channels || []),
    configuration: row.configuration || "",
    packaging: row.packaging,
    packSize: row.pack_size,
    price: row.price === null ? null : Number(row.price),
    resellerPrice: row.reseller_price === null ? null : Number(row.reseller_price),
    slabPrice: row.slab_price === null ? null : Number(row.slab_price),
    kgPerBox: row.kg_per_box,
    moq: Number(row.moq || (row.sales_channel === "reseller" ? 5 : 1)),
    moqUnit: row.moq_unit || row.packaging || "item",
    onHandQty: Number(row.on_hand_qty || 0),
    notes: row.notes || "",
    displayFields: {
      moq: displaySettings.moq,
      notes: displaySettings.notes
    },
    productStatus: row.active === false ? "inactive" : "active",
    defaultOption: Boolean(row.default_option),
    weightOptions: (row.product_weight_options || [])
      .map((option) => ({
        id: option.id,
        label: option.weight_label,
        value: option.weight_value === null ? null : Number(option.weight_value),
        price: Number(option.price),
        onHandQty: Number(option.on_hand_qty || 0),
        status: option.status,
        sortOrder: Number(option.sort_order || 0)
      }))
      .sort((left, right) => (right.value || 0) - (left.value || 0) || left.sortOrder - right.sortOrder),
    stock: row.stock,
    featured: Boolean(row.featured || row.home_retail_featured || row.home_wholesale_featured),
    promo: displaySettings.publicPromo,
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

    let { data, error } = await supabase
      .from("products")
      .select("*, product_weight_options(*)")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error?.message?.includes("product_weight_options")) {
      const fallback = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      data = fallback.data;
      error = fallback.error;
    }

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
    let { data, error } = await supabase
      .from("products")
      .select("*, product_weight_options(*)")
      .eq("id", id)
      .eq("active", true)
      .maybeSingle();

    if (error?.message?.includes("product_weight_options")) {
      const fallback = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("active", true)
        .maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error("Supabase product fetch failed.", error.message);
      return null;
    }
    if (!data) return null;

    const product = mapProduct(data);
    if (!data.base_product_key || !data.sales_channel) return product;

    const { data: familyRows, error: familyError } = await supabase
      .from("products")
      .select("*, product_weight_options(*)")
      .eq("base_product_key", data.base_product_key)
      .eq("sales_channel", data.sales_channel)
      .eq("active", true)
      .order("sort_order", { ascending: true });

    return familyError
      ? product
      : { ...product, options: (familyRows || []).map(mapProduct) };
  } catch (error) {
    console.error("Supabase product fetch failed.", error.message);
    return null;
  }
}
