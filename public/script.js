let products = [];
let cart = [];

async function loadProducts() {
  const res = await fetch("/api/products");
  products = await res.json();

  products = products.map((product) => ({
    ...product,
    category: product.category || "Tech Accessories",
    rating: 4.8,
    reviews: Math.floor(Math.random() * 300) + 50,
    inventory: Math.floor(Math.random() * 20) + 5
  }));

  renderProducts();
}

function renderProducts() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const category = document.getElementById("categoryFilter").value;

  const filtered = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search);
    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  document.getElementById("products").innerHTML = filtered
    .map(
      (product) => `
        <div class="card">
          <span class="badge">${product.category}</span>
          <img src="${product.image}" alt="${product.name}">
          <h2>${product.name}</h2>
          <div class="rating">★★★★★</div>
          <p>${product.rating} rating • ${product.reviews} reviews</p>
          <p class="stock">Only ${product.inventory} left in stock</p>
          <p class="price">$${product.price.toFixed(2)}</p>
          <a class="details-btn" href="product.html?id=${product.id}">View Details</a>
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
}

loadProducts();