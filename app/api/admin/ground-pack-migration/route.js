import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase";

const MIGRATION_TOKEN = "ground-pack-size-783d99a";

const migrations = [
  {
    productId: "retail-ground-beef-1-kg",
    legacyHalfId: "retail-ground-beef-500g",
    name: "Ground Beef",
    description: "Frozen Beef product with selectable pack sizes.",
    fallbackPrice: 420
  },
  {
    productId: "retail-ground-pork-1-kg",
    legacyHalfId: "retail-ground-pork-500g",
    name: "Ground Pork",
    description: "Frozen Pork product with selectable pack sizes.",
    fallbackPrice: 280
  }
];

function stockFor(quantity) {
  return Number(quantity || 0) > 0 ? "available" : "unavailable";
}

async function upsertWeight(supabase, row) {
  const { error } = await supabase
    .from("product_weight_options")
    .upsert(row, { onConflict: "product_id,weight_label" });
  if (error) throw new Error(`Could not upsert ${row.product_id} ${row.weight_label}: ${error.message}`);
}

async function refreshInventory(supabase, productId) {
  const { data: weights, error: weightsError } = await supabase
    .from("product_weight_options")
    .select("on_hand_qty")
    .eq("product_id", productId);
  if (weightsError) throw new Error(`Could not read weights for ${productId}: ${weightsError.message}`);

  const total = (weights || []).reduce((sum, weight) => sum + Number(weight.on_hand_qty || 0), 0);
  const { error } = await supabase
    .from("products")
    .update({
      on_hand_qty: total,
      stock: total > 0 ? "in-stock" : "out-of-stock"
    })
    .eq("id", productId);
  if (error) throw new Error(`Could not refresh ${productId}: ${error.message}`);
}

export async function POST(request) {
  if (request.headers.get("x-migration-token") !== MIGRATION_TOKEN) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY is not configured." }, { status: 500 });
  }

  const results = [];

  try {
    for (const migration of migrations) {
      const { data: parent, error: parentError } = await supabase
        .from("products")
        .select("id, price, on_hand_qty")
        .eq("id", migration.productId)
        .single();
      if (parentError) throw new Error(`Could not read ${migration.productId}: ${parentError.message}`);

      const { data: legacyHalf, error: halfError } = await supabase
        .from("products")
        .select("id, on_hand_qty")
        .eq("id", migration.legacyHalfId)
        .single();
      if (halfError) throw new Error(`Could not read ${migration.legacyHalfId}: ${halfError.message}`);

      const basePrice = Number(parent.price || migration.fallbackPrice);
      const oneKgQty = Number(parent.on_hand_qty || 0);
      const halfKgQty = Number(legacyHalf.on_hand_qty || 0);

      const { error: updateParentError } = await supabase
        .from("products")
        .update({
          name: migration.name,
          configuration: null,
          pack_size: "Pack Size Options",
          packaging: "Pack Size Options",
          description: migration.description,
          active: true,
          stock: "in-stock"
        })
        .eq("id", migration.productId);
      if (updateParentError) throw new Error(`Could not update ${migration.productId}: ${updateParentError.message}`);

      await upsertWeight(supabase, {
        product_id: migration.productId,
        weight_label: "1 kg",
        weight_value: 1,
        price: basePrice,
        on_hand_qty: oneKgQty,
        status: stockFor(oneKgQty),
        sort_order: 0
      });

      await upsertWeight(supabase, {
        product_id: migration.productId,
        weight_label: "0.5 kg",
        weight_value: 0.5,
        price: Number((basePrice * 0.5).toFixed(2)),
        on_hand_qty: halfKgQty,
        status: stockFor(halfKgQty),
        sort_order: 1
      });

      const { error: deactivateError } = await supabase
        .from("products")
        .update({
          active: false,
          stock: "out-of-stock"
        })
        .eq("id", migration.legacyHalfId);
      if (deactivateError) throw new Error(`Could not deactivate ${migration.legacyHalfId}: ${deactivateError.message}`);

      await refreshInventory(supabase, migration.productId);
      results.push({ productId: migration.productId, converted: true });
    }

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Migration failed." }, { status: 500 });
  }
}
