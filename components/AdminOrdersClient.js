"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { peso } from "@/lib/products";

const ORDER_STATUSES = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusClass(status) {
  return status === "completed" ? "status-pill is-complete" : "status-pill";
}

export function AdminOrdersClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState(null);
  const [orders, setOrders] = useState([]);
  const [email, setEmail] = useState("parrillameatshop@gmail.com");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Checking admin session...");
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session || null);
      setMessage(data.session ? "" : "Sign in with your admin account to view orders.");
      setIsLoading(false);
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setMessage(nextSession ? "" : "Sign in with your admin account to view orders.");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!session) {
      setOrders([]);
      return;
    }
    loadOrders();
  }, [session]);

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

  async function signIn(event) {
    event.preventDefault();
    setIsSigningIn(true);
    setMessage("Signing in...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage(error.message);
    } else {
      setPassword("");
      setMessage("");
    }

    setIsSigningIn(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setOrders([]);
  }

  async function updateOrderStatus(orderId, status) {
    setMessage("Updating order status...");
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      setMessage(`Could not update order: ${error.message}`);
      return;
    }

    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
    setMessage("");
  }

  if (!session) {
    return (
      <section className="section">
        <div className="section-inner">
          <form className="panel form-grid admin-login" onSubmit={signIn}>
            <h2>Staff login</h2>
            <p className="muted">Use the Supabase Auth account created for Parrilla Meat Shop.</p>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
            />
            <input
              className="field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
            />
            <button className="btn btn-primary" type="submit" disabled={isSigningIn}>
              {isSigningIn ? "Signing in..." : "Sign in"}
            </button>
            {message ? <p className="form-message">{message}</p> : null}
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section-inner admin-workspace">
        <div className="admin-subnav">
          <Link href="/admin">Admin home</Link>
          <Link href="/admin/catalogue">Catalogue</Link>
          <Link className="active" href="/admin/orders">Orders</Link>
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
                    <span className={statusClass(order.status)}>{order.status}</span>
                  </div>
                  <label className="status-control">
                    <span>Status</span>
                    <select
                      className="select"
                      value={order.status}
                      onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
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
