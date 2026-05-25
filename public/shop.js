let products = [];
let cart = [];

function getProductBadge(productId) {
  const badges = {
    1: "Best Seller",
    2: "Popular",
    3: "Best Seller",
    4: "New Arrival",
    5: "Creator Pick",
    6: "Sale",
    7: "Home Favorite",
    8: "Security Pick",
    9: "Beauty Find",
    10: "Low Price"
  };

  return badges[productId] || "Trending";
}

async function loadProducts() {
  const productsContainer = document.getElementById("products");

  productsContainer.innerHTML = `
    <div class="card">
      <h2>Loading products...</h2>
      <p>Please wait while Kori Sellz loads.</p>
    </div>
  `;

  const res = await fetch("/api/products");

  if (!res.ok) {
    throw new Error("Products API failed");
  }

  products = await res.json();

  products = products.map((product) => ({
    ...product,
    category: product.category || "Tech Accessories",
    rating: 4.8,
    reviews: Math.floor(Math.random() * 300) + 50,
    inventory: Math.floor(Math.random() * 20) + 5,
    badge: getProductBadge(product.id)
  }));

  renderProducts();
}

function renderProducts() {
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const productsContainer = document.getElementById("products");

  const search = searchInput ? searchInput.value.toLowerCase() : "";
  const category = categoryFilter ? categoryFilter.value : "All";

  const filtered = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search);
    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  if (filtered.length === 0) {
    productsContainer.innerHTML = `
      <div class="card">
        <h2>No products found</h2>
        <p>Try another search or category.</p>
      </div>
    `;
    return;
  }

  productsContainer.innerHTML = filtered
    .map(
      (product) => `
        <div class="card">
          <div class="badge-row">
            <span class="badge">${product.category}</span>
            <span class="product-badge">${product.badge}</span>
          </div>

         <img 
  src="${product.image}" 
  alt="${product.name}" 
  loading="lazy"
  onerror="this.src='/kori-logo.jpeg'"
>

          <h2>${product.name}</h2>

          <div class="rating">★★★★★</div>

          <p>${product.rating} rating • ${product.reviews} reviews</p>

          <p class="stock">Only ${product.inventory} left in stock</p>

          <p class="price">$${product.price.toFixed(2)}</p>

          <a class="details-btn" href="/product.html?id=${product.id}">View Details</a>

          <button onclick="addToCart(${product.id})">Add to Cart</button>

          <button class="buy-now" onclick="buyNow(${product.id})">Buy Now</button>
        </div>
      `
    )
    .join("");
}

function setCategory(category, button) {
  document.getElementById("categoryFilter").value = category;

  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  button.classList.add("active");

  renderProducts();
}

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);

  if (!product) {
    alert("Product not found.");
    return;
  }

  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  renderCart();
}

function buyNow(productId) {
  const product = products.find((p) => p.id === productId);

  if (!product) {
    alert("Product not found.");
    return;
  }

  cart = [{ ...product, quantity: 1 }];
  renderCart();
  checkout();
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");

  cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = "$0.00";
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <strong>${item.name}</strong>
          <p>$${item.price.toFixed(2)}</p>

          <div class="qty-controls">
            <button onclick="changeQty(${item.id}, -1)">-</button>
            <span>${item.quantity}</span>
            <button onclick="changeQty(${item.id}, 1)">+</button>
          </div>

          <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
        </div>
      `
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = `Total: $${total.toFixed(2)}`;
}

function changeQty(productId, amount) {
  const item = cart.find((i) => i.id === productId);

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  renderCart();
}

function toggleCart() {
  document.getElementById("cartPanel").classList.toggle("open");
}

async function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty");
    return;
  }

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ items: cart })
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Checkout failed");
    }
  } catch (error) {
    console.error("Checkout failed:", error);
    alert("Checkout failed. Please try again.");
  }
}

loadProducts().catch((error) => {
  console.error("Products failed to load:", error);

  document.getElementById("products").innerHTML = `
    <div class="card">
      <h2>Products failed to load</h2>
      <p>Please refresh the page or try again soon.</p>
    </div>
  `;
});