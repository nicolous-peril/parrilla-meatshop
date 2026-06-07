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
    sales_channel: product.sales_channel || product.channels?.[0] || "retail",
    price: product.price ?? "",
    moq: product.moq ?? 1,
    on_hand_qty: product.on_hand_qty ?? 0,
    weight_options: (product.product_weight_options || []).map((weight) => ({
      ...EMPTY_WEIGHT,
      ...weight,
      weight_value: weight.weight_value ?? "",
      price: weight.price ?? "",
      on_hand_qty: weight.on_hand_qty ?? ""
    }))
  };
}

function formatDate(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(value));
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

function ActionIcon({ type }) {
  if (type === "view") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
  }
  if (type === "edit") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z" /><path d="m13.5 7 3.5 3.5" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
}

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
  const [stockFilter, setStockFilter] = useState("all");
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
      if (stockFilter !== "all" && product.stock !== stockFilter) return false;
      if (featuredFilter === "featured" && !product.featured) return false;
      if (featuredFilter === "not-featured" && product.featured) return false;
      return true;
    });
  }, [categoryFilter, channelFilter, featuredFilter, products, search, stockFilter]);

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
    if (!form.name.trim() || !form.category.trim() || !form.sales_channel) {
      setMessage("Product name, category, and sales channel are required.");
      return;
    }

    const invalidWeight = form.weight_options.find((weight) =>
      !weight.weight_label.trim() || nullableNumber(weight.price) === null
    );
    if (invalidWeight) {
      setMessage("Every weight row needs a weight label and price.");
      return;
    }

    setIsSaving(true);
    setMessage("Saving product...");
    const internalId = selectedId || [
      form.sales_channel,
      slugify(form.name),
      slugify(form.brand),
      slugify(form.configuration || form.pack_size),
      Math.random().toString(36).slice(2, 7)
    ].filter(Boolean).join("-");
    const baseProductKey = form.base_product_key.trim() || slugify(form.name.replace(/\s*\(box\)\s*$/i, ""));
    const payload = {
      id: internalId,
      name: form.name.trim(),
      category: form.category.trim(),
      sub_category: form.sub_category.trim() || null,
      channels: [form.sales_channel],
      sales_channel: form.sales_channel,
      base_product_key: baseProductKey,
      configuration: form.configuration.trim() || null,
      packaging: form.packaging.trim() || null,
      pack_size: form.pack_size.trim() || null,
      price: nullableNumber(form.price),
      reseller_price: null,
      slab_price: null,
      kg_per_box: form.pack_size.trim() || null,
      brand: form.brand.trim() || null,
      brand_priority: Number(form.brand_priority || 0),
      moq: Number(form.moq || 1),
      moq_unit: form.moq_unit.trim() || "item",
      on_hand_qty: Number(form.on_hand_qty || 0),
      stock: form.stock,
      featured: form.featured,
      default_option: form.default_option,
      notes: form.notes.trim() || null,
      description: form.description.trim() || null,
      image_path: form.image_path || "/images/parrilla logo.png",
      sort_order: Number(form.sort_order || 0),
      active: form.active
    };

    const productQuery = selectedId
      ? supabase.from("products").update(payload).eq("id", selectedId)
      : supabase.from("products").insert(payload);
    const { data: savedProduct, error: productError } = await productQuery.select("id, name, sku").single();

    if (productError) {
      setMessage(`Could not save product: ${productError.message}`);
      setIsSaving(false);
      return;
    }

    const { error: deleteWeightsError } = await supabase
      .from("product_weight_options")
      .delete()
      .eq("product_id", savedProduct.id);
    if (deleteWeightsError) {
      setMessage(`Product saved, but weights could not be updated: ${deleteWeightsError.message}`);
      setIsSaving(false);
      return;
    }

    if (form.weight_options.length) {
      const { error: weightsError } = await supabase.from("product_weight_options").insert(
        form.weight_options.map((weight, index) => ({
          product_id: savedProduct.id,
          weight_label: weight.weight_label.trim(),
          weight_value: nullableNumber(weight.weight_value),
          price: Number(weight.price),
          on_hand_qty: Number(weight.on_hand_qty || 0),
          status: weight.status,
          sort_order: index
        }))
      );
      if (weightsError) {
        setMessage(`Product saved, but weights could not be added: ${weightsError.message}`);
        setIsSaving(false);
        return;
      }
    }

    setModalOpen(false);
    setSelectedId(null);
    setForm(EMPTY_PRODUCT);
    await loadProducts(`${savedProduct.name} (${savedProduct.sku}) saved successfully.`);
    setIsSaving(false);
  }

  async function permanentlyDeleteProduct() {
    if (!deleteProduct) return;
    setMessage(`Deleting ${deleteProduct.name}...`);
    const { error } = await supabase.from("products").delete().eq("id", deleteProduct.id);
    if (error) {
      setMessage(`Could not delete product: ${error.message}`);
    } else {
      await loadProducts(`${deleteProduct.name} permanently deleted.`);
    }
    setDeleteProduct(null);
  }

  function resetFilters() {
    setSearch("");
    setCategoryFilter("all");
    setChannelFilter("all");
    setStockFilter("all");
    setFeaturedFilter("all");
  }

  function exportProducts() {
    const rows = [
      ["SKU", "Product", "Category", "Sub-Category", "Brand", "Channel", "Configuration", "Pack Size", "MOQ", "Price", "On Hand", "Stock", "Featured", "Active", "Notes"],
      ...visibleProducts.map((product) => [
        product.sku,
        product.name,
        product.category,
        product.sub_category,
        product.brand,
        product.sales_channel,
        product.configuration,
        product.pack_size,
        `${product.moq} ${product.moq_unit}`,
        product.price,
        product.on_hand_qty,
        product.stock,
        product.featured ? "Yes" : "No",
        product.active ? "Yes" : "No",
        product.notes
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
            <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
              <option value="all">All Stock Status</option><option value="in-stock">In Stock</option><option value="out-of-stock">Out of Stock</option>
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
            <thead><tr>
              <th>Image</th><th>Product Name</th><th>SKU</th><th>Category</th><th>Sub-Category</th><th>Brand</th>
              <th>Channel</th><th>Configuration</th><th>Pack / Unit</th><th>MOQ</th><th>Price</th><th>On Hand</th>
              <th>Stock</th><th>Featured</th><th>Notes</th><th>Updated</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr className={product.active ? "" : "is-inactive"} key={product.id}>
                  <td><img className="admin-product-table-image" src={product.image_path} alt="" /></td>
                  <td><strong>{product.name}</strong><small>{product.active ? "Active" : "Inactive"}</small></td>
                  <td><code>{product.sku || "Pending"}</code></td>
                  <td>{product.category}</td>
                  <td>{product.sub_category || "—"}</td>
                  <td>{product.brand || "—"}</td>
                  <td><span className={`admin-channel-pill is-${product.sales_channel}`}>{product.sales_channel}</span></td>
                  <td>{product.configuration || "—"}</td>
                  <td>{product.pack_size || product.packaging || "—"}</td>
                  <td>{product.moq} <small>{product.moq_unit}</small></td>
                  <td><strong>{product.price === null ? "Quote" : peso.format(Number(product.price))}</strong></td>
                  <td>{product.on_hand_qty ?? 0}</td>
                  <td><span className={`admin-stock-label ${product.stock === "in-stock" ? "is-in-stock" : "is-out-of-stock"}`}>{product.stock === "in-stock" ? "In Stock" : "Out of Stock"}</span></td>
                  <td><span className={product.featured ? "admin-featured-label is-featured" : "admin-featured-label"}>{product.featured ? "Featured" : "Standard"}</span></td>
                  <td className="admin-product-notes-cell">{product.notes || "—"}</td>
                  <td>{formatDate(product.updated_at)}</td>
                  <td><div className="admin-product-actions">
                    <a href={`/product/${product.id}?channel=${product.sales_channel}`} target="_blank" rel="noreferrer" title="View product"><ActionIcon type="view" /></a>
                    <button type="button" onClick={() => openEditProduct(product)} title="Edit product"><ActionIcon type="edit" /></button>
                    <button className="is-destructive" type="button" onClick={() => setDeleteProduct(product)} title="Permanently delete product"><ActionIcon type="delete" /></button>
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
                  <label><span>Stock Status</span><select name="stock" value={form.stock} onChange={updateField}><option value="in-stock">In Stock</option><option value="out-of-stock">Out of Stock</option></select></label>
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
                <label><input type="checkbox" name="active" checked={form.active} onChange={updateField} /><span>Active Product</span></label>
              </div>
              <footer>
                <button className="admin-secondary-action" type="button" onClick={closeModal}>Cancel</button>
                <button className="admin-primary-action" type="submit" disabled={isSaving || isUploading}>{isSaving ? "Saving..." : "Save Product"}</button>
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
