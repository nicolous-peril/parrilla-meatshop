"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { peso, productImagePath } from "@/lib/products";

const EMPTY_PRODUCT = {
  id: "",
  name: "",
  category: "",
  sub_category: "",
  channels: ["retail"],
  packaging: "",
  pack_size: "",
  price: "",
  reseller_price: "",
  slab_price: "",
  kg_per_box: "",
  brand: "",
  stock: "in-stock",
  featured: false,
  home_retail_featured: false,
  home_wholesale_featured: false,
  promo: "",
  description: "",
  image_path: "/images/parrilla logo.png",
  sort_order: 0,
  active: true
};

const CHANNELS = ["retail", "wholesale", "reseller"];

function toFormProduct(product) {
  return {
    ...EMPTY_PRODUCT,
    ...product,
    channels: product.channels || [],
    price: product.price ?? "",
    reseller_price: product.reseller_price ?? "",
    slab_price: product.slab_price ?? ""
  };
}

function nullableNumber(value) {
  return value === "" ? null : Number(value);
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(value));
}

function displayPrice(product) {
  if (product.price !== null) return peso.format(Number(product.price));
  if (product.reseller_price !== null) return `${peso.format(Number(product.reseller_price))} reseller`;
  if (product.slab_price !== null) return `${peso.format(Number(product.slab_price))} slab`;
  return "Quote required";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function DashboardIcon({ type }) {
  const paths = {
    total: <><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>,
    active: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    stock: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="m4 7v10l8 4 8-4V7M12 11v10" /><path d="m8 15 8-8" /></>,
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
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image must be smaller than 8 MB.");
  }

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

  const maxSize = 1200;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.84);
}

export function AdminProductsClient() {
  const { supabase } = useAdminAuth();
  const fileInputRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
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
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    [products]
  );

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      if (query && ![product.name, product.id].some((value) => value?.toLowerCase().includes(query))) {
        return false;
      }
      if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
      if (channelFilter !== "all" && !(product.channels || []).includes(channelFilter)) return false;
      if (stockFilter !== "all" && product.stock !== stockFilter) return false;
      if (featuredFilter === "featured" && !product.featured) return false;
      if (featuredFilter === "not-featured" && product.featured) return false;
      return true;
    });
  }, [categoryFilter, channelFilter, featuredFilter, products, search, stockFilter]);

  const summaryCards = [
    { type: "total", label: "Total Products", count: products.length },
    { type: "active", label: "Active Products", count: products.filter((product) => product.active).length },
    { type: "stock", label: "Out of Stock", count: products.filter((product) => product.stock === "out-of-stock").length },
    { type: "retail", label: "Retail Products", count: products.filter((product) => product.channels?.includes("retail")).length },
    { type: "wholesale", label: "Wholesale Products", count: products.filter((product) => product.channels?.includes("wholesale")).length },
    { type: "reseller", label: "Reseller Products", count: products.filter((product) => product.channels?.includes("reseller")).length }
  ];

  async function loadProducts(successMessage = "") {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      setMessage(`Could not load products: ${error.message}`);
      setProducts([]);
    } else {
      const rows = data || [];
      const normalizedRows = rows.map((product) => {
        const normalizedImage = productImagePath(
          {
            id: product.id,
            name: product.name,
            channels: product.channels || [],
            imagePath: product.image_path
          },
          product.channels?.[0] || "retail"
        );
        return {
          ...product,
          featured: Boolean(
            product.featured ||
            product.home_retail_featured ||
            product.home_wholesale_featured
          ),
          home_retail_featured: false,
          home_wholesale_featured: false,
          image_path: normalizedImage
        };
      });
      const legacyRows = normalizedRows.filter((product, index) => {
        const original = rows[index];
        return (
          original.home_retail_featured ||
          original.home_wholesale_featured ||
          original.image_path !== product.image_path
        );
      });

      let migrationMessage = "";
      if (legacyRows.length) {
        const results = await Promise.all(
          legacyRows.map((product) =>
            supabase
              .from("products")
              .update({
                featured: product.featured,
                home_retail_featured: false,
                home_wholesale_featured: false,
                image_path: product.image_path
              })
              .eq("id", product.id)
          )
        );
        const migrationError = results.find((result) => result.error)?.error;
        if (migrationError) {
          migrationMessage = `Could not consolidate legacy product fields: ${migrationError.message}`;
        }
      }

      setProducts(normalizedRows);
      setMessage(successMessage || migrationMessage);
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

  function toggleChannel(channel) {
    setForm((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel]
    }));
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setMessage("");
    const previousImage = form.image_path;
    let localPreview = "";
    try {
      localPreview = URL.createObjectURL(file);
      setForm((current) => ({ ...current, image_path: localPreview }));
      const imageUrl = await optimizeImage(file);
      setForm((current) => ({ ...current, image_path: imageUrl }));
    } catch (error) {
      setForm((current) => ({ ...current, image_path: previousImage }));
      setMessage(error.message);
    } finally {
      if (localPreview) URL.revokeObjectURL(localPreview);
    }
    setIsUploading(false);
    event.target.value = "";
  }

  async function saveProduct(event) {
    event.preventDefault();
    const id = selectedId || form.id.trim() || slugify(form.name);

    if (!id || !form.name.trim() || !form.category.trim()) {
      setMessage("Product name, product ID, and category are required.");
      return;
    }
    if (!form.channels.length) {
      setMessage("Select at least one sales channel.");
      return;
    }

    setIsSaving(true);
    const payload = {
      id,
      name: form.name.trim(),
      category: form.category.trim(),
      sub_category: form.sub_category.trim() || null,
      channels: form.channels,
      packaging: form.packaging.trim() || null,
      pack_size: form.pack_size.trim() || null,
      price: nullableNumber(form.price),
      reseller_price: nullableNumber(form.reseller_price),
      slab_price: nullableNumber(form.slab_price),
      kg_per_box: form.kg_per_box.trim() || null,
      brand: form.brand.trim() || null,
      stock: form.stock,
      featured: form.featured,
      home_retail_featured: false,
      home_wholesale_featured: false,
      promo: form.promo.trim() || null,
      description: form.description.trim() || null,
      image_path: form.image_path || "/images/parrilla logo.png",
      sort_order: Number(form.sort_order || 0),
      active: form.active
    };

    const query = selectedId
      ? supabase.from("products").update(payload).eq("id", selectedId)
      : supabase.from("products").insert(payload);
    const { data, error } = await query.select("id, name").single();

    if (error) {
      setMessage(`Could not save product: ${error.message}`);
    } else {
      setModalOpen(false);
      setSelectedId(null);
      setForm(EMPTY_PRODUCT);
      await loadProducts(`${data.name} saved successfully.`);
    }
    setIsSaving(false);
  }

  async function toggleProductActive(product) {
    const action = product.active ? "deactivate" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${action} ${product.name}?`)) return;
    setMessage(`${product.active ? "Deactivating" : "Reactivating"} ${product.name}...`);
    const { error } = await supabase
      .from("products")
      .update({ active: !product.active })
      .eq("id", product.id);

    if (error) {
      setMessage(`Could not ${action} product: ${error.message}`);
    } else {
      await loadProducts(`${product.name} ${product.active ? "deactivated" : "reactivated"}.`);
    }
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
      ["Product ID", "Name", "Category", "Channels", "Pack Size", "Price", "Stock", "Featured", "Active", "Updated"],
      ...visibleProducts.map((product) => [
        product.id,
        product.name,
        product.category,
        (product.channels || []).join(", "),
        [product.pack_size, product.packaging].filter(Boolean).join(" / "),
        product.price ?? product.reseller_price ?? product.slab_price ?? "",
        product.stock,
        product.featured ? "Yes" : "No",
        product.active ? "Yes" : "No",
        product.updated_at
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
          <p>Manage product listings, prices, availability, and product details.</p>
        </div>
        <div className="admin-products-header-actions">
          <label className="admin-order-search">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product name or SKU..."
              aria-label="Search products by name or SKU"
            />
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 5 5" />
            </svg>
          </label>
          <button className="admin-primary-action" type="button" onClick={openNewProduct}>
            <span>+</span>
            Add New Product
          </button>
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
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter products by category">
              <option value="all">All Categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} aria-label="Filter products by sales channel">
              <option value="all">All Sales Channels</option>
              {CHANNELS.map((channel) => <option key={channel} value={channel}>{displayStatus(channel)}</option>)}
            </select>
            <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} aria-label="Filter products by stock status">
              <option value="all">All Stock Status</option>
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
            <select value={featuredFilter} onChange={(event) => setFeaturedFilter(event.target.value)} aria-label="Filter featured products">
              <option value="all">All Featured Status</option>
              <option value="featured">Featured</option>
              <option value="not-featured">Not Featured</option>
            </select>
          </div>
          <div>
            <button className="admin-secondary-action" type="button" onClick={resetFilters}>Reset</button>
            <button className="admin-export-button" type="button" onClick={exportProducts}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 11l4 4 4-4M5 15v5h14v-5" /></svg>
              Export
            </button>
          </div>
        </div>

        <div className="admin-products-table-wrap">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Product Image</th>
                <th>Product Name</th>
                <th>SKU / Product ID</th>
                <th>Category</th>
                <th>Sales Channel</th>
                <th>Pack Size / Unit</th>
                <th>Price</th>
                <th>Stock Status</th>
                <th>Featured</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr className={product.active ? "" : "is-inactive"} key={product.id}>
                  <td><img className="admin-product-table-image" src={product.image_path} alt="" /></td>
                  <td><strong>{product.name}</strong><small>{product.active ? "Active" : "Inactive"}</small></td>
                  <td><code>{product.id}</code></td>
                  <td>{product.category}{product.sub_category ? <small>{product.sub_category}</small> : null}</td>
                  <td><div className="admin-channel-list">{(product.channels || []).map((channel) => <span className={`is-${channel}`} key={channel}>{channel}</span>)}</div></td>
                  <td>{product.pack_size || "—"}<small>{product.packaging || ""}</small></td>
                  <td><strong>{displayPrice(product)}</strong></td>
                  <td><span className={`admin-stock-label ${product.stock === "in-stock" ? "is-in-stock" : "is-out-of-stock"}`}>{product.stock === "in-stock" ? "In Stock" : "Out of Stock"}</span></td>
                  <td><span className={product.featured ? "admin-featured-label is-featured" : "admin-featured-label"}>{product.featured ? "Featured" : "Standard"}</span></td>
                  <td>{formatDate(product.updated_at)}</td>
                  <td>
                    <div className="admin-product-actions">
                      <a href={`/product/${product.id}`} target="_blank" rel="noreferrer" aria-label={`View ${product.name}`} title="View product"><ActionIcon type="view" /></a>
                      <button type="button" onClick={() => openEditProduct(product)} aria-label={`Edit ${product.name}`} title="Edit product"><ActionIcon type="edit" /></button>
                      <button className={product.active ? "is-destructive" : "is-reactivate"} type="button" onClick={() => toggleProductActive(product)} aria-label={`${product.active ? "Deactivate" : "Reactivate"} ${product.name}`} title={product.active ? "Deactivate product" : "Reactivate product"}><ActionIcon type="delete" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleProducts.length ? <div className="admin-table-empty">{isLoading ? "Loading products..." : "No products match these filters."}</div> : null}
        </div>
      </section>

      {modalOpen ? (
        <div className="admin-product-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <section className="admin-product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
            <header>
              <div>
                <p>{selectedId ? "Edit product" : "New product"}</p>
                <h2 id="product-modal-title">{selectedId ? form.name : "Add New Product"}</h2>
              </div>
              <button type="button" onClick={closeModal} aria-label="Close product form">×</button>
            </header>

            <form onSubmit={saveProduct}>
              <div className="admin-product-upload">
                <img src={form.image_path || "/images/parrilla logo.png"} alt="Product preview" />
                <div>
                  <strong>Product Image</strong>
                  <p>JPG, PNG, or WebP. Images are optimized and saved with the product record.</p>
                  <button className="admin-secondary-action" type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? "Processing image..." : "Upload Product Image"}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} hidden />
                </div>
              </div>

              <div className="admin-product-form-grid">
                <label><span>Product Name</span><input name="name" value={form.name} onChange={updateField} required /></label>
                <label><span>SKU / Product ID</span><input name="id" value={selectedId || form.id} onChange={updateField} placeholder="Generated from product name" disabled={Boolean(selectedId)} /></label>
                <label><span>Category</span><input name="category" value={form.category} onChange={updateField} list="product-categories" required /><datalist id="product-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist></label>
                <label><span>Pack Size / Unit</span><input name="pack_size" value={form.pack_size} onChange={updateField} placeholder="e.g. 1 kg" /></label>
                <label><span>Unit / Packaging</span><input name="packaging" value={form.packaging} onChange={updateField} placeholder="e.g. Pack per Kg" /></label>
                <label><span>Price</span><input type="number" min="0" step="0.01" name="price" value={form.price} onChange={updateField} /></label>
                <label><span>Stock Status</span><select name="stock" value={form.stock} onChange={updateField}><option value="in-stock">In Stock</option><option value="out-of-stock">Out of Stock</option></select></label>
                <label><span>Display Order / Priority</span><input type="number" name="sort_order" value={form.sort_order} onChange={updateField} /></label>
              </div>

              <fieldset className="admin-modal-channels">
                <legend>Sales Channel</legend>
                {CHANNELS.map((channel) => (
                  <label key={channel}><input type="checkbox" checked={form.channels.includes(channel)} onChange={() => toggleChannel(channel)} /><span>{channel}</span></label>
                ))}
              </fieldset>

              <label className="admin-modal-description"><span>Description</span><textarea name="description" value={form.description} onChange={updateField} rows="4" /></label>

              <div className="admin-modal-toggles">
                <label><input type="checkbox" name="featured" checked={form.featured} onChange={updateField} /><span>Featured Product</span></label>
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
    </main>
  );
}

function displayStatus(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}
