import { NextResponse } from "next/server";
import { createSupabaseClient, createSupabaseServiceClient } from "@/lib/supabase";
import { channelPrice, displayName, formatWeightLabel } from "@/lib/products";

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCartItem(item) {
  return {
    productId: cleanText(item?.productId),
    channel: cleanText(item?.channel || "retail"),
    selectedWeightId: cleanText(item?.selectedWeightId),
    qty: Number(item?.qty || 0)
  };
}

function inventoryError(message) {
  const error = new Error(message);
  error.code = "INVENTORY_CHANGED";
  return error;
}

function aggregateInventoryItems(cart) {
  const grouped = new Map();

  cart.forEach((item) => {
    const key = `${item.productId}:${item.selectedWeightId || ""}`;
    const current = grouped.get(key) || {
      product_id: item.productId,
      selected_weight_id: item.selectedWeightId || null,
      qty: 0
    };
    current.qty += item.qty;
    grouped.set(key, current);
  });

  return [...grouped.values()];
}

async function deductInventoryWithRpc(supabase, inventoryItems) {
  const { error } = await supabase.rpc("deduct_pack_inventory_for_order", {
    p_items: inventoryItems
  });

  if (!error) return true;
  if (error.message?.includes("deduct_pack_inventory_for_order")) return false;
  if (error.message?.includes("not available") || error.message?.includes("Insufficient")) {
    throw inventoryError("Availability changed while you were shopping. Please refresh your cart and adjust the selected pack size or quantity.");
  }
  throw new Error(`Could not update inventory: ${error.message}`);
}

async function refreshProductInventory(supabase, productId) {
  const { data: weights, error: weightsError } = await supabase
    .from("product_weight_options")
    .select("on_hand_qty")
    .eq("product_id", productId);

  if (weightsError) throw new Error(`Could not refresh pack inventory: ${weightsError.message}`);

  const total = (weights || []).reduce((sum, weight) => sum + Math.max(0, Number(weight.on_hand_qty || 0)), 0);
  const { error: productError } = await supabase
    .from("products")
    .update({
      on_hand_qty: total,
      stock: total > 0 ? "in-stock" : "out-of-stock"
    })
    .eq("id", productId);

  if (productError) throw new Error(`Could not refresh product inventory: ${productError.message}`);
}

async function deductInventoryFallback(supabase, inventoryItems) {
  for (const item of inventoryItems) {
    if (item.selected_weight_id) {
      const { data: weight, error: weightError } = await supabase
        .from("product_weight_options")
        .select("id, product_id, on_hand_qty, status")
        .eq("id", item.selected_weight_id)
        .eq("product_id", item.product_id)
        .single();

      if (weightError || !weight) {
        throw inventoryError("One selected pack size is no longer available. Please refresh your cart.");
      }

      const remainingQty = Number(weight.on_hand_qty || 0) - item.qty;
      if (weight.status !== "available" || remainingQty < 0) {
        throw inventoryError("Availability changed while you were shopping. Please choose another pack size or lower the quantity.");
      }

      const { error: updateWeightError } = await supabase
        .from("product_weight_options")
        .update({
          on_hand_qty: remainingQty,
          status: remainingQty > 0 ? "available" : "unavailable"
        })
        .eq("id", weight.id);

      if (updateWeightError) throw new Error(`Could not update pack inventory: ${updateWeightError.message}`);
      await refreshProductInventory(supabase, weight.product_id);
      continue;
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, on_hand_qty, stock, active")
      .eq("id", item.product_id)
      .single();

    if (productError || !product) {
      throw inventoryError("One product is no longer available. Please refresh your cart.");
    }

    const remainingQty = Number(product.on_hand_qty || 0) - item.qty;
    if (!product.active || product.stock === "out-of-stock" || remainingQty < 0) {
      throw inventoryError("Availability changed while you were shopping. Please adjust your cart.");
    }

    const { error: updateProductError } = await supabase
      .from("products")
      .update({
        on_hand_qty: remainingQty,
        stock: remainingQty > 0 ? "in-stock" : "out-of-stock"
      })
      .eq("id", product.id);

    if (updateProductError) throw new Error(`Could not update product inventory: ${updateProductError.message}`);
  }
}

async function deductInventory(cart) {
  const inventoryItems = aggregateInventoryItems(cart);
  const serviceClient = createSupabaseServiceClient();
  const supabase = serviceClient || createSupabaseClient();

  if (await deductInventoryWithRpc(supabase, inventoryItems)) return;
  if (!serviceClient) {
    throw new Error("Inventory updates require SUPABASE_SECRET_KEY or the deduct_pack_inventory_for_order database function.");
  }
  await deductInventoryFallback(serviceClient, inventoryItems);
}

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const customerName = cleanText(payload.customerName);
  const customerPhone = cleanText(payload.customerPhone);
  const customerEmail = cleanText(payload.customerEmail);
  const fulfillment = cleanText(payload.fulfillment) || "Pickup";
  const notes = cleanText(payload.notes);
  const cart = Array.isArray(payload.cart) ? payload.cart.map(normalizeCartItem) : [];

  if (!customerName || !customerPhone) {
    return NextResponse.json({ error: "Customer name and phone number are required." }, { status: 400 });
  }

  if (!["Pickup", "Delivery"].includes(fulfillment)) {
    return NextResponse.json({ error: "Invalid fulfillment option." }, { status: 400 });
  }

  if (!cart.length) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  const invalidItem = cart.find((item) => {
    if (!item.productId || !["retail", "reseller", "wholesale"].includes(item.channel)) return true;
    if (!Number.isInteger(item.qty) || item.qty <= 0) return true;
    return false;
  });

  if (invalidItem) {
    return NextResponse.json({ error: "Cart contains an invalid item." }, { status: 400 });
  }

  const supabase = createSupabaseClient();
  const productIds = [...new Set(cart.map((item) => item.productId))];
  let { data: products, error: productError } = await supabase
    .from("products")
    .select("*, product_weight_options(*)")
    .eq("active", true)
    .in("id", productIds);
  let legacySchema = false;

  if (productError?.message?.includes("product_weight_options")) {
    const fallback = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .in("id", productIds);
    products = fallback.data;
    productError = fallback.error;
    legacySchema = true;
  }

  if (productError) {
    return NextResponse.json({ error: "Could not validate products." }, { status: 500 });
  }

  const productById = new Map((products || []).map((product) => [product.id, product]));
  const missingProduct = productIds.find((id) => !productById.has(id));

  if (missingProduct) {
    return NextResponse.json({ error: "One or more products are no longer available." }, { status: 400 });
  }

  const invalidChannel = cart.find((item) => {
    const product = productById.get(item.productId);
    return product.sales_channel
      ? product.sales_channel !== item.channel
      : !Array.isArray(product.channels) || !product.channels.includes(item.channel);
  });

  if (invalidChannel) {
    return NextResponse.json(
      { error: "One or more products are not available for the selected sales channel." },
      { status: 400 }
    );
  }

  const invalidMoq = cart.find((item) => {
    const product = productById.get(item.productId);
    return item.qty < Number(product.moq || (item.channel === "reseller" ? 5 : 1));
  });

  if (invalidMoq) {
    return NextResponse.json({ error: "One or more products are below the minimum order quantity." }, { status: 400 });
  }

  const invalidWeight = cart.find((item) => {
    const product = productById.get(item.productId);
    const weights = product.product_weight_options || [];
    if (!weights.length) return Boolean(item.selectedWeightId);
    return !weights.some((weight) =>
      weight.id === item.selectedWeightId &&
      weight.status === "available" &&
      Number(weight.on_hand_qty || 0) > 0
    );
  });

  if (invalidWeight) {
    return NextResponse.json({ error: "Choose an available weight for each variable-weight product." }, { status: 400 });
  }

  const invalidInventory = cart.find((item) => {
    const product = productById.get(item.productId);
    const selectedWeight = (product.product_weight_options || [])
      .find((weight) => weight.id === item.selectedWeightId);
    const availableQty = selectedWeight
      ? Number(selectedWeight.on_hand_qty || 0)
      : Number(product.on_hand_qty || 0);
    return availableQty <= 0 || item.qty > availableQty || product.stock === "out-of-stock" || product.active === false;
  });

  if (invalidInventory) {
    return NextResponse.json({ error: "One or more products are out of stock or exceed available quantity." }, { status: 400 });
  }

  const orderItems = cart.map((item) => {
    const product = productById.get(item.productId);
    const selectedWeight = (product.product_weight_options || [])
      .find((weight) => weight.id === item.selectedWeightId);
    const normalizedProduct = {
      id: product.id,
      name: product.name,
      salesChannel: product.sales_channel,
      resellerPrice: product.reseller_price === null ? null : Number(product.reseller_price),
      price: product.price === null ? null : Number(product.price)
    };
    const unitPrice = selectedWeight
      ? Number(selectedWeight.price)
      : channelPrice(normalizedProduct, item.channel);
    const amount = unitPrice === null ? null : unitPrice * item.qty;

    const snapshot = {
      product_id: item.productId,
      name: displayName(normalizedProduct),
      channel: item.channel,
      qty: item.qty,
      packaging: [product.pack_size, product.packaging].filter(Boolean).join(" / ") || "Pack",
      unit_price: unitPrice,
      amount,
      final_price: amount
    };
    return legacySchema ? snapshot : {
      ...snapshot,
      sku: product.sku || null,
      selected_configuration: product.configuration || null,
      selected_weight: selectedWeight ? formatWeightLabel(selectedWeight.weight_value) : null,
      moq: Number(product.moq || 1),
      moq_unit: product.moq_unit || product.packaging || "item",
      notes_snapshot: product.notes || null
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || null,
      fulfillment,
      notes: notes || null,
      subtotal,
      final_total: subtotal || null,
      payment_status: "unpaid",
      status: "pending"
    })
    .select("id, order_number")
    .single();

  if (orderError) {
    return NextResponse.json({ error: "Could not create order." }, { status: 500 });
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    return NextResponse.json({ error: "Could not create order items." }, { status: 500 });
  }

  try {
    await deductInventory(cart);
  } catch (error) {
    const message = error?.code === "INVENTORY_CHANGED"
      ? error.message
      : "Order saved, but inventory could not be updated. Please contact staff before accepting payment.";
    return NextResponse.json(
      { error: message, code: error?.code || "INVENTORY_UPDATE_FAILED" },
      { status: error?.code === "INVENTORY_CHANGED" ? 409 : 500 }
    );
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.order_number
  });
}
