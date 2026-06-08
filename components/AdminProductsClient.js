"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import {
  encodeProductDisplaySettings,
  formatWeightLabel,
  parseProductDisplaySettings,
  peso,
  productImagePath
} from "@/lib/products";

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
  moq: 1,
  moq_unit: "item",
  moq_text: "1 item",
  on_hand_qty: 0,
  stock: "in-stock",
  product_status: "active",
  featured: false,
  default_option: false,
  notes: "",
  description: "",
  public_promo: "",
  display_fields: {
    moq: true,
    notes: true
  },
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

function parseMoqText(value) {
  const text = cleanString(value);
  const match = text.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return { moq: 1, unit: text || "item" };
  return {
    moq: Number(match[1]),
    unit: cleanString(match[2]) || "item"
  };
}

function weightPrice(basePrice, weightValue) {
  const price = Number(basePrice);
  const weight = Number(weightValue);
  if (!Number.isFinite(price) || !Number.isFinite(weight)) return "";
  return (price * weight).toFixed(2);
}

function weightInventoryTotal(weights) {
  return weights.reduce(
    (total, weight) => total + Math.max(0, Math.trunc(Number(weight.on_hand_qty || 0))),
    0
  );
}

function withWeightInventory(product, weights) {
  return {
    ...product,
    weight_options: weights,
    on_hand_qty: weights.length ? weightInventoryTotal(weights) : 0
  };
}

function toFormProduct(product) {
  const displaySettings = parseProductDisplaySettings(product.promo);
  const weights = (product.product_weight_options || []).map((weight) => ({
    ...EMPTY_WEIGHT,
    ...weight,
    weight_label: formatWeightLabel(weight),
    weight_value: weight.weight_value ?? "",
    price: weight.price ?? weightPrice(product.price, weight.weight_value),
    on_hand_qty: weight.on_hand_qty ?? ""
  }));

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
    price: product.price === null || product.price === undefined ? "" : Number(product.price).toFixed(2),
    moq: product.moq ?? 1,
    moq_unit: product.moq_unit || "item",
    moq_text: `${product.moq ?? 1} ${product.moq_unit || "item"}`.trim(),
    on_hand_qty: weights.length ? weightInventoryTotal(weights) : (product.on_hand_qty ?? 0),
    product_status: product.product_status || (product.active === false ? "inactive" : "active"),
    notes: product.notes || "",
    description: product.description || "",
    public_promo: displaySettings.publicPromo,
    display_fields: {
      moq: displaySettings.moq,
      notes: displaySettings.notes
    },
    image_path: product.image_path || "/images/parrilla logo.png",
    weight_options: weights
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
  { key: "number", label: "Product Number", value: (product) => Number(product.sku) || product.sku || "" },
  { key: "name", label: "Product Name", value: (product) => product.name || "" },
  { key: "price", label: "Price", value: (product) => Number(product.price ?? -1) },
  { key: "pack", label: "Pack Size", value: (product) => product.pack_size || product.packaging || "" },
  { key: "subcategory", label: "Subcategory", value: (product) => product.sub_category || "" },
  { key: "category", label: "Category", value: (product) => product.category || "" },
  { key: "channel", label: "Channel", value: (product) => product.sales_channel || "" },
  { key: "quantity", label: "On Hand Qty.", value: (product) => Number(product.on_hand_qty || 0) },
  { key: "status", label: "Status", value: (product) => product.product_status || (product.active === false ? "inactive" : "active") },
  { key: "notes", label: "Notes", value: (product) => product.notes || "" },
  { key: "actions", label: "Actions" }
];

function LockIcon() {
  return (
    <svg className="admin-readonly-lock" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function compareValues(left, right) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
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
  const packToastTimerRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [sort, setSort] = useState({ key: "number", direction: "asc" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [packConfigDirty, setPackConfigDirty] = useState(false);
  const [packToast, setPackToast] = useState("");

  useEffect(() => {
    loadProducts();
  }, [supabase]);

  useEffect(() => {
    document.body.style.overflow = modalOpen || imageModalOpen || deleteProduct ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [deleteProduct, imageModalOpen, modalOpen]);

  useEffect(() => () => clearTimeout(packToastTimerRef.current), []);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    [products]
  );
  const subCategories = useMemo(
    () => [...new Set(products.map((product) => product.sub_category).filter(Boolean))].sort(),
    [products]
  );
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      if (query && ![product.name, product.sku, product.id].some((value) => value?.toLowerCase().includes(query))) return false;
      if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
      if (channelFilter !== "all" && product.sales_channel !== channelFilter) return false;
      const productStatus = product.product_status || (product.active === false ? "inactive" : "active");
      if (statusFilter !== "all" && productStatus !== statusFilter) return false;
      if (featuredFilter === "featured" && !product.featured) return false;
      if (featuredFilter === "not-featured" && product.featured) return false;
      return true;
    });
    const column = TABLE_COLUMNS.find((candidate) => candidate.key === sort.key);
    if (!column?.value) return filtered;
    return [...filtered].sort((left, right) => {
      const result = compareValues(column.value(left), column.value(right));
      return sort.direction === "asc" ? result : -result;
    });
  }, [categoryFilter, channelFilter, featuredFilter, products, search, sort, statusFilter]);

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
    setPackConfigDirty(false);
    setModalOpen(true);
  }

  function openEditProduct(product) {
    setSelectedId(product.id);
    setForm(toFormProduct(product));
    setMessage("");
    setPackConfigDirty(false);
    setModalOpen(true);
  }

  function closeModal() {
    if (isSaving || isUploading) return;
    setImageModalOpen(false);
    setModalOpen(false);
    setSelectedId(null);
    setForm(EMPTY_PRODUCT);
    setPackConfigDirty(false);
  }

  function showPackToast() {
    clearTimeout(packToastTimerRef.current);
    setPackToast("Pack Size Configuration Saved");
    packToastTimerRef.current = setTimeout(() => setPackToast(""), 2800);
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    if (name === "price" && form.weight_options.length) setPackConfigDirty(true);
    setForm((current) => {
      const nextValue = type === "checkbox" ? checked : value;
      if (name !== "price") return { ...current, [name]: nextValue };
      return {
        ...current,
        price: nextValue,
        weight_options: current.weight_options.map((weight) => ({
          ...weight,
          price: weightPrice(nextValue, weight.weight_value)
        }))
      };
    });
  }

  function normalizePrice() {
    setForm((current) => {
      if (current.price === "") return current;
      const value = Number(current.price);
      return Number.isFinite(value) ? { ...current, price: value.toFixed(2) } : current;
    });
  }

  function toggleSort(key) {
    const column = TABLE_COLUMNS.find((candidate) => candidate.key === key);
    if (!column?.value) return;
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  }

  function updateWeight(index, field, value) {
    setPackConfigDirty(true);
    setForm((current) => {
      const weights = current.weight_options.map((weight, weightIndex) =>
        weightIndex === index
          ? {
              ...weight,
              [field]: value,
              ...(field === "weight_value" ? {
                weight_label: value ? formatWeightLabel(value) : "",
                price: weightPrice(current.price, value)
              } : {})
            }
          : weight
      );
      return withWeightInventory(current, weights);
    });
  }

  function updateDisplayField(event) {
    const { name, checked } = event.target;
    setForm((current) => ({
      ...current,
      display_fields: { ...current.display_fields, [name]: checked }
    }));
  }

  function addWeight() {
    setPackConfigDirty(true);
    setForm((current) => withWeightInventory(current, [
      ...current.weight_options,
      { ...EMPTY_WEIGHT, sort_order: current.weight_options.length }
    ]));
  }

  function removeWeight(index) {
    setPackConfigDirty(true);
    setForm((current) => withWeightInventory(
      current,
      current.weight_options.filter((_, weightIndex) => weightIndex !== index)
    ));
  }

  function confirmWeight(index) {
    setPackConfigDirty(true);
    setForm((current) => {
      const weights = current.weight_options.map((weight, weightIndex) =>
        weightIndex === index
          ? {
              ...weight,
              weight_label: weight.weight_value ? formatWeightLabel(weight.weight_value) : "",
              price: weightPrice(current.price, weight.weight_value),
              on_hand_qty: Math.max(0, Math.trunc(Number(weight.on_hand_qty || 0))),
              status: Number(weight.on_hand_qty || 0) > 0 ? "available" : "unavailable"
            }
          : weight
      );
      return withWeightInventory(current, weights);
    });
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setMessage("");
    try {
      const imageUrl = await optimizeImage(file);
      setForm((current) => ({ ...current, image_path: imageUrl }));
      setImageModalOpen(false);
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
      nullableNumber(weight.weight_value) === null || Number(weight.weight_value) <= 0
    );
    if (invalidWeight) {
      setMessage("Every pack size row needs a valid weight.");
      return;
    }

    setIsSaving(true);
    setMessage("Saving product...");

    try {
      const calculatedOnHand = form.weight_options.length
        ? weightInventoryTotal(form.weight_options)
        : Math.max(0, Math.trunc(Number(form.on_hand_qty || 0)));
      const internalId = selectedId || [
        form.sales_channel,
        slugify(cleanString(form.name)),
        slugify(cleanString(form.configuration) || cleanString(form.pack_size)),
        Math.random().toString(36).slice(2, 7)
      ].filter(Boolean).join("-");
      const baseProductKey =
        cleanString(form.base_product_key) ||
        slugify(cleanString(form.name).replace(/\s*\(box\)\s*$/i, ""));
      const parsedMoq = parseMoqText(form.moq_text);
      const payload = {
        id: internalId,
        name: cleanString(form.name),
        category: cleanString(form.category),
        sub_category: cleanString(form.sub_category) || null,
        channels: [form.sales_channel],
        sales_channel: form.sales_channel,
        base_product_key: baseProductKey,
        configuration: cleanString(form.configuration) || null,
        packaging: cleanString(form.packaging) || cleanString(form.pack_size) || null,
        pack_size: cleanString(form.pack_size) || null,
        price: nullableNumber(form.price),
        reseller_price: null,
        slab_price: null,
        kg_per_box: cleanString(form.pack_size) || null,
        moq: parsedMoq.moq,
        moq_unit: parsedMoq.unit,
        on_hand_qty: calculatedOnHand,
        stock: calculatedOnHand > 0 ? "in-stock" : "out-of-stock",
        featured: form.featured,
        default_option: form.default_option,
        notes: cleanString(form.notes) || null,
        description: cleanString(form.description) || null,
        promo: encodeProductDisplaySettings(form.display_fields, form.public_promo),
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
            weight_label: formatWeightLabel(weight.weight_value),
            weight_value: nullableNumber(weight.weight_value),
            price: Number(weightPrice(form.price, weight.weight_value)),
            on_hand_qty: Math.max(0, Math.trunc(Number(weight.on_hand_qty || 0))),
            status: Number(weight.on_hand_qty || 0) > 0 ? "available" : "unavailable",
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
      if (packConfigDirty) showPackToast();
      setPackConfigDirty(false);
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
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a product" />
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
      {packToast ? <div className="admin-pack-toast" role="status"><span>✓</span>{packToast}</div> : null}

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
                  <th
                    aria-sort={sort.key === column.key ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
                    className={`admin-product-col-${column.key}`}
                    key={column.key}
                  >
                    {column.value ? (
                      <button
                        className={`admin-table-sort ${sort.key === column.key ? "is-active" : ""}`}
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        aria-label={`Sort by ${column.label}`}
                      >
                        <span>{column.label}</span>
                        <span aria-hidden="true">{sort.key === column.key ? (sort.direction === "asc" ? "▲" : "▼") : "↕"}</span>
                      </button>
                    ) : column.label}
                  </th>
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
                  <td className={Number(product.on_hand_qty || 0) === 0 ? "admin-zero-stock" : ""}>{product.on_hand_qty ?? 0}</td>
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
              <div><p>{selectedId ? "Edit Product" : "New Product"}</p><h2 id="product-modal-title">{selectedId ? form.name : "Add New Product"}</h2></div>
              <button type="button" onClick={closeModal} aria-label="Close product form">×</button>
            </header>
            <form onSubmit={saveProduct}>
              {message ? <div className="admin-inline-message admin-modal-message">{message}</div> : null}

              <fieldset className="admin-product-form-section">
                <legend>Product Identity</legend>
                <div className="admin-product-identity-layout">
                  <div className="admin-product-identity-image">
                    <img src={form.image_path || "/images/parrilla logo.png"} alt="Product preview" />
                    <button type="button" onClick={() => setImageModalOpen(true)}>Upload an image</button>
                  </div>
                  <div className="admin-product-form-grid admin-product-form-grid-three">
                    <label className="admin-system-field"><span>Product Number <LockIcon /></span><input value={form.sku || "Generated automatically"} disabled /></label>
                    <label><span>Product Name</span><input name="name" value={form.name} onChange={updateField} required /></label>
                    <label><span>Category</span><select name="category" value={form.category} onChange={updateField} required><option value="">Select category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                    <label><span>Sub-Category</span><select name="sub_category" value={form.sub_category} onChange={updateField}><option value="">Select sub-category</option>{subCategories.map((subCategory) => <option key={subCategory}>{subCategory}</option>)}</select></label>
                    <label className="admin-system-field"><span>Channel <LockIcon /></span><input value={displayStatus(form.sales_channel)} disabled /></label>
                    <label><span>Status</span><select name="product_status" value={form.product_status} onChange={updateField}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                    <label className="admin-form-field-wide"><span>Notes</span><textarea name="notes" value={form.notes} onChange={updateField} rows="3" /></label>
                  </div>
                </div>
              </fieldset>

              <fieldset className="admin-product-form-section">
                <legend>Pricing &amp; Inventory</legend>
                <div className="admin-product-form-grid admin-product-form-grid-four">
                  <label><span>Price</span><input type="number" min="0" step="0.01" name="price" value={form.price} onChange={updateField} onBlur={normalizePrice} /></label>
                  <label><span>Pack Size</span><input name="pack_size" value={form.pack_size} onChange={updateField} /></label>
                  <label className={form.weight_options.length ? "admin-system-field" : ""}>
                    <span>On Hand Qty. {form.weight_options.length ? <LockIcon /> : null}</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="on_hand_qty"
                      value={form.on_hand_qty}
                      onChange={updateField}
                      disabled={form.weight_options.length > 0}
                    />
                    {form.weight_options.length ? <small>Calculated from pack size quantities.</small> : null}
                  </label>
                  <label><span>MOQ</span><input name="moq_text" value={form.moq_text} onChange={updateField} placeholder="e.g. 1 pack or 5 kg" /></label>
                </div>

                <div className="admin-pack-config">
                  <div className="admin-weight-heading"><strong>Pack Size Configuration</strong><button className="admin-secondary-action" type="button" onClick={addWeight}>+ Add Weight Row</button></div>
                  <p>Add selectable pack weights. Price is calculated from the base price above.</p>
                {form.weight_options.length ? (
                  <div className="admin-weight-table">
                    <div className="admin-weight-row is-header"><span>Weight (kg)</span><span>Qty.</span><span>Price</span><span>Save</span><span>Delete</span></div>
                    {form.weight_options.map((weight, index) => (
                      <div className="admin-weight-row" key={weight.id || index}>
                        <input type="number" min="0" step="0.001" value={weight.weight_value} onChange={(event) => updateWeight(index, "weight_value", event.target.value)} placeholder="1.2" />
                        <input type="number" min="0" step="1" value={weight.on_hand_qty} onChange={(event) => updateWeight(index, "on_hand_qty", event.target.value)} />
                        <input type="number" value={weightPrice(form.price, weight.weight_value)} readOnly aria-label="Calculated price" />
                        <button className="is-confirm" type="button" onClick={() => confirmWeight(index)} aria-label="Save weight row">✓</button>
                        <button className="is-remove" type="button" onClick={() => removeWeight(index)} aria-label="Remove weight row">×</button>
                      </div>
                    ))}
                  </div>
                ) : <div className="admin-weight-empty">No pack size configurations. The regular Pack Size value will be shown.</div>}
                </div>
              </fieldset>

              <fieldset className="admin-product-form-section">
                <legend>Customer-Facing Details</legend>
                <p className="admin-checklist-help">Checked details are displayed on customer-facing product pages.</p>
                <div className="admin-product-checklist">
                  {["Product Name", "Price", "Pack Size"].map((label) => <label className="is-required" key={label}><input type="checkbox" checked disabled /><span>{label}</span></label>)}
                  <label><input type="checkbox" name="moq" checked={form.display_fields.moq} onChange={updateDisplayField} /><span>MOQ</span></label>
                  <label><input type="checkbox" name="notes" checked={form.display_fields.notes} onChange={updateDisplayField} /><span>Notes</span></label>
                </div>
              </fieldset>

              <div className="admin-modal-toggles">
                <label><input type="checkbox" name="featured" checked={form.featured} onChange={updateField} /><span>Featured Product</span></label>
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

      {imageModalOpen ? (
        <div className="admin-confirm-backdrop admin-image-upload-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !isUploading && setImageModalOpen(false)}>
          <section className="admin-image-upload-modal" role="dialog" aria-modal="true" aria-labelledby="image-upload-title">
            <header>
              <div>
                <h2 id="image-upload-title">Upload Product Image</h2>
                <p>Choose a JPG, PNG, or WebP image up to 8 MB.</p>
              </div>
              <button type="button" onClick={() => !isUploading && setImageModalOpen(false)} aria-label="Close image upload">×</button>
            </header>
            <img src={form.image_path || "/images/parrilla logo.png"} alt="Current product preview" />
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} hidden />
            <div>
              <button className="admin-secondary-action" type="button" onClick={() => setImageModalOpen(false)} disabled={isUploading}>Cancel</button>
              <button className="admin-primary-action" type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>{isUploading ? "Processing..." : "Choose Image"}</button>
            </div>
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
