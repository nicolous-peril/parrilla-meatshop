"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { peso } from "@/lib/products";

const ORDER_STATUSES = ["ready", "completed", "cancelled"];

function formatDate(value) {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PH", { timeStyle: "short" }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "Not provided";
  return `${formatDate(value)} ${formatTime(value)}`;
}

function displayStatus(status) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";
}

function statusClass(status) {
  if (status === "completed") return "is-completed";
  if (status === "cancelled") return "is-cancelled";
  if (status === "ready") return "is-ready";
  return "is-pending";
}

function paymentClass(status) {
  if (status === "paid") return "is-paid";
  if (["failed", "refunded"].includes(status)) return "is-unpaid";
  return "is-verifying";
}

function orderType(order) {
  const channels = [...new Set((order.order_items || []).map((item) => item.channel).filter(Boolean))];
  if (!channels.length) return "Retail";
  if (channels.length > 1) return "Mixed";
  return displayStatus(channels[0]);
}

function orderTotal(order) {
  return Number(order.final_total ?? order.subtotal ?? 0);
}

function paymentMethod(order) {
  if (!order.payment_provider) {
    return order.fulfillment === "Delivery" ? "Cash on Delivery" : "Cash on Pickup";
  }
  return order.payment_provider
    .split(/[-_ ]+/)
    .map(displayStatus)
    .join(" ");
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function SummaryIcon({ type }) {
  const paths = {
    pending: <><rect x="5" y="4" width="11" height="15" rx="2" /><path d="M8 8h5M8 12h3M15 14l4 4M19 14l-4 4" /></>,
    ready: <><rect x="4" y="4" width="12" height="15" rx="2" /><path d="M7 8h6M7 12h4M16 13a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2v2l1.5 1" /></>,
    completed: <><path d="M5 11V5h6M7 17H4v4h4v-4Zm12-3h-4v7h4v-7Z" /><path d="m8 8 3 3 7-7" /></>,
    cancelled: <><path d="m5 5 14 14M19 5 5 19" /><path d="M4 4h5v5M20 4h-5v5M4 20h5v-5M20 20h-5v-5" /></>,
    total: <><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>;
}

export function AdminOrdersClient() {
  const { supabase } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [openStatusMenu, setOpenStatusMenu] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

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
        payment_provider,
        payment_reference,
        customer_name,
        customer_phone,
        customer_email,
        fulfillment,
        notes,
        subtotal,
        final_total,
        created_at,
        updated_at,
        order_items (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Could not load orders: ${error.message}`);
      setOrders([]);
    } else {
      const nextOrders = data || [];
      setMessage("");
      setOrders(nextOrders);
      setSelectedOrderId((current) => {
        if (current && nextOrders.some((order) => order.id === current)) return current;
        return nextOrders[0]?.id || null;
      });
    }
    setIsLoading(false);
  }

  const periodOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const created = new Date(order.created_at);
      if (dateFrom && created < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && created > new Date(`${dateTo}T23:59:59.999`)) return false;
      if (!query) return true;
      return [order.order_number, order.customer_name, order.customer_phone]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [dateFrom, dateTo, orders, search]);

  const filteredOrders = useMemo(
    () =>
      periodOrders.filter((order) => {
        if (statusFilter !== "all" && order.status !== statusFilter) return false;
        if (typeFilter !== "all" && orderType(order).toLowerCase() !== typeFilter) return false;
        if (paymentFilter !== "all" && order.payment_status !== paymentFilter) return false;
        return true;
      }),
    [paymentFilter, periodOrders, statusFilter, typeFilter]
  );

  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) || filteredOrders[0] || null;

  const summaryCards = [
    {
      key: "pending",
      label: "Pending",
      count: periodOrders.filter((order) => !["ready", "completed", "cancelled"].includes(order.status)).length,
      note: "New orders"
    },
    {
      key: "ready",
      label: "Ready",
      count: periodOrders.filter((order) => order.status === "ready").length,
      note: "Ready for pickup/delivery"
    },
    {
      key: "completed",
      label: "Completed",
      count: periodOrders.filter((order) => order.status === "completed").length,
      note: "Completed orders"
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: periodOrders.filter((order) => order.status === "cancelled").length,
      note: "Cancelled orders"
    },
    {
      key: "total",
      label: "Total Orders",
      count: periodOrders.length,
      note: "In selected period"
    }
  ];

  async function updateOrderStatus(orderId, status) {
    setOpenStatusMenu(null);
    setUpdatingOrderId(orderId);
    setMessage("Updating order status...");
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select("id, status, updated_at")
      .single();

    if (error) {
      setMessage(`Could not update order: ${error.message}`);
    } else {
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, status: data.status, updated_at: data.updated_at }
            : order
        )
      );
      setMessage(`${orders.find((order) => order.id === orderId)?.order_number || "Order"} updated.`);
    }
    setUpdatingOrderId(null);
  }

  function exportOrders() {
    const rows = [
      ["Order ID", "Date", "Customer", "Type", "Contact", "Total", "Payment", "Fulfillment", "Status"],
      ...filteredOrders.map((order) => [
        order.order_number,
        formatDateTime(order.created_at),
        order.customer_name,
        orderType(order),
        order.customer_phone,
        orderTotal(order),
        order.payment_status,
        order.fulfillment,
        order.status
      ])
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `parrilla-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="admin-orders-page">
      <header className="admin-page-header">
        <div>
          <h1>Orders Management</h1>
          <p>View and manage all customer orders</p>
        </div>
        <div className="admin-header-controls">
          <div className="admin-date-range" aria-label="Date range filter">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="Orders from date" />
            <span>to</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="Orders to date" />
          </div>
          <label className="admin-order-search">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, name, phone..."
              aria-label="Search orders"
            />
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 5 5" />
            </svg>
          </label>
        </div>
      </header>

      <section className="admin-summary-grid" aria-label="Order summary">
        {summaryCards.map((card) => (
          <article className={`admin-summary-card is-${card.key}`} key={card.key}>
            <span className="admin-summary-icon"><SummaryIcon type={card.key} /></span>
            <span>
              <small>{card.label}</small>
              <strong>{card.count}</strong>
              <p>{card.note}</p>
            </span>
          </article>
        ))}
      </section>

      {message ? <div className="admin-inline-message">{message}</div> : null}

      <section className="admin-orders-panel">
        <div className="admin-orders-toolbar">
          <h2>Orders List</h2>
          <div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter by order type">
              <option value="all">All Types</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="reseller">Reseller</option>
              <option value="mixed">Mixed</option>
            </select>
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} aria-label="Filter by payment status">
              <option value="all">All Payment Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <button className="admin-export-button" type="button" onClick={exportOrders}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3v12M8 11l4 4 4-4M5 15v5h14v-5" />
              </svg>
              Export
            </button>
          </div>
        </div>

        <div className="admin-orders-table-wrap">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date &amp; Time</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Order Summary</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Pickup / Delivery</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr className={selectedOrder?.id === order.id ? "is-selected" : ""} key={order.id}>
                  <td>
                    <strong>{order.order_number}</strong>
                    {order.status === "pending" ? <small className="admin-new-label">New</small> : null}
                  </td>
                  <td>{formatDate(order.created_at)}<small>{formatTime(order.created_at)}</small></td>
                  <td>{order.customer_name}</td>
                  <td><span className={`admin-type-label is-${orderType(order).toLowerCase()}`}>{orderType(order)}</span></td>
                  <td>{order.customer_phone}</td>
                  <td className="admin-order-summary-cell">
                    {(order.order_items || []).slice(0, 2).map((item) => (
                      <span key={item.id}>{item.qty} × {item.name}</span>
                    ))}
                    {(order.order_items || []).length > 2 ? <small>+{order.order_items.length - 2} more</small> : null}
                  </td>
                  <td><strong>{peso.format(orderTotal(order))}</strong></td>
                  <td>
                    <span>{paymentMethod(order)}</span>
                    <small className={`admin-payment-state ${paymentClass(order.payment_status)}`}>
                      {displayStatus(order.payment_status)}
                    </small>
                  </td>
                  <td>
                    <strong>{order.fulfillment}</strong>
                    <small>{formatDate(order.created_at)}</small>
                  </td>
                  <td>
                    <div className="admin-table-status">
                      <button
                        className={`admin-status-button ${statusClass(order.status)}`}
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={openStatusMenu === order.id}
                        disabled={updatingOrderId === order.id}
                        onClick={() => setOpenStatusMenu((current) => current === order.id ? null : order.id)}
                      >
                        {updatingOrderId === order.id ? "Saving..." : displayStatus(order.status)}
                        <span>⌄</span>
                      </button>
                      {openStatusMenu === order.id ? (
                        <div className="admin-status-dropdown" role="menu">
                          {ORDER_STATUSES.map((status) => (
                            <button key={status} type="button" role="menuitem" onClick={() => updateOrderStatus(order.id, status)}>
                              <span className={`admin-status-dot ${statusClass(status)}`} />
                              {displayStatus(status)}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <button
                      className="admin-view-order"
                      type="button"
                      aria-label={`View ${order.order_number}`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredOrders.length ? (
            <div className="admin-table-empty">{isLoading ? "Loading orders..." : "No orders match these filters."}</div>
          ) : null}
        </div>

        {selectedOrder ? <OrderDetails order={selectedOrder} /> : null}
      </section>
    </main>
  );
}

function OrderDetails({ order }) {
  const items = order.order_items || [];
  const currentStatus = order.status;
  const timeline = currentStatus === "cancelled"
    ? [
        { label: "Order placed", date: formatDateTime(order.created_at), active: true },
        { label: "Cancelled", date: formatDateTime(order.updated_at), active: true, cancelled: true }
      ]
    : [
        { label: "Order placed", date: formatDateTime(order.created_at), active: true },
        { label: "Pending", date: formatDateTime(order.created_at), active: true },
        { label: "Ready", date: currentStatus === "ready" ? formatDateTime(order.updated_at) : "", active: ["ready", "completed"].includes(currentStatus) },
        { label: "Completed", date: currentStatus === "completed" ? formatDateTime(order.updated_at) : "", active: currentStatus === "completed" }
      ];

  return (
    <div className="admin-order-details">
      <section>
        <h3>Order Details – {order.order_number}</h3>
        <dl className="admin-order-facts">
          <div><dt>Customer Name</dt><dd>{order.customer_name}</dd></div>
          <div><dt>Contact Number</dt><dd>{order.customer_phone}</dd></div>
          <div><dt>Order Type</dt><dd>{orderType(order)}</dd></div>
          <div><dt>Order Date &amp; Time</dt><dd>{formatDateTime(order.created_at)}</dd></div>
          <div><dt>Pickup / Delivery</dt><dd>{order.fulfillment}</dd></div>
          <div><dt>Preferred Date &amp; Time</dt><dd>Not provided</dd></div>
          <div><dt>Payment Method</dt><dd>{paymentMethod(order)}</dd></div>
          <div><dt>Payment Status</dt><dd className={paymentClass(order.payment_status)}>{displayStatus(order.payment_status)}</dd></div>
          <div><dt>Special Notes</dt><dd>{order.notes || "No special notes."}</dd></div>
        </dl>
      </section>

      <section className="admin-detail-items">
        <h3>Items Ordered</h3>
        <div>
          <table>
            <thead><tr><th>Product</th><th>SKU / Selection</th><th>Quantity</th><th>Unit</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}{item.notes_snapshot ? <small>{item.notes_snapshot}</small> : null}</td>
                  <td>
                    <strong>{item.sku || "Legacy"}</strong>
                    {[item.channel, item.selected_configuration, item.selected_weight].filter(Boolean).map((detail) => <small key={detail}>{detail}</small>)}
                  </td>
                  <td>{item.qty}</td>
                  <td>{item.packaging || "Pack"}{item.moq ? <small>MOQ {item.moq} {item.moq_unit}</small> : null}</td>
                  <td>{item.unit_price === null ? "Quote" : peso.format(Number(item.unit_price))}</td>
                  <td>{item.amount === null ? "Quote" : peso.format(Number(item.final_price ?? item.amount))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan="5">Total Amount</td><td>{peso.format(orderTotal(order))}</td></tr></tfoot>
          </table>
        </div>
      </section>

      <section className="admin-order-timeline">
        <h3>Timeline / Activity</h3>
        <ol>
          {timeline.map((entry) => (
            <li className={`${entry.active ? "is-active" : ""} ${entry.cancelled ? "is-cancelled" : ""}`} key={entry.label}>
              <span />
              <div><strong>{entry.label}</strong>{entry.date ? <small>{entry.date}</small> : null}</div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
