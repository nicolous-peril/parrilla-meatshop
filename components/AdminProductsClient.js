"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { peso } from "@/lib/products";

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

const CHANNELS = ["retail", "reseller", "wholesale"];

function toFormProduct(product) {
  return {
    ...EMPTY_PRODUCT,
    ...product,
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

function displayPrice(product) {
  if (product.price !== null) return peso.format(Number(product.price));
  if (product.reseller_price !== null) return `${peso.format(Number(product.reseller_price))} reseller`;
  return "Quote required";
}

export function AdminProductsClient() {
  const { supabase, signOut } = useAdminAuth();
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [supabase]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.id, product.category, product.sub_category, product.brand]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [products, search]);

  async function loadProducts(preferredId = selectedId, successMessage = "") {
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
      const nextProducts = data || [];
      setProducts(nextProducts);
      setMessage(successMessage);

      if (preferredId) {
        const refreshed = nextProducts.find((product) => product.id === preferredId);
        if (refreshed) {
          setSelectedId(refreshed.id);
          setForm(toFormProduct(refreshed));
        }
      }
    }

    setIsLoading(false);
  }

  function startNewProduct() {
    setSelectedId(null);
    setForm(EMPTY_PRODUCT);
    setMessage("");
  }

  function editProduct(product) {
    setSelectedId(product.id);
    setForm(toFormProduct(product));
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function toggleChannel(channel) {
    setForm((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel]
    }));
  }

  async function saveProduct(event) {
    event.preventDefault();
    const id = selectedId || form.id.trim() || slugify(form.name);

    if (!id) {
      setMessage("Enter a product name or product ID.");
      return;
    }

    if (!form.channels.length) {
      setMessage("Select at least one sales channel.");
      return;
    }

    setIsSaving(true);
    setMessage(selectedId ? "Saving product changes..." : "Adding product...");

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
      home_retail_featured: form.home_retail_featured,
      home_wholesale_featured: form.home_wholesale_featured,
      promo: form.promo.trim() || null,
      description: form.description.trim() || null,
      image_path: form.image_path.trim() || "/images/parrilla logo.png",
      sort_order: Number(form.sort_order || 0),
      active: form.active
    };

    const query = selectedId
      ? supabase.from("products").update(payload).eq("id", selectedId)
      : supabase.from("products").insert(payload);
    const { data, error } = await query.select("*").single();

    if (error) {
      setMessage(`Could not save product: ${error.message}`);
    } else {
      setSelectedId(data.id);
      setForm(toFormProduct(data));
      await loadProducts(data.id, `${data.name} saved.`);
    }

    setIsSaving(false);
  }

  return (
    <section className="section">
      <div className="section-inner admin-workspace">
        <div className="admin-subnav">
          <Link href="/admin">Orders</Link>
          <Link className="active" href="/admin/products">Products</Link>
          <span className="admin-subnav-spacer" />
          <button className="btn btn-secondary" type="button" onClick={() => loadProducts()} disabled={isLoading}>
            Refresh
          </button>
          <button className="btn btn-secondary" type="button" onClick={signOut}>
            Log out
          </button>
        </div>

        {message ? <div className="notice">{message}</div> : null}

        <div className="admin-products-layout">
          <aside className="panel admin-editor">
            <div className="admin-editor-heading">
              <div>
                <p className="eyebrow">{selectedId ? "Edit product" : "New product"}</p>
                <h2>{selectedId ? form.name : "Add a product"}</h2>
              </div>
              {selectedId ? (
                <button className="btn btn-secondary" type="button" onClick={startNewProduct}>
                  Add new
                </button>
              ) : null}
            </div>

            <form className="form-grid product-editor-form" onSubmit={saveProduct}>
              <div className="form-grid two">
                <label className="field-label">
                  <span>Product name</span>
                  <input className="field" name="name" value={form.name} onChange={updateField} required />
                </label>
                <label className="field-label">
                  <span>Product ID</span>
                  <input
                    className="field"
                    name="id"
                    value={selectedId || form.id}
                    onChange={updateField}
                    placeholder="Generated from name"
                    disabled={Boolean(selectedId)}
                  />
                </label>
                <label className="field-label">
                  <span>Category</span>
                  <input className="field" name="category" value={form.category} onChange={updateField} required />
                </label>
                <label className="field-label">
                  <span>Subcategory</span>
                  <input className="field" name="sub_category" value={form.sub_category} onChange={updateField} />
                </label>
                <label className="field-label">
                  <span>Brand</span>
                  <input className="field" name="brand" value={form.brand} onChange={updateField} />
                </label>
                <label className="field-label">
                  <span>Stock status</span>
                  <select className="select" name="stock" value={form.stock} onChange={updateField}>
                    <option value="in-stock">In stock</option>
                    <option value="out-of-stock">Out of stock</option>
                  </select>
                </label>
                <label className="field-label">
                  <span>Packaging</span>
                  <input className="field" name="packaging" value={form.packaging} onChange={updateField} />
                </label>
                <label className="field-label">
                  <span>Pack size</span>
                  <input className="field" name="pack_size" value={form.pack_size} onChange={updateField} />
                </label>
                <label className="field-label">
                  <span>Retail price</span>
                  <input className="field" type="number" min="0" step="0.01" name="price" value={form.price} onChange={updateField} />
                </label>
                <label className="field-label">
                  <span>Reseller price</span>
                  <input className="field" type="number" min="0" step="0.01" name="reseller_price" value={form.reseller_price} onChange={updateField} />
                </label>
                <label className="field-label">
                  <span>Slab price</span>
                  <input className="field" type="number" min="0" step="0.01" name="slab_price" value={form.slab_price} onChange={updateField} />
                </label>
                <label className="field-label">
                  <span>Kg per box</span>
                  <input className="field" name="kg_per_box" value={form.kg_per_box} onChange={updateField} />
                </label>
                <label className="field-label">
                  <span>Sort order</span>
                  <input className="field" type="number" name="sort_order" value={form.sort_order} onChange={updateField} />
                </label>
                <label className="field-label">
                  <span>Promotion</span>
                  <input className="field" name="promo" value={form.promo} onChange={updateField} />
                </label>
              </div>

              <fieldset className="product-options">
                <legend>Sales channels</legend>
                {CHANNELS.map((channel) => (
                  <label className="check-field" key={channel}>
                    <input
                      type="checkbox"
                      checked={form.channels.includes(channel)}
                      onChange={() => toggleChannel(channel)}
                    />
                    <span>{channel}</span>
                  </label>
                ))}
              </fieldset>

              <label className="field-label">
                <span>Image path</span>
                <input className="field" name="image_path" value={form.image_path} onChange={updateField} required />
              </label>
              <label className="field-label">
                <span>Description</span>
                <textarea className="field textarea" name="description" value={form.description} onChange={updateField} />
              </label>

              <fieldset className="product-options">
                <legend>Visibility</legend>
                <label className="check-field">
                  <input type="checkbox" name="active" checked={form.active} onChange={updateField} />
                  <span>Active</span>
                </label>
                <label className="check-field">
                  <input type="checkbox" name="featured" checked={form.featured} onChange={updateField} />
                  <span>Featured</span>
                </label>
                <label className="check-field">
                  <input type="checkbox" name="home_retail_featured" checked={form.home_retail_featured} onChange={updateField} />
                  <span>Retail home</span>
                </label>
                <label className="check-field">
                  <input type="checkbox" name="home_wholesale_featured" checked={form.home_wholesale_featured} onChange={updateField} />
                  <span>Wholesale home</span>
                </label>
              </fieldset>

              <button className="btn btn-primary" type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : selectedId ? "Save changes" : "Add product"}
              </button>
            </form>
          </aside>

          <div className="admin-product-list">
            <div className="admin-product-toolbar">
              <div>
                <p className="eyebrow">Product catalogue</p>
                <h2>{products.length} products</h2>
              </div>
              <input
                className="field"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products"
                aria-label="Search products"
              />
            </div>

            <div className="admin-product-cards">
              {filteredProducts.length ? (
                filteredProducts.map((product) => (
                  <article className="admin-product-card" key={product.id}>
                    <img src={product.image_path} alt="" />
                    <div className="admin-product-details">
                      <div className="admin-product-title">
                        <div>
                          <p className="eyebrow">{product.category}{product.sub_category ? ` / ${product.sub_category}` : ""}</p>
                          <h3>{product.name}</h3>
                        </div>
                        <span className={product.active ? "status-pill is-complete" : "status-pill"}>
                          {product.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="muted">{product.description || "No description provided."}</p>
                      <div className="admin-product-meta">
                        <span><strong>{displayPrice(product)}</strong></span>
                        <span>{product.packaging || "No packaging"}{product.pack_size ? ` / ${product.pack_size}` : ""}</span>
                        <span>{(product.channels || []).join(", ") || "No channels"}</span>
                        <span>{product.stock === "in-stock" ? "In stock" : "Out of stock"}</span>
                      </div>
                    </div>
                    <button className="btn btn-secondary" type="button" onClick={() => editProduct(product)}>
                      Edit
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  {isLoading ? "Loading products..." : "No products match your search."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
