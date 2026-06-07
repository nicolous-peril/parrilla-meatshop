"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { peso } from "@/lib/products";

const ORDER_STATUSES = ["ready", "completed", "cancelled"];

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusClass(status) {
  if (status === "completed") return "status-pill is-complete";
  if (status === "cancelled") return "status-pill is-cancelled";
  if (status === "ready") return "status-pill is-ready";
  return "status-pill";
}

function displayStatus(status) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";
}

export function AdminOrdersClient() {
  const { supabase, signOut } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [openStatusMenu, setOpenStatusMenu] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [supabase]);

  async function loadOrders() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        payment_status,
        customer_name,
        customer_phone,
        customer_email,
        fulfillment,
        notes,
        subtotal,
        final_total,
        created_at,
        order_items (
          id,
          name,
          channel,
          qty,
          packaging,
          unit_price,
          amount,
          availability,
          actual_weight,
          final_price
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Could not load orders: ${error.message}`);
      setOrders([]);
    } else {
      setMessage("");
      setOrders(data || []);
    }

    setIsLoading(false);
  }

  async function updateOrderStatus(orderId, status) {
    setOpenStatusMenu(null);
    setUpdatingOrderId(orderId);
    setMessage("Updating order status...");
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select("id, status")
      .single();

    if (error) {
      setMessage(`Could not update order: ${error.message}`);
      setUpdatingOrderId(null);
      return;
    }

    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: data.status } : order))
    );
    setMessage(`Order ${displayStatus(data.status).toLowerCase()}.`);
    setUpdatingOrderId(null);
  }

  return (
    <section className="section">
      <div className="section-inner admin-workspace">
        <div className="admin-subnav">
          <Link className="active" href="/admin">Orders</Link>
          <Link href="/admin/products">Products</Link>
          <span className="admin-subnav-spacer" />
          <button className="btn btn-secondary" type="button" onClick={loadOrders} disabled={isLoading}>
            Refresh
          </button>
          <button className="btn btn-secondary" type="button" onClick={signOut}>
            Log out
          </button>
        </div>

        {message ? <div className="notice">{message}</div> : null}

        <div className="order-board">
          {orders.length ? (
            orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card-head">
                  <div>
                    <p className="eyebrow">{formatDate(order.created_at)}</p>
                    <h3>{order.order_number}</h3>
                    <span className={statusClass(order.status)}>{displayStatus(order.status)}</span>
                  </div>
                  <div className="status-control">
                    <span>Status</span>
                    <button
                      className="status-menu-button"
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={openStatusMenu === order.id}
                      onClick={() =>
                        setOpenStatusMenu((current) => (current === order.id ? null : order.id))
                      }
                      disabled={updatingOrderId === order.id}
                    >
                      {updatingOrderId === order.id ? "Saving..." : displayStatus(order.status)}
                      <span aria-hidden="true">▾</span>
                    </button>
                    {openStatusMenu === order.id ? (
                      <div className="status-menu" role="menu">
                        {ORDER_STATUSES.map((status) => (
                          <button
                            key={status}
                            type="button"
                            role="menuitem"
                            onClick={() => updateOrderStatus(order.id, status)}
                          >
                            {displayStatus(status)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="order-contact">
                  <p>
                    <strong>{order.customer_name}</strong>
                    <br />
                    {order.customer_phone}
                    {order.customer_email ? (
                      <>
                        <br />
                        {order.customer_email}
                      </>
                    ) : null}
                  </p>
                  <p>
                    <strong>{order.fulfillment}</strong>
                    <br />
                    Payment: {order.payment_status}
                    <br />
                    Subtotal: {peso.format(Number(order.subtotal || 0))}
                  </p>
                </div>

                {order.notes ? <p className="notice order-note">{order.notes}</p> : null}

                <div className="order-items">
                  {(order.order_items || []).map((item) => (
                    <div className="order-item" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <p className="muted">
                          {item.channel} / {item.packaging || "Pack"}
                        </p>
                      </div>
                      <span>Qty: {item.qty}</span>
                      <span>{item.amount === null ? "Quote required" : peso.format(Number(item.amount))}</span>
                      <span className={statusClass(item.availability)}>{item.availability}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">{isLoading ? "Loading orders..." : "No orders yet."}</div>
          )}
        </div>
      </div>
    </section>
  );
}
