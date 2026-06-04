(function () {
  const STORAGE_KEYS = {
    catalog: "parrilla.catalog",
    cart: "parrilla.cart",
    adminSession: "parrilla.adminSession",
    orders: "parrilla.orders"
  };

  const ADMIN_CREDENTIALS = {
    username: "admin01",
    password: "parrilla01"
  };

  const ORDER_RECEIVER = {
    email: "parrillameatshop@gmail.com",
    endpoint: "https://formsubmit.co/ajax/parrillameatshop@gmail.com"
  };

  const peso = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
  });

  function getProducts() {
    const saved = localStorage.getItem(STORAGE_KEYS.catalog);
    if (!saved) return [...PARRILLA_DEFAULT_PRODUCTS];
    try {
      return JSON.parse(saved);
    } catch (error) {
      return [...PARRILLA_DEFAULT_PRODUCTS];
    }
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.catalog, JSON.stringify(products));
  }

  function getCart() {
    const saved = localStorage.getItem(STORAGE_KEYS.cart);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
    updateCartCount();
  }

  function getProduct(id) {
    return getProducts().find((product) => product.id === id);
  }

  function channelPrice(product, channel) {
    if (channel === "reseller" && product.resellerPrice) return product.resellerPrice;
    if (channel === "wholesale") return product.price;
    return product.price;
  }

  function priceLabel(product, channel) {
    const price = channelPrice(product, channel);
    if (!price) return "Contact for price";
    const suffix = channel === "wholesale" ? " / kg" : "";
    return `${peso.format(price)}${suffix}`;
  }

  function displayName(product) {
    return titleCase(product.name || "");
  }

  const productImageRules = [
    ["chicken-leg-quarter", "chicken-leg-quarter.jpg"],
    ["chicken-breast-fillet", "chicken-breast-fillet.jpg"],
    ["chickengizzard", "chicken-gizzard.jpg"],
    ["vibra-whole-chicken", "whole-chicken-variant.jpg"],
    ["dressed-half-chicken", "half-chicken.jpg"],
    ["magnolia-whole-chicken", "whole-chicken.jpg"],
    ["dressed-whole-chicken", "whole-chicken.jpg"],
    ["whole-chicken", "whole-chicken.jpg"],
    ["chicken-liver", "chicken-liver.jpg"],
    ["chicken-gizzard", "chicken-gizzard.jpg"],
    ["half-chicken", "half-chicken.jpg"],
    ["pork-picnic-shoulder", "pork-laman.jpg"],
    ["pork-laman", "pork-laman.jpg"],
    ["pork-belly", "pork-liempo.jpg"],
    ["liempo", "pork-liempo.jpg"],
    ["pork-chop", "pork-chop.jpg"],
    ["pork-spareribs", "pork-spare-ribs.jpg"],
    ["pork-spare-ribs", "pork-spare-ribs.jpg"],
    ["riblets", "pork-riblets.jpg"],
    ["pork-liver", "pork-liver.jpg"],
    ["pork-jowls", "pork-jowl.jpg"],
    ["pork-jowl", "pork-jowl.jpg"],
    ["pork-ear", "pork-ear.jpg"],
    ["pork-mask", "pork-mask.jpg"],
    ["pork-hock-pata-whole-sliced", "pork-hock-combination.jpg"],
    ["pork-pata-front-whole", "pork-hock-whole.jpg"],
    ["pork-hock-whole", "pork-hock-whole.jpg"],
    ["pork-hock-slice", "pork-hock-slice.jpg"],
    ["pork-samgyeopsal", "pork-samgyeopsal.jpg"],
    ["samgyeopsal", "pork-samgyeopsal.jpg"],
    ["ground-pork", "ground-pork.jpg"],
    ["pork-flower-fat", "flower-fat.jpg"],
    ["flower-fat", "flower-fat.jpg"]
  ];

  function productImagePath(product, channel) {
    if (channel === "wholesale") return "images/parrilla logo.png";
    if (product.imagePath && !product.imagePath.includes("parrilla logo.png")) return product.imagePath;
    if (!product.channels?.some((item) => item === "retail" || item === "reseller")) {
      return "images/parrilla logo.png";
    }
    const key = `${product.id || ""} ${product.name || ""}`.toLowerCase();
    const match = productImageRules.find(([needle]) => key.includes(needle));
    return match ? `images/products/${match[1]}` : "images/parrilla logo.png";
  }

  function titleCase(value) {
    const smallWords = new Set(["and", "or", "of", "with", "w", "out", "per"]);
    return String(value)
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .split(" ")
      .map((word, index) => {
        if (!word) return word;
        if (index > 0 && smallWords.has(word)) return word;
        return word
          .split(/([/&()-])/)
          .map((part) => /^[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part)
          .join("");
      })
      .join(" ")
      .replace(/\bUsda\b/g, "USDA")
      .replace(/\bCdo\b/g, "CDO")
      .replace(/\bCj\b/g, "CJ")
      .replace(/\bO' Food\b/g, "O' Food");
  }

  function categoriesFor(products) {
    return [...new Set(products.map((product) => product.category))].sort();
  }

  function subCategoriesFor(products) {
    return [...new Set(products.map((product) => product.subCategory).filter(Boolean))].sort();
  }

  function cartKey(productId, channel) {
    return `${productId}:${channel}`;
  }

  function getCartItem(productId, channel) {
    const key = cartKey(productId, channel);
    return getCart().find((item) => item.key === key);
  }

  function minQtyFor(channel) {
    return channel === "reseller" ? 5 : 1;
  }

  function productCartControl(product, channel) {
    const item = getCartItem(product.id, channel);
    if (!item) {
      return `<button class="btn btn-primary" data-add="${product.id}" data-channel="${channel}">Add to cart</button>`;
    }

    return `
      <div class="card-qty-control" data-card-control="${product.id}" data-channel="${channel}">
        <button type="button" data-card-qty="${item.key}" data-step="-1" aria-label="Decrease quantity">-</button>
        <strong>${item.qty}</strong>
        <button type="button" data-card-qty="${item.key}" data-step="1" aria-label="Increase quantity">+</button>
      </div>
    `;
  }

  function productCard(product, channel) {
    const out = product.stock === "out-of-stock";
    const isWholesale = channel === "wholesale";
    const detailLines = isWholesale
      ? `
          ${product.brand ? `<p class="product-meta"><strong>Brand Name:</strong> ${product.brand}</p>` : ""}
          ${product.kgPerBox ? `<p class="product-meta"><strong>Weight per box:</strong> ${product.kgPerBox}</p>` : ""}
        `
      : `
          <p class="product-meta"><strong>Pack Size:</strong> ${product.packaging || product.packSize || "Pack"}</p>
          ${product.slabPrice ? `<p class="product-meta"><strong>Slab Price:</strong> ${peso.format(product.slabPrice)} / kg</p>` : ""}
        `;

    return `
      <article class="product-card" data-product-card data-name="${escapeAttr(product.name)}" data-category="${escapeAttr(product.category)}" data-sub-category="${escapeAttr(product.subCategory || "")}">
        <div class="product-image">
          <img src="${productImagePath(product, channel)}" alt="">
        </div>
        <div class="product-body">
          <h3>${displayName(product)}</h3>
          <div class="price">
            ${priceLabel(product, channel)}
          </div>
          ${detailLines}
          ${product.promo && product.stock !== "out-of-stock" ? `<p class="product-promo">${product.promo}</p>` : ""}
          <div class="product-actions">
            ${out || !channelPrice(product, channel)
              ? `<button class="btn btn-primary" disabled>${out ? "Out of stock" : "Ask price"}</button>`
              : productCartControl(product, channel)}
            <a class="btn btn-secondary" href="product.html?id=${product.id}&channel=${channel}">Details</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderProducts() {
    const mounts = document.querySelectorAll("[data-product-grid]");
    if (!mounts.length) return;

    mounts.forEach((mount) => {
      const channel = mount.dataset.channel || "retail";
      const featuredOnly = mount.dataset.featured === "true";
      const featuredGroup = mount.dataset.featuredGroup || "";
      const searchParams = new URLSearchParams(location.search);
      const query = (searchParams.get("q") || "").trim().toLowerCase();
      const products = getProducts().filter((product) => {
        const inChannel = product.channels.includes(channel) || channel === "all";
        const isFeatured = !featuredOnly || product.featured;
        const isFeaturedGroup = !featuredGroup || Boolean(product[featuredGroup]);
        const matchesQuery = !query || `${product.name} ${product.category} ${product.subCategory || ""} ${product.description || ""}`.toLowerCase().includes(query);
        return inChannel && isFeatured && isFeaturedGroup && matchesQuery;
      });

      mount.innerHTML = products.length
        ? products.map((product) => productCard(product, channel === "all" ? product.channels[0] : channel)).join("")
        : `<div class="empty-state">No products found.</div>`;

      setupProductFilters(products);
    });
  }

  function setupProductFilters(products) {
    const categorySelect = document.querySelector("[data-category-filter]");
    const subCategorySelect = document.querySelector("[data-sub-category-filter]");
    if (categorySelect && !categorySelect.dataset.ready) {
      categorySelect.innerHTML = `<option value="">All categories</option>${categoriesFor(products).map((category) => `<option>${category}</option>`).join("")}`;
      categorySelect.dataset.ready = "true";
    }
    if (subCategorySelect && !subCategorySelect.dataset.ready) {
      subCategorySelect.innerHTML = `<option value="">All sub-categories</option>${subCategoriesFor(products).map((category) => `<option>${category}</option>`).join("")}`;
      subCategorySelect.dataset.ready = "true";
    }

    const searchInput = document.querySelector("[data-live-search]");
    const apply = () => {
      const term = (searchInput ? searchInput.value : "").toLowerCase();
      const category = categorySelect ? categorySelect.value : "";
      const subCategory = subCategorySelect ? subCategorySelect.value : "";
      document.querySelectorAll("[data-product-card]").forEach((card) => {
        const matchesTerm = !term || card.dataset.name.toLowerCase().includes(term);
        const matchesCategory = !category || card.dataset.category === category;
        const matchesSubCategory = !subCategory || card.dataset.subCategory === subCategory;
        card.style.display = matchesTerm && matchesCategory && matchesSubCategory ? "" : "none";
      });
    };

    if (searchInput && !searchInput.dataset.ready) {
      searchInput.addEventListener("input", apply);
      searchInput.dataset.ready = "true";
    }
    if (categorySelect && !categorySelect.dataset.filterReady) {
      categorySelect.addEventListener("change", apply);
      categorySelect.dataset.filterReady = "true";
    }
    if (subCategorySelect && !subCategorySelect.dataset.filterReady) {
      subCategorySelect.addEventListener("change", apply);
      subCategorySelect.dataset.filterReady = "true";
    }
  }

  function setupSearchForm() {
    document.querySelectorAll("[data-search-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const field = form.querySelector("input");
        location.href = `search.html?q=${encodeURIComponent(field.value.trim())}`;
      });
    });

    const searchField = document.querySelector("[data-search-query]");
    if (searchField) {
      const query = new URLSearchParams(location.search).get("q") || "";
      searchField.value = query;
      const title = document.querySelector("[data-search-title]");
      if (title) title.textContent = query ? `Search results for "${query}"` : "Search the catalog";
    }
  }

  function addToCart(productId, channel) {
    const product = getProduct(productId);
    if (!product) return;
    const cart = getCart();
    const key = cartKey(productId, channel);
    const existing = cart.find((item) => item.key === key);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        key,
        productId,
        channel,
        qty: minQtyFor(channel),
        price: channelPrice(product, channel)
      });
    }
    saveCart(cart);
  }

  function updateCartQuantity(key, step) {
    let cart = getCart();
    cart = cart.flatMap((item) => {
      if (item.key !== key) return item;
      const minQty = minQtyFor(item.channel);
      if (item.channel !== "reseller" && step < 0 && item.qty <= minQty) return [];
      return { ...item, qty: Math.max(minQty, item.qty + step) };
    });
    saveCart(cart);
  }

  function refreshProductControls() {
    document.querySelectorAll("[data-product-card]").forEach((card) => {
      const addButton = card.querySelector("[data-add]");
      const control = card.querySelector("[data-card-control]");
      const productId = addButton?.dataset.add || control?.dataset.cardControl;
      const channel = addButton?.dataset.channel || control?.dataset.channel;
      const product = productId ? getProduct(productId) : null;
      if (!product || !channel) return;
      const actions = card.querySelector(".product-actions");
      const details = actions?.querySelector('a[href^="product.html"]')?.outerHTML || "";
      if (actions) {
        actions.innerHTML = `${productCartControl(product, channel)}${details}`;
      }
    });
  }

  function setupCartButtons() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-add]");
      const qtyButton = event.target.closest("[data-card-qty]");
      if (button) {
        addToCart(button.dataset.add, button.dataset.channel || "retail");
        refreshProductControls();
      }
      if (qtyButton) {
        updateCartQuantity(qtyButton.dataset.cardQty, Number(qtyButton.dataset.step));
        refreshProductControls();
        renderCart();
        renderCartSummary();
      }
    });
  }

  function updateCartCount() {
    const total = getCart().reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = total;
    });
  }

  function renderCart() {
    const mount = document.querySelector("[data-cart-list]");
    if (!mount) return;
    const products = getProducts();
    const cart = getCart();
    const rows = cart.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return "";
      return `
        <div class="cart-row">
          <div class="cart-thumb"><img src="images/parrilla logo.png" alt=""></div>
          <div>
            <strong>${displayName(product)}</strong>
            <p class="muted">${item.channel}${item.channel === "reseller" ? " / minimum 5 packs" : ""} / ${product.packaging || "pack"}</p>
          </div>
          <div class="qty-control">
            <button data-qty="${item.key}" data-step="-1">-</button>
            <strong>${item.qty}</strong>
            <button data-qty="${item.key}" data-step="1">+</button>
          </div>
          <div class="price">${item.channel === "wholesale" ? "Quote required" : peso.format(item.price * item.qty)}</div>
          <button class="icon-btn" title="Remove" data-remove="${item.key}">x</button>
        </div>
      `;
    }).join("");

    mount.innerHTML = rows || `<div class="empty-state">Your cart is empty.</div>`;
    renderCartSummary();
  }

  function renderCartSummary() {
    const mount = document.querySelector("[data-cart-summary]");
    if (!mount) return;
    const cart = getCart();
    const hasWholesale = cart.some((item) => item.channel === "wholesale");
    const subtotal = cart
      .filter((item) => item.channel !== "wholesale")
      .reduce((sum, item) => sum + item.price * item.qty, 0);

    if (hasWholesale) {
      const exactRows = subtotal > 0
        ? `<div class="summary-line"><span>Retail/Reseller subtotal</span><strong>${peso.format(subtotal)}</strong></div>`
        : "";
      mount.innerHTML = `
        ${exactRows}
        <div class="summary-line"><span>Wholesale items</span><strong>Quote required</strong></div>
        <div class="notice quote-notice">Wholesale box orders are submitted as a quote request. Parrilla Meat Shop will confirm actual box weight, availability, and final price before payment.</div>
      `;
      return;
    }

    mount.innerHTML = `
      <div class="summary-line"><span>Subtotal</span><strong>${peso.format(subtotal)}</strong></div>
      <div class="summary-line"><span>Delivery</span><strong>To confirm</strong></div>
      <div class="summary-line"><span>Total</span><strong>${peso.format(subtotal)}</strong></div>
    `;
  }

  function setupCartPage() {
    document.addEventListener("click", (event) => {
      const qtyButton = event.target.closest("[data-qty]");
      const removeButton = event.target.closest("[data-remove]");
      if (!qtyButton && !removeButton) return;

      let cart = getCart();
      if (qtyButton) {
        const key = qtyButton.dataset.qty;
        const step = Number(qtyButton.dataset.step);
        cart = cart.flatMap((item) => {
          if (item.key !== key) return item;
          const minQty = minQtyFor(item.channel);
          if (item.channel !== "reseller" && step < 0 && item.qty <= minQty) return [];
          return { ...item, qty: Math.max(minQty, item.qty + step) };
        });
      }
      if (removeButton) {
        cart = cart.filter((item) => item.key !== removeButton.dataset.remove);
      }
      saveCart(cart);
      renderCart();
    });
  }

  function renderProductDetail() {
    const mount = document.querySelector("[data-product-detail]");
    if (!mount) return;
    const params = new URLSearchParams(location.search);
    const product = getProduct(params.get("id"));
    const channel = params.get("channel") || product?.channels[0] || "retail";

    if (!product) {
      mount.innerHTML = `<div class="empty-state">Product not found.</div>`;
      return;
    }

    mount.innerHTML = `
      <div class="product-image"><img src="${productImagePath(product, channel)}" alt=""></div>
      <div class="panel">
        <p class="eyebrow">${product.category}${product.subCategory ? ` / ${product.subCategory}` : ""}</p>
        <h1>${displayName(product)}</h1>
        <div class="price">${priceLabel(product, channel)}</div>
        ${channel === "wholesale" ? `
          ${product.brand ? `<p class="product-meta"><strong>Brand Name:</strong> ${product.brand}</p>` : ""}
          ${product.kgPerBox ? `<p class="product-meta"><strong>Weight per box:</strong> ${product.kgPerBox}</p>` : ""}
        ` : `
          <p class="product-meta"><strong>Pack Size:</strong> ${product.packaging || product.packSize || "Pack"}</p>
          ${product.slabPrice ? `<p class="product-meta"><strong>Slab Price:</strong> ${peso.format(product.slabPrice)} / kg</p>` : ""}
        `}
        <p>${product.description || ""}</p>
        <div class="product-actions">
          <button class="btn btn-primary" data-add="${product.id}" data-channel="${channel}" ${product.stock === "out-of-stock" || !channelPrice(product, channel) ? "disabled" : ""}>${product.stock === "out-of-stock" ? "Out of stock" : !channelPrice(product, channel) ? "Ask price" : "Add to cart"}</button>
          <a class="btn btn-secondary" href="contact.html">Ask about bulk orders</a>
        </div>
      </div>
    `;
  }

  function setupCheckout() {
    const form = document.querySelector("[data-checkout-form]");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const cart = getCart();
      const order = document.querySelector("[data-order-confirmation]");

      if (!cart.length) {
        if (order) {
          order.innerHTML = `<div class="notice">Your cart is empty. Add products before submitting an order request.</div>`;
        }
        return;
      }

      const invalidResellerItem = cart.find((item) => item.channel === "reseller" && item.qty < 5);
      if (invalidResellerItem) {
        if (order) {
          order.innerHTML = `<div class="notice">Reseller orders require a minimum quantity of 5 per item.</div>`;
        }
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      const data = new FormData(form);
      const orderRecord = createOrderRecord(cart, data);
      saveReceivedOrder(orderRecord);
      const message = buildOrderMessage(cart, data);
      const subject = "Parrilla Meat Shop Order Request";

      if (order) {
        order.innerHTML = `<div class="notice">Sending order request to Parrilla Meat Shop...</div>`;
      }
      if (submitButton) submitButton.disabled = true;

      try {
        await submitOrderRequest(data, message, subject);
        if (order) {
          order.innerHTML = `<div class="notice">Order request sent to Parrilla Meat Shop. Staff will confirm availability, wholesale weight/final price when applicable, delivery schedule, and payment details.</div>`;
        }
        localStorage.removeItem(STORAGE_KEYS.cart);
        updateCartCount();
        renderCartSummary();
        form.reset();
      } catch (error) {
        const encodedMessage = encodeURIComponent(message);
        const encodedSubject = encodeURIComponent(subject);
        if (order) {
          order.innerHTML = `
            <div class="notice">The order request could not be sent automatically. Please send it to Parrilla's Gmail so the staff can receive the alert and prepare the order.</div>
            <div class="order-route-actions">
              <a class="btn btn-primary" href="mailto:${ORDER_RECEIVER.email}?subject=${encodedSubject}&body=${encodedMessage}">Send to Gmail</a>
            </div>
            <textarea class="textarea order-message" readonly>${escapeHtml(message)}</textarea>
          `;
        }
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  async function submitOrderRequest(data, message, subject) {
    const response = await fetch(ORDER_RECEIVER.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        _subject: subject,
        _template: "table",
        _captcha: "false",
        name: data.get("customerName") || "",
        phone: data.get("customerPhone") || "",
        email: data.get("customerEmail") || "",
        fulfillment: data.get("fulfillment") || "",
        message
      })
    });

    if (!response.ok) {
      throw new Error("Order request delivery failed.");
    }

    return response.json();
  }

  function buildOrderMessage(cart, data) {
    const products = getProducts();
    const lines = cart.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return "";
      const amount = item.channel === "wholesale" ? "Quote required" : peso.format(item.price * item.qty);
      return `- ${displayName(product)} | ${item.channel} | Qty: ${item.qty} | ${product.packaging || "Pack"} | ${amount}`;
    }).filter(Boolean);

    return [
      "Parrilla Meat Shop Order Request",
      "",
      `Name: ${data.get("customerName") || ""}`,
      `Phone: ${data.get("customerPhone") || ""}`,
      `Email: ${data.get("customerEmail") || ""}`,
      `Fulfillment: ${data.get("fulfillment") || ""}`,
      "",
      "Items:",
      lines.join("\n") || "- No items",
      "",
      `Notes: ${data.get("orderNotes") || ""}`,
      "",
      "Please confirm availability, final pricing, and payment details."
    ].join("\n");
  }

  function getOrders() {
    const saved = localStorage.getItem(STORAGE_KEYS.orders);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch (error) {
      return [];
    }
  }

  function saveOrders(orders) {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
  }

  function saveReceivedOrder(order) {
    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);
  }

  function createOrderRecord(cart, data) {
    const products = getProducts();
    const items = cart.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      return {
        productId: item.productId,
        name: product ? displayName(product) : item.productId,
        channel: item.channel,
        qty: item.qty,
        packaging: product?.packaging || "Pack",
        unitPrice: item.price || 0,
        amount: item.channel === "wholesale" ? null : (item.price || 0) * item.qty,
        availability: "pending",
        actualWeight: "",
        finalPrice: item.channel === "wholesale" ? "" : String((item.price || 0) * item.qty)
      };
    });

    return {
      id: `PMS-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      customerName: data.get("customerName") || "",
      customerPhone: data.get("customerPhone") || "",
      customerEmail: data.get("customerEmail") || "",
      fulfillment: data.get("fulfillment") || "",
      notes: data.get("orderNotes") || "",
      items
    };
  }

  function setupContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const confirmation = document.querySelector("[data-contact-confirmation]");
      if (confirmation) {
        confirmation.innerHTML = `<div class="notice">Inquiry received. The shop can follow up to confirm product availability and order details.</div>`;
      }
      form.reset();
    });
  }

  function renderAdmin() {
    const mount = document.querySelector("[data-admin-table]");
    if (!mount) return;
    const products = getProducts();
    mount.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Product</th><th>Category</th><th>Sub-category</th><th>Channels</th><th>Pack</th><th>Price</th><th>Reseller</th><th>Promo</th><th></th>
          </tr>
        </thead>
        <tbody>
          ${products.map((product) => `
            <tr>
              <td><strong>${product.name}</strong><br><span class="muted">${product.brand || product.stock}</span></td>
              <td>${product.category}</td>
              <td>${product.subCategory || "-"}</td>
              <td>${product.channels.join(", ")}</td>
              <td>${product.packaging || ""}</td>
              <td>${peso.format(product.price || 0)}</td>
              <td>${product.resellerPrice ? peso.format(product.resellerPrice) : "-"}</td>
              <td>${product.promo || "-"}</td>
              <td><button class="btn btn-secondary" data-edit="${product.id}">Edit</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  function renderAdminOrders() {
    const mount = document.querySelector("[data-admin-orders]");
    if (!mount) return;
    const orders = getOrders();
    if (!orders.length) {
      mount.innerHTML = `<div class="empty-state">No orders received yet.</div>`;
      return;
    }

    mount.innerHTML = orders.map((order) => {
      const created = new Date(order.createdAt).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short"
      });
      const total = order.items
        .filter((item) => item.amount !== null)
        .reduce((sum, item) => sum + Number(item.finalPrice || item.amount || 0), 0);
      const hasWholesale = order.items.some((item) => item.channel === "wholesale");
      return `
        <form class="order-card" data-order-card="${order.id}">
          <div class="order-card-head">
            <div>
              <p class="eyebrow">${order.id}</p>
              <h3>${escapeHtml(order.customerName || "Customer")}</h3>
              <p class="muted">${created} / ${escapeHtml(order.fulfillment || "Pickup")}</p>
            </div>
            <span class="status-pill ${order.status === "completed" ? "is-complete" : ""}">${order.status}</span>
          </div>
          <div class="order-contact">
            <span>${escapeHtml(order.customerPhone || "No phone")}</span>
            <span>${escapeHtml(order.customerEmail || "No email")}</span>
          </div>
          <div class="order-items">
            ${order.items.map((item, index) => `
              <div class="order-item">
                <div>
                  <strong>${escapeHtml(item.name)}</strong>
                  <p class="muted">${item.channel} / Qty ${item.qty} / ${escapeHtml(item.packaging)}</p>
                </div>
                <select class="select" name="availability-${index}">
                  ${["pending", "available", "out-of-stock"].map((status) => `<option value="${status}" ${item.availability === status ? "selected" : ""}>${titleCase(status.replace(/-/g, " "))}</option>`).join("")}
                </select>
                <input class="field" name="weight-${index}" value="${escapeAttr(item.actualWeight || "")}" placeholder="${item.channel === "wholesale" ? "Actual weight" : "Weight/notes"}">
                <input class="field" name="price-${index}" value="${escapeAttr(item.finalPrice || "")}" placeholder="Final price">
              </div>
            `).join("")}
          </div>
          <textarea class="textarea" name="staffNotes" placeholder="Staff notes">${escapeHtml(order.staffNotes || "")}</textarea>
          <div class="summary-line"><span>${hasWholesale ? "Confirmed retail/reseller subtotal" : "Confirmed total"}</span><strong>${peso.format(total)}</strong></div>
          ${hasWholesale ? `<p class="muted">Wholesale final price depends on confirmed box weight and staff input above.</p>` : ""}
          <div class="admin-actions">
            <button class="btn btn-secondary" type="button" data-save-order="${order.id}">Save progress</button>
            <button class="btn btn-primary" type="button" data-finish-order="${order.id}">Finish and notify customer</button>
          </div>
          <div data-order-status="${order.id}"></div>
        </form>
      `;
    }).join("");
  }

  function fillAdminForm(product) {
    const form = document.querySelector("[data-admin-form]");
    if (!form) return;
    form.elements.id.value = product?.id || "";
    form.elements.name.value = product?.name || "";
    form.elements.category.value = product?.category || "Chicken";
    form.elements.subCategory.value = product?.subCategory || "";
    form.elements.channels.value = product?.channels?.join(", ") || "retail";
    form.elements.packaging.value = product?.packaging || "";
    form.elements.brand.value = product?.brand || "";
    form.elements.price.value = product?.price || "";
    form.elements.resellerPrice.value = product?.resellerPrice || "";
    form.elements.slabPrice.value = product?.slabPrice || "";
    form.elements.kgPerBox.value = product?.kgPerBox || "";
    form.elements.stock.value = product?.stock || "in-stock";
    form.elements.promo.value = product?.promo || "";
    form.elements.featured.checked = Boolean(product?.featured);
    form.elements.homeRetailFeatured.checked = Boolean(product?.homeRetailFeatured);
    form.elements.homeWholesaleFeatured.checked = Boolean(product?.homeWholesaleFeatured);
    form.elements.description.value = product?.description || "";
  }

  function setupAdmin() {
    const form = document.querySelector("[data-admin-form]");
    const login = document.querySelector("[data-admin-login]");
    const adminContent = document.querySelector("[data-admin-content]");
    if (!login && !adminContent && !form) return;

    function updateAdminAccess() {
      const isLoggedIn = sessionStorage.getItem(STORAGE_KEYS.adminSession) === "true";
      if (login) login.hidden = isLoggedIn;
      if (adminContent) adminContent.hidden = !isLoggedIn;
      if (isLoggedIn) {
        renderAdmin();
        fillAdminForm(null);
        renderAdminOrders();
      }
    }

    if (login) {
      const passwordToggle = login.querySelector("[data-toggle-password]");
      const passwordInput = login.querySelector('input[name="password"]');
      if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener("click", () => {
          const visible = passwordInput.type === "text";
          passwordInput.type = visible ? "password" : "text";
          passwordToggle.textContent = visible ? "Show" : "Hide";
        });
      }

      login.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(login);
        const valid = data.get("username") === ADMIN_CREDENTIALS.username && data.get("password") === ADMIN_CREDENTIALS.password;
        const message = document.querySelector("[data-admin-login-message]");
        if (!valid) {
          if (message) message.textContent = "Invalid username or password.";
          return;
        }
        sessionStorage.setItem(STORAGE_KEYS.adminSession, "true");
        if (message) message.textContent = "";
        updateAdminAccess();
      });
    }

    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-admin-logout]")) {
        sessionStorage.removeItem(STORAGE_KEYS.adminSession);
        updateAdminAccess();
      }
      const edit = event.target.closest("[data-edit]");
      if (edit) fillAdminForm(getProduct(edit.dataset.edit));
      if (event.target.closest("[data-new-product]")) fillAdminForm(null);
      if (event.target.closest("[data-reset-catalog]")) {
        localStorage.removeItem(STORAGE_KEYS.catalog);
        renderAdmin();
        fillAdminForm(null);
      }
      if (event.target.closest("[data-export-catalog]")) {
        const blob = new Blob([JSON.stringify(getProducts(), null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "parrilla-products.json";
        link.click();
      }
      const saveOrder = event.target.closest("[data-save-order]");
      if (saveOrder) {
        updateOrderFromForm(saveOrder.dataset.saveOrder, false);
      }
      const finishOrder = event.target.closest("[data-finish-order]");
      if (finishOrder) {
        updateOrderFromForm(finishOrder.dataset.finishOrder, true);
      }
    });

    if (form) form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const id = data.get("id") || slugify(data.get("name"));
      const product = {
        id,
        name: data.get("name").trim(),
        category: data.get("category").trim(),
        subCategory: data.get("subCategory").trim(),
        channels: data.get("channels").split(",").map((channel) => channel.trim()).filter(Boolean),
        packaging: data.get("packaging").trim(),
        packSize: data.get("packaging").trim(),
        brand: data.get("brand").trim(),
        price: Number(data.get("price")) || 0,
        resellerPrice: Number(data.get("resellerPrice")) || null,
        slabPrice: Number(data.get("slabPrice")) || null,
        kgPerBox: data.get("kgPerBox").trim(),
        stock: data.get("stock"),
        promo: data.get("promo").trim(),
        featured: form.elements.featured.checked,
        homeRetailFeatured: form.elements.homeRetailFeatured.checked,
        homeWholesaleFeatured: form.elements.homeWholesaleFeatured.checked,
        description: data.get("description").trim()
      };

      const products = getProducts();
      const index = products.findIndex((item) => item.id === id);
      if (index >= 0) {
        products[index] = product;
      } else {
        products.push(product);
      }
      saveProducts(products);
      renderAdmin();
      fillAdminForm(product);
    });

    updateAdminAccess();
  }

  function updateOrderFromForm(orderId, complete) {
    const card = document.querySelector(`[data-order-card="${orderId}"]`);
    if (!card) return;
    const data = new FormData(card);
    const orders = getOrders();
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;

    order.items = order.items.map((item, index) => ({
      ...item,
      availability: data.get(`availability-${index}`) || item.availability,
      actualWeight: data.get(`weight-${index}`) || "",
      finalPrice: data.get(`price-${index}`) || ""
    }));
    order.staffNotes = data.get("staffNotes") || "";
    order.status = complete ? "completed" : "processing";
    order.updatedAt = new Date().toISOString();
    saveOrders(orders);

    renderAdminOrders();
    const status = document.querySelector(`[data-order-status="${orderId}"]`);
    if (status) {
      if (complete) {
        status.innerHTML = notificationActions(order);
      } else {
        status.innerHTML = `<div class="notice">Order progress saved.</div>`;
      }
    }
  }

  function notificationActions(order) {
    const message = buildCustomerNotification(order);
    const encodedMessage = encodeURIComponent(message);
    const encodedSubject = encodeURIComponent(`Parrilla Meat Shop order ${order.id}`);
    const emailAction = order.customerEmail
      ? `<a class="btn btn-primary" href="mailto:${escapeAttr(order.customerEmail)}?subject=${encodedSubject}&body=${encodedMessage}">Email customer</a>`
      : "";
    const smsAction = order.customerPhone
      ? `<a class="btn btn-secondary" href="sms:${escapeAttr(order.customerPhone)}?&body=${encodedMessage}">Text customer</a>`
      : "";

    return `
      <div class="notice">Order finalized. Use the notification buttons below to send the customer their processed order update.</div>
      <div class="order-route-actions">${emailAction}${smsAction}</div>
      <textarea class="textarea order-message" readonly>${escapeHtml(message)}</textarea>
    `;
  }

  function buildCustomerNotification(order) {
    const unavailable = order.items.filter((item) => item.availability === "out-of-stock");
    const available = order.items.filter((item) => item.availability !== "out-of-stock");
    const lines = available.map((item) => {
      const weight = item.actualWeight ? ` | Weight: ${item.actualWeight}` : "";
      const price = item.finalPrice ? ` | Final price: ${peso.format(Number(item.finalPrice) || 0)}` : "";
      return `- ${item.name} | Qty: ${item.qty}${weight}${price}`;
    });
    const unavailableLines = unavailable.map((item) => `- ${item.name} | Qty: ${item.qty}`);

    return [
      `Hi ${order.customerName || "there"},`,
      "",
      `Your Parrilla Meat Shop order ${order.id} has been processed.`,
      `Status: Ready for ${String(order.fulfillment || "pickup").toLowerCase()}.`,
      "",
      "Confirmed items:",
      lines.join("\n") || "- No confirmed items",
      unavailableLines.length ? "\nOut of stock items:\n" + unavailableLines.join("\n") : "",
      "",
      "Please wait for staff payment and schedule instructions before completing payment.",
      "Thank you."
    ].filter(Boolean).join("\n");
  }

  function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function escapeAttr(value) {
    return String(value).replace(/"/g, "&quot;");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setActiveNav() {
    const path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".main-nav a").forEach((link) => {
      if (link.getAttribute("href") === path) link.classList.add("active");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setActiveNav();
    updateCartCount();
    setupSearchForm();
    setupCartButtons();
    setupCartPage();
    setupCheckout();
    setupContactForm();
    renderProducts();
    renderCart();
    renderProductDetail();
    setupAdmin();
  });
})();
