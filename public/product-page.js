const params = new URLSearchParams(window.location.search);
const productParam = params.get("id") || params.get("sku");
let products = [];
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }

function updateCartCount() {
  const count = document.getElementById("cartCount");
  if (count) count.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getProductByParam(param) {
  return products.find((item) => String(item.id) === String(param) || item.sku === param || item.variants?.some((variant) => variant.sku === param));
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function selectedVariant(product) {
  const sku = document.getElementById("variantSelect")?.value;
  return product.variants?.find((variant) => variant.sku === sku) || product.variants?.[0];
}

function updateSelectedVariant(productId) {
  const product = products.find((item) => Number(item.id) === Number(productId));
  const variant = product && selectedVariant(product);
  if (!variant) return;
  document.getElementById("selectedPrice").textContent = `$${Number(variant.price).toFixed(2)}`;
  document.getElementById("selectedSku").textContent = variant.sku;
  document.getElementById("selectedInventory").textContent = `${Number(variant.inventory).toLocaleString()} available`;
  const image = document.getElementById("productImage");
  if (image && variant.image) image.src = variant.image;
}

function cartItemFrom(product, variant) {
  return { id: product.id, name: product.name, category: product.category, sku: variant.sku,
    option: variant.option || "Standard", price: Number(variant.price), image: variant.image || product.image, quantity: 1 };
}

function addToCart(productId) {
  const product = products.find((item) => Number(item.id) === Number(productId));
  const variant = product && selectedVariant(product);
  if (!product || !variant) return alert("Please choose an available option.");
  const existing = cart.find((item) => item.sku === variant.sku);
  if (existing) existing.quantity += 1;
  else cart.push(cartItemFrom(product, variant));
  saveCart();
  updateCartCount();
  alert("Added to cart!");
}

function buyNow(productId) {
  const product = products.find((item) => Number(item.id) === Number(productId));
  const variant = product && selectedVariant(product);
  if (!product || !variant) return alert("Please choose an available option.");
  cart = [cartItemFrom(product, variant)];
  saveCart();
  checkout();
}

async function checkout() {
  if (!cart.length) return alert("Your cart is empty.");
  try {
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart }) });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.error || "Checkout failed.");
  } catch (error) {
    console.error("Checkout failed:", error);
    alert("Checkout failed.");
  }
}

function getRelatedProducts(currentProduct) {
  return products.filter((item) => item.category === currentProduct.category && item.id !== currentProduct.id).slice(0, 4);
}

function renderProductPage(product) {
  const productPage = document.getElementById("productPage");
  if (!product) {
    productPage.innerHTML = `<section class="product-detail-card"><h1>Product not found</h1><a class="track-link" href="/">Return to Store</a></section>`;
    return;
  }

  const variants = product.variants || [];
  const first = variants[0];
  const related = getRelatedProducts(product);
  productPage.innerHTML = `
    <section class="product-detail-card"><div class="product-detail-grid">
      <div class="product-detail-image-wrap"><img id="productImage" class="product-detail-image" src="${first?.image || product.image}" alt="${escapeHtml(product.name)}" onerror="this.src='/kori-logo.jpeg'"></div>
      <div class="product-detail-info"><span class="badge">${escapeHtml(product.category)}</span><h1>${escapeHtml(product.name)}</h1>
        <p id="selectedPrice" class="product-detail-price">$${Number(first?.price || product.price).toFixed(2)}</p>
        <p class="product-description">${escapeHtml(product.description)}</p>
        <label class="variant-label" for="variantSelect">Choose an option</label>
        <select id="variantSelect" class="variant-select" onchange="updateSelectedVariant(${product.id})">
          ${variants.map((variant) => `<option value="${escapeHtml(variant.sku)}">${escapeHtml(variant.option)} — $${Number(variant.price).toFixed(2)}</option>`).join("")}
        </select>
        <p id="selectedInventory" class="stock">${Number(first?.inventory || 0).toLocaleString()} available</p>
        <div class="product-info-box"><h3>Shipping Estimate</h3><p>${escapeHtml(product.shipping)}</p></div>
        <div class="product-info-box"><h3>What’s Included</h3><ul>${(product.whatsInBox || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
        <div class="product-info-box"><h3>Product Details</h3><p><strong>SKU:</strong> <span id="selectedSku">${escapeHtml(first?.sku)}</span></p><p><strong>Category:</strong> ${escapeHtml(product.category)}</p></div>
        <div class="product-actions"><button onclick="addToCart(${product.id})">Add to Cart</button><button class="buy-now" onclick="buyNow(${product.id})">Buy Now</button></div>
      </div></div></section>
    <section class="related-section"><h2>Related Products</h2><div class="related-products">
      ${related.map((item) => `<div class="related-card"><img src="${item.image}" alt="${escapeHtml(item.name)}" onerror="this.src='/kori-logo.jpeg'"><h3>${escapeHtml(item.name)}</h3><p>From $${Number(item.price).toFixed(2)}</p><a href="/product.html?id=${item.id}">Choose Options</a></div>`).join("")}
    </div></section>`;
}

async function loadProductPage() {
  try {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Products API failed");
    products = await res.json();
    const validSkus = new Set(products.flatMap((product) => (product.variants || []).map((variant) => variant.sku)));
    cart = cart.filter((item) => validSkus.has(item.sku));
    saveCart();
    renderProductPage(getProductByParam(productParam));
    updateCartCount();
  } catch (error) {
    console.error("Product page failed to load:", error);
    document.getElementById("productPage").innerHTML = `<section class="product-detail-card"><h1>Product failed to load</h1><a class="track-link" href="/">Return to Store</a></section>`;
  }
}

loadProductPage();
