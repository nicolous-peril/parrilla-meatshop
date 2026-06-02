import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { channelPrice, displayName } from "@/lib/products";

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCartItem(item) {
  return {
    productId: cleanText(item?.productId),
    channel: cleanText(item?.channel || "retail"),
    qty: Number(item?.qty || 0)
  };
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
    if (item.channel === "reseller" && item.qty < 5) return true;
    return false;
  });

  if (invalidItem) {
    return NextResponse.json({ error: "Cart contains an invalid item." }, { status: 400 });
  }

  const supabase = createSupabaseClient();
  const productIds = [...new Set(cart.map((item) => item.productId))];
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .in("id", productIds);

  if (productError) {
    return NextResponse.json({ error: "Could not validate products." }, { status: 500 });
  }

  const productById = new Map((products || []).map((product) => [product.id, product]));
  const missingProduct = productIds.find((id) => !productById.has(id));

  if (missingProduct) {
    return NextResponse.json({ error: "One or more products are no longer available." }, { status: 400 });
  }

  const orderItems = cart.map((item) => {
    const product = productById.get(item.productId);
    const normalizedProduct = {
      id: product.id,
      name: product.name,
      resellerPrice: product.reseller_price === null ? null : Number(product.reseller_price),
      price: product.price === null ? null : Number(product.price)
    };
    const unitPrice = channelPrice(normalizedProduct, item.channel);
    const amount = item.channel === "wholesale" ? null : unitPrice * item.qty;

    return {
      product_id: item.productId,
      name: displayName(normalizedProduct),
      channel: item.channel,
      qty: item.qty,
      packaging: product.packaging || "Pack",
      unit_price: unitPrice,
      amount,
      final_price: amount
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

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.order_number
  });
}
