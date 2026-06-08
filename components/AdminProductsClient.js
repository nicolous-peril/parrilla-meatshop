"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { peso, productImagePath } from "@/lib/products";

const CHANNELS = ["retail", "reseller", "wholesale"];
const EMPTY_WEIGHT = {
  id: "",
  weight_label: "",
  weight_value: "",
  price: "",
  on_hand_qty: "",
  status: "available",
  sort_order: 0
};
const EMPTY_PRODUCT = {
  id: "",
  sku: "",
  base_product_key: "",
  name: "",
  category: "",
  sub_category: "",
  sales_channel: "retail",
  configuration: "",
  packaging: "",
  pack_size: "",
  price: "",
  brand: "",
  brand_priority: 0,
  moq: 1,
  moq_unit: "item",
  on_hand_qty: 0,
  stock: "in-stock",
  product_status: "active",
  featured: false,
  default_option: false,
  notes: "",
  description: "",
  image_path: "/images/parrilla logo.png",
  sort_order: 0,
  active: true,
  weight_options: []
};

function nullableNumber(value) {
  return value === "" || value === null ? null : Number(value);
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toFormProduct(product) {
  return {
    ...EMPTY_PRODUCT,
    ...product,
    sku: product.sku || "",
    base_product_key: product.base_product_key || "",
    name: product.name || "",
    category: product.category || "",
    sub_category: product.sub_category || "",
    sales_channel: product.sales_channel || product.channels?.[0] || "retail",
    configuration: product.configuration || "",
    packaging: product.packaging || "",
    pack_size: product.pack_size || "",
    price: product.price ?? "",
    brand: product.brand || "",
    moq: product.moq ?? 1,
    moq_unit: product.moq_unit || "item",
    on_hand_qty: product.on_hand_qty ?? 0,
    product_status: product.product_status || (product.active === false ? "inactive" : "active"),
    notes: product.notes || "",
    description: product.description || "",
    image_path: product.image_path || "/images/parrilla logo.png",
    weight_options: (product.product_weight_options || []).map((weight) => ({
      ...EMPTY_WEIGHT,
      ...weight,
      weight_value: weight.weight_value ?? "",
      price: weight.price ?? "",
      on_hand_qty: weight.on_hand_qty ?? ""
    }))
  };
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function displayStatus(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function DashboardIcon({ type }) {
  const paths = {
    total: <><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>,
    active: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    stock: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="m4 7v10l8 4 8-4V7M12 11v10" /></>,
    retail: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M8 8a4 4 0 0 1 8 0" /></>,
    wholesale: <><path d="M3 9h18v11H3V9Z" /><path d="M7 9V5h10v4M8 13h8M8 17h5" /></>,
    reseller: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3 20a6 6 0 0 1 12 0M14 15a5 5 0 0 1 7 5" /></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>;
}

const TABLE_COLUMNS = [
  { key: "number", label: "Product Number" },
  { key: "name", label: "Product Name" },
  { key: "price", label: "Price" },
  { key: "pack", label: "Pack Size" },
  { key: "subcategory", label: "Subcategory" },
  { key: "category", label: "Category" },
  { key: "channel", label: "Channel" },
  { key: "quantity", label: "On Hand Qty." },
  { key: "status", label: "Status" },
  { key: "notes", label: "Notes" },
  { key: "actions", label: "Actions" }
];

async function optimizeImage(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > 8 * 1024 * 1024) throw new Error("Image must be smaller than 8 MB.");

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const nextImage = new Image();
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () => reject(new Error("Could not process the selected image."));
    nextImage.src = dataUrl;
  });
  const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.84);
}

export function AdminProductsClient() {
  const { supabase } = useAdminAuth();
  const fileInputRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [supabase]);

  useEffect(() => {
    document.body.style.overflow = modalOpen || deleteProduct ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [deleteProduct, modalOpen]);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    [products]
  );
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      if (query && ![product.name, product.sku, product.id].some((value) => value?.toLowerCase().includes(query))) return false;
      if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
      if (channelFilter !== "all" && product.sales_channel !== channelFilter) return false;
      const productStatus = product.product_status || (product.active === false ? "inactive" : "active");
      if (statusFilter !== "all" && productStatus !== statusFilter) return false;
      if (featuredFilter === "featured" && !product.featured) return false;
      if (featuredFilter === "not-featured" && product.featured) return false;
      return true;
    });
  }, [categoryFilter, channelFilter, featuredFilter, products, search, statusFilter]);

  const summaryCards = [
    { type: "total", label: "Total SKUs", count: products.length },
    { type: "active", label: "Active Products", count: products.filter((product) => product.active).length },
    { type: "stock", label: "Out of Stock", count: products.filter((product) => product.stock === "out-of-stock").length },
    ...CHANNELS.map((channel) => ({
      type: channel,
      label: `${displayStatus(channel)} Products`,
      count: products.filter((product) => product.sales_channel === channel).length
    }))
  ];

  async function loadProducts(successMessage = "") {
    setIsLoading(true);
    let { data, error } = await supabase
      .from("products")
      .select("*, product_weight_options(*)")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error?.message?.includes("product_weight_options")) {
      const fallback = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      setProducts([]);
      setMessage(`Could not load products: ${error.message}`);
    } else {
      setProducts((data || []).map((product) => ({
        ...product,
        sales_channel: product.sales_channel || product.channels?.[0] || "retail",
        product_status: product.product_status || (product.active === false ? "inactive" : "active"),
        image_path: productImagePath({
          id: product.id,
          name: product.name,
          channels: product.channels || [],
          imagePath: product.image_path
        }, product.sales_channel || product.channels?.[0] || "retail")
      })));
      setMessage(successMessage);
    }
    setIsLoading(false);
  }

  function openNewProduct() {
    setSelectedId(null);
    setForm(EMPTY_PRODUCT);
    setMessage("");
    setModalOpen(true);
  }

  function openEditProduct(product) {
    setSelectedId(product.id);
    setForm(toFormProduct(product));
    setMessage("");
    setModalOpen(true);
  }

  function closeModal() {
    if (isSaving || isUploading) return;
    setModalOpen(false);
    setSelectedId(null);
    setForm(EMPTY_PRODUCT);
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function updateWeight(index, field, value) {
    setForm((current) => ({
      ...current,
      weight_options: current.weight_options.map((weight, weightIndex) =>
        weightIndex === index ? { ...weight, [field]: value } : weight
      )
    }));
  }

  function addWeight() {
    setForm((current) => ({
      ...current,
      weight_options: [...current.weight_options, { ...EMPTY_WEIGHT, sort_order: current.weight_options.length }]
    }));
  }

  function removeWeight(index) {
    setForm((current) => ({
      ...current,
      weight_options: current.weight_options.filter((_, weightIndex) => weightIndex !== index)
    }));
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setMessage("");
    try {
      const imageUrl = await optimizeImage(file);
      setForm((current) => ({ ...current, image_path: imageUrl }));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!cleanString(form.name) || !cleanString(form.category) || !form.sales_channel) {
      setMessage("Product name, category, and sales channel are required.");
      return;
    }

    const invalidWeight = form.weight_options.find((weight) =>
      !cleanString(weight.weight_label) || nullableNumber(weight.price) === null
    );
    if (invalidWeight) {
      setMessage("Every weight row needs a weight label and price.");
      return;
    }

    setIsSaving(true);
    setMessage("Saving product...");

    try {
      const internalId = selectedId || [
        form.sales_channel,
        slugify(cleanString(form.name)),
        slugify(cleanString(form.brand)),
        slugify(cleanString(form.configuration) || cleanString(form.pack_size)),
        Math.random().toString(36).slice(2, 7)
      ].filter(Boolean).join("-");
      const baseProductKey =
        cleanString(form.base_product_key) ||
        slugify(cleanString(form.name).replace(/\s*\(box\)\s*$/i, ""));
      const payload = {
        id: internalId,
        name: cleanString(form.name),
        category: cleanString(form.category),
        sub_category: cleanString(form.sub_category) || null,
        channels: [form.sales_channel],
        sales_channel: form.sales_channel,
        base_product_key: baseProductKey,
        configuration: cleanString(form.configuration) || null,
        packaging: cleanString(form.packaging) || null,
        pack_size: cleanString(form.pack_size) || null,
        price: nullableNumber(form.price),
        reseller_price: null,
        slab_price: null,
        kg_per_box: cleanString(form.pack_size) || null,
        brand: cleanString(form.brand) || null,
        brand_priority: Number(form.brand_priority || 0),
        moq: Number(form.moq || 1),
        moq_unit: cleanString(form.moq_unit) || "item",
        on_hand_qty: Number(form.on_hand_qty || 0),
        stock: Number(form.on_hand_qty || 0) > 0 ? "in-stock" : "out-of-stock",
        featured: form.featured,
        default_option: form.default_option,
        notes: cleanString(form.notes) || null,
        description: cleanString(form.description) || null,
        image_path: form.image_path || "/images/parrilla logo.png",
        sort_order: Number(form.sort_order || 0),
        active: form.product_status === "active"
      };

      const productQuery = selectedId
        ? supabase.from("products").update(payload).eq("id", selectedId)
        : supabase.from("products").insert(payload);
      const { data: savedProduct, error: productError } = await productQuery
        .select("id, name, sku")
        .single();

      if (productError) throw new Error(`Could not save product: ${productError.message}`);

      const { error: deleteWeightsError } = await supabase
        .from("product_weight_options")
        .delete()
        .eq("product_id", savedProduct.id);
      if (deleteWeightsError) {
        throw new Error(`Product saved, but weights could not be updated: ${deleteWeightsError.message}`);
      }

      if (form.weight_options.length) {
        const { error: weightsError } = await supabase.from("product_weight_options").insert(
          form.weight_options.map((weight, index) => ({
            product_id: savedProduct.id,
            weight_label: cleanString(weight.weight_label),
            weight_value: nullableNumber(weight.weight_value),
            price: Number(weight.price),
            on_hand_qty: Number(weight.on_hand_qty || 0),
            status: weight.status,
            sort_order: index
          }))
        );
        if (weightsError) {
          throw new Error(`Product saved, but weights could not be added: ${weightsError.message}`);
        }
      }

      setModalOpen(false);
      setSelectedId(null);
      setForm(EMPTY_PRODUCT);
      await loadProducts(`${savedProduct.name} (${savedProduct.sku}) saved successfully.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save product.");
    } finally {
      setIsSaving(false);
    }
  }

  async function permanentlyDeleteProduct() {
    if (!deleteProduct) return;
    setMessage(`Deleting ${deleteProduct.name}...`);
    const { error } = await supabase.from("products").delete().eq("id", deleteProduct.id);
    if (error) {
      setMessage(`Could not delete product: ${error.message}`);
    } else {
      setModalOpen(false);
      setSelectedId(null);
      setForm(EMPTY_PRODUCT);
      await loadProducts(`${deleteProduct.name} permanently deleted.`);
    }
    setDeleteProduct(null);
  }

  function resetFilters() {
    setSearch("");
    setCategoryFilter("all");
    setChannelFilter("all");
    setStatusFilter("all");
    setFeaturedFilter("all");
  }

  function exportProducts() {
    const rows = [
      TABLE_COLUMNS.map((column) => column.label),
      ...visibleProducts.map((product) => [
        product.sku,
        product.name,
        product.price,
        product.pack_size || product.packaging,
        product.sub_category,
        product.category,
        product.sales_channel,
        product.on_hand_qty,
        product.product_status || (product.active === false ? "inactive" : "active"),
        product.notes,
        ""
      ])
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `parrilla-products-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="admin-products-page">
      <header className="admin-page-header admin-products-header">
        <div>
          <h1>Products Management</h1>
          <p>Manage channel SKUs, configurations, prices, inventory, and product details.</p>
        </div>
        <div className="admin-products-header-actions">
          <label className="admin-order-search">
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product name or SKU..." />
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>
          </label>
          <button className="admin-primary-action" type="button" onClick={openNewProduct}><span>+</span>Add New Product</button>
        </div>
      </header>

      <section className="admin-product-summary-grid" aria-label="Product summary">
        {summaryCards.map((card) => (
          <article className={`admin-product-summary-card is-${card.type}`} key={card.type}>
            <span><DashboardIcon type={card.type} /></span>
            <div><small>{card.label}</small><strong>{card.count}</strong></div>
          </article>
        ))}
      </section>

      {message ? <div className="admin-inline-message">{message}</div> : null}

      <section className="admin-products-table-panel">
        <div className="admin-products-filters">
          <div>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All Categories</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
            <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}>
              <option value="all">All Sales Channels</option>
              {CHANNELS.map((channel) => <option key={channel} value={channel}>{displayStatus(channel)}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
            <select value={featuredFilter} onChange={(event) => setFeaturedFilter(event.target.value)}>
              <option value="all">All Featured Status</option><option value="featured">Featured</option><option value="not-featured">Not Featured</option>
            </select>
          </div>
          <div>
            <button className="admin-secondary-action" type="button" onClick={resetFilters}>Reset</button>
            <button className="admin-export-button" type="button" onClick={exportProducts}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 11l4 4 4-4M5 15v5h14v-5" /></svg>Export
            </button>
          </div>
        </div>

        <div className="admin-products-table-wrap">
          <table className="admin-products-table">
            <thead>
              <tr>
                {TABLE_COLUMNS.map((column) => (
                  <th className={`admin-product-col-${column.key}`} key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr className={product.active ? "" : "is-inactive"} key={product.id}>
                  <td><code>{product.sku || "Pending"}</code></td>
                  <td className="admin-product-name-cell">
                    <strong>{product.name}</strong>
                  </td>
                  <td><strong>{product.price === null ? "Quote" : peso.format(Number(product.price))}</strong></td>
                  <td>{product.pack_size || product.packaging || "—"}</td>
                  <td>{product.sub_category || "—"}</td>
                  <td>{product.category}</td>
                  <td><span className={`admin-channel-pill is-${product.sales_channel}`}>{product.sales_channel}</span></td>
                  <td>{product.on_hand_qty ?? 0}</td>
                  <td><span className={`admin-status-label is-${product.product_status || (product.active === false ? "inactive" : "active")}`}>{displayStatus(product.product_status || (product.active === false ? "inactive" : "active"))}</span></td>
                  <td className="admin-product-notes-cell">{product.notes || "—"}</td>
                  <td><div className="admin-product-actions admin-product-text-actions">
                    <a href={`/product/${product.id}?channel=${product.sales_channel}`} target="_blank" rel="noreferrer">View</a>
                    <button type="button" onClick={() => openEditProduct(product)}>Edit</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleProducts.length ? <div className="admin-table-empty">{isLoading ? "Loading products..." : "No products match these filters."}</div> : null}
        </div>
      </section>

      {modalOpen ? (
        <div className="admin-product-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <section className="admin-product-modal admin-product-modal-wide" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
            <header>
              <div><p>{selectedId ? "Edit product SKU" : "New product SKU"}</p><h2 id="product-modal-title">{selectedId ? form.name : "Add New Product"}</h2></div>
              <button type="button" onClick={closeModal} aria-label="Close product form">×</button>
            </header>
            <form onSubmit={saveProduct}>
              {message ? <div className="admin-inline-message admin-modal-message">{message}</div> : null}
              <div className="admin-product-upload">
                <img src={form.image_path || "/images/parrilla logo.png"} alt="Product preview" />
                <div><strong>Product Image</strong><p>JPG, PNG, or WebP. The preview is saved with this SKU.</p>
                  <button className="admin-secondary-action" type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>{isUploading ? "Processing..." : "Upload Product Image"}</button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} hidden />
                </div>
              </div>

              <fieldset className="admin-product-form-section">
                <legend>Product Identity</legend>
                <div className="admin-product-form-grid admin-product-form-grid-three">
                  <label><span>Product Name</span><input name="name" value={form.name} onChange={updateField} required /></label>
                  <label><span>SKU / Product ID</span><input value={form.sku || "Generated automatically"} disabled /></label>
                  <label><span>Base Product Key</span><input name="base_product_key" value={form.base_product_key} onChange={updateField} placeholder="Auto-generated from product name" /></label>
                  <label><span>Category</span><input name="category" value={form.category} onChange={updateField} list="product-categories" required /><datalist id="product-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist></label>
                  <label><span>Sub-Category</span><input name="sub_category" value={form.sub_category} onChange={updateField} /></label>
                  <label><span>Sales Channel</span><select name="sales_channel" value={form.sales_channel} onChange={updateField}>{CHANNELS.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
                  <label><span>Brand</span><input name="brand" value={form.brand} onChange={updateField} placeholder="Optional" /></label>
                  <label><span>Brand Priority</span><input type="number" name="brand_priority" value={form.brand_priority} onChange={updateField} /></label>
                  <label><span>Configuration</span><input name="configuration" value={form.configuration} onChange={updateField} placeholder="e.g. 1kg or 500g" /></label>
                </div>
              </fieldset>

              <fieldset className="admin-product-form-section">
                <legend>Pricing &amp; Inventory</legend>
                <div className="admin-product-form-grid admin-product-form-grid-three">
                  <label><span>Pack Size / Unit</span><input name="pack_size" value={form.pack_size} onChange={updateField} /></label>
                  <label><span>Packaging</span><input name="packaging" value={form.packaging} onChange={updateField} /></label>
                  <label><span>Price</span><input type="number" min="0" step="0.01" name="price" value={form.price} onChange={updateField} /></label>
                  <label><span>MOQ</span><input type="number" min="0.001" step="0.001" name="moq" value={form.moq} onChange={updateField} required /></label>
                  <label><span>MOQ Unit</span><input name="moq_unit" value={form.moq_unit} onChange={updateField} placeholder="pack, box, kg" /></label>
                  <label><span>On Hand Qty.</span><input type="number" min="0" step="0.001" name="on_hand_qty" value={form.on_hand_qty} onChange={updateField} /></label>
                  <label><span>Status</span><select name="product_status" value={form.product_status} onChange={updateField}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                  <label><span>Display Order / Priority</span><input type="number" name="sort_order" value={form.sort_order} onChange={updateField} /></label>
                </div>
              </fieldset>

              <fieldset className="admin-product-form-section admin-weight-section">
                <div className="admin-weight-heading"><legend>Weight &amp; Pricing</legend><button className="admin-secondary-action" type="button" onClick={addWeight}>+ Add Weight Row</button></div>
                <p>Add exact sellable weights only when this SKU varies by actual weight.</p>
                {form.weight_options.length ? (
                  <div className="admin-weight-table">
                    <div className="admin-weight-row is-header"><span>Actual Weight</span><span>Numeric Weight</span><span>Price</span><span>On Hand</span><span>Status</span><span /></div>
                    {form.weight_options.map((weight, index) => (
                      <div className="admin-weight-row" key={weight.id || index}>
                        <input value={weight.weight_label} onChange={(event) => updateWeight(index, "weight_label", event.target.value)} placeholder="1.2kg" />
                        <input type="number" min="0" step="0.001" value={weight.weight_value} onChange={(event) => updateWeight(index, "weight_value", event.target.value)} placeholder="1.2" />
                        <input type="number" min="0" step="0.01" value={weight.price} onChange={(event) => updateWeight(index, "price", event.target.value)} placeholder="0.00" />
                        <input type="number" min="0" step="0.001" value={weight.on_hand_qty} onChange={(event) => updateWeight(index, "on_hand_qty", event.target.value)} />
                        <select value={weight.status} onChange={(event) => updateWeight(index, "status", event.target.value)}><option value="available">Available</option><option value="unavailable">Unavailable</option></select>
                        <button type="button" onClick={() => removeWeight(index)} aria-label="Remove weight row">×</button>
                      </div>
                    ))}
                  </div>
                ) : <div className="admin-weight-empty">No variable weight options. The SKU price above will be used.</div>}
              </fieldset>

              <fieldset className="admin-product-form-section">
                <legend>Customer-Facing Details</legend>
                <label className="admin-modal-description"><span>Description</span><textarea name="description" value={form.description} onChange={updateField} rows="3" /></label>
                <label className="admin-modal-description"><span>Notes</span><textarea name="notes" value={form.notes} onChange={updateField} rows="3" placeholder="Shown on product cards, cart, checkout, and order details." /></label>
              </fieldset>

              <div className="admin-modal-toggles">
                <label><input type="checkbox" name="featured" checked={form.featured} onChange={updateField} /><span>Featured Product</span></label>
                <label><input type="checkbox" name="default_option" checked={form.default_option} onChange={updateField} /><span>Default Brand / Configuration</span></label>
              </div>
              <footer>
                <div>
                  {selectedId ? (
                    <button className="admin-danger-link" type="button" onClick={() => setDeleteProduct({ id: selectedId, name: form.name, sku: form.sku })}>
                      Delete Product
                    </button>
                  ) : null}
                </div>
                <div>
                  <button className="admin-secondary-action" type="button" onClick={closeModal}>Cancel</button>
                  <button className="admin-primary-action" type="submit" disabled={isSaving || isUploading}>{isSaving ? "Saving..." : "Save Product"}</button>
                </div>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {deleteProduct ? (
        <div className="admin-confirm-backdrop" role="presentation">
          <section className="admin-confirm-modal" role="alertdialog" aria-modal="true">
            <h2>Permanently delete product?</h2>
            <p>Are you sure you want to permanently delete this product?</p>
            <strong>{deleteProduct.name} ({deleteProduct.sku})</strong>
            <div>
              <button className="admin-secondary-action" type="button" onClick={() => setDeleteProduct(null)}>Cancel</button>
              <button className="admin-danger-action" type="button" onClick={permanentlyDeleteProduct}>Delete</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
