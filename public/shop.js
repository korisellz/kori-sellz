let products = [];
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

const categoryBadges = {
  "Phone Cases": "Spooky Style",
  Beauty: "Beauty Pick",
  Costumes: "Costume Pick",
  "Pet Costumes": "Pet Pick",
  Decor: "Decor Pick"
};

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function priceLabel(product) {
  const minimum = Number(product.price || 0);
  const maximum = Number(product.maxPrice || minimum);
  return maximum > minimum ? `From $${minimum.toFixed(2)}` : `$${minimum.toFixed(2)}`;
}

function getProductBadge(product) {
  return categoryBadges[product.category] || "Halloween Pick";
}

async function loadProducts() {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = `<div class="card"><h2>Loading products...</h2><p>Please wait while Kori Sellz loads.</p></div>`;

  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Products API failed");

  products = (await res.json()).map((product) => ({
    ...product,
    inventory: (product.variants || []).reduce((sum, variant) => sum + Number(variant.inventory || 0), 0),
    badge: getProductBadge(product)
  }));

  const validSkus = new Set(products.flatMap((product) => (product.variants || []).map((variant) => variant.sku)));
  cart = cart.filter((item) => validSkus.has(item.sku));
  saveCart();

  renderProducts();
  renderFeaturedProducts();
  renderCart();
}

function renderProducts() {
  const search = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const category = document.getElementById("categoryFilter")?.value || "All";
  const productsContainer = document.getElementById("products");
  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(search) && (category === "All" || product.category === category)
  );

  if (!filtered.length) {
    productsContainer.innerHTML = `<div class="card"><h2>No products found</h2><p>Try another search or category.</p></div>`;
    return;
  }

  productsContainer.innerHTML = filtered.map((product) => {
    const hasOptions = (product.variants || []).length > 1;
    return `
      <div class="card">
        <div class="badge-row"><span class="badge">${product.category}</span><span class="product-badge">${product.badge}</span></div>
        <img src="${product.image}" alt="${product.name}" onerror="this.src='/kori-logo.jpeg'">
        <h2>${product.name}</h2>
        <p class="stock">In stock with supplier</p>
        <p class="price">${priceLabel(product)}</p>
        <a class="details-btn" href="/product.html?id=${product.id}">${hasOptions ? "Choose Options" : "View Details"}</a>
        ${hasOptions ? "" : `<button onclick="addToCart(${product.id})">Add to Cart</button><button class="buy-now" onclick="buyNow(${product.id})">Buy Now</button>`}
      </div>`;
  }).join("");
}

function setCategory(category, button) {
  document.getElementById("categoryFilter").value = category;
  document.querySelectorAll(".category-btn").forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");
  renderProducts();
}

function cartItemFrom(product, variant) {
  return { id: product.id, name: product.name, category: product.category, sku: variant.sku,
    option: variant.option || "Standard", price: Number(variant.price), image: variant.image || product.image, quantity: 1 };
}

function addToCart(productId, variantSku) {
  const product = products.find((entry) => Number(entry.id) === Number(productId));
  if (!product) return alert("Product not found.");
  const variants = product.variants || [];
  if (variants.length > 1 && !variantSku) {
    window.location.href = `/product.html?id=${product.id}`;
    return;
  }
  const variant = variants.find((entry) => entry.sku === variantSku) || variants[0];
  if (!variant) return alert("This product is currently unavailable.");
  const existing = cart.find((item) => item.sku === variant.sku);
  if (existing) existing.quantity += 1;
  else cart.push(cartItemFrom(product, variant));
  saveCart();
  renderCart();
}

function buyNow(productId) {
  const product = products.find((entry) => Number(entry.id) === Number(productId));
  if (!product) return alert("Product not found.");
  if ((product.variants || []).length > 1) {
    window.location.href = `/product.html?id=${product.id}`;
    return;
  }
  cart = [];
  addToCart(productId);
  checkout();
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartItems || !cartCount || !cartTotal) return;
  cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (!cart.length) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = "$0.00";
    return;
  }
  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item"><strong>${item.name}</strong>
      <p>${item.option && item.option !== "Standard" ? item.option : ""}</p><p>$${Number(item.price).toFixed(2)}</p>
      <div class="qty-controls"><button onclick="changeQty(${index}, -1)">-</button><span>${item.quantity}</span><button onclick="changeQty(${index}, 1)">+</button></div>
      <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
    </div>`).join("");
  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  cartTotal.textContent = `Total: $${total.toFixed(2)}`;
}

function changeQty(index, amount) {
  if (!cart[index]) return;
  cart[index].quantity += amount;
  if (cart[index].quantity <= 0) cart.splice(index, 1);
  saveCart();
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function toggleCart() {
  document.getElementById("cartPanel")?.classList.toggle("open");
}

async function checkout() {
  if (!cart.length) return alert("Your cart is empty");
  try {
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart }) });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.error || "Checkout failed");
  } catch (error) {
    console.error("Checkout failed:", error);
    alert("Checkout failed. Please try again.");
  }
}

function renderFeaturedProducts() {
  const featured = products.filter((product) => [1, 11, 21, 31, 41].includes(Number(product.id)));
  const featuredBox = document.getElementById("featuredProducts");
  if (!featuredBox) return;
  featuredBox.innerHTML = featured.map((product) => `
    <div class="featured-card"><img src="${product.image}" alt="${product.name}" onerror="this.src='/kori-logo.jpeg'">
      <div><span class="badge">FEATURED</span><h3>${product.name}</h3><p class="price">${priceLabel(product)}</p>
      <a class="details-btn" href="/product.html?id=${product.id}">Choose Options</a></div>
    </div>`).join("");
}

loadProducts().catch((error) => {
  console.error("Products failed to load:", error);
  document.getElementById("products").innerHTML = `<div class="card"><h2>Products are temporarily unavailable</h2><p>Please refresh and try again.</p></div>`;
});
