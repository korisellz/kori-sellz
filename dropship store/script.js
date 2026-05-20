let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const productGrid = document.getElementById("productGrid");
const cartButton = document.getElementById("cartButton");
const closeCart = document.getElementById("closeCart");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutButton = document.getElementById("checkoutButton");

async function loadProducts() {
  const response = await fetch("/api/products");
  products = await response.json();
  renderProducts();
  renderCart();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderProducts() {
  productGrid.innerHTML = products.map(product => `
    <article class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="sku">SKU: ${product.sku}</p>
      <div class="price-row">
        <span class="price">$${product.price.toFixed(2)}</span>
        <button class="add-button" onclick="addToCart(${product.id})">Add to cart</button>
      </div>
    </article>
  `).join("");
}

function addToCart(productId) {
  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }

  saveCart();
  renderCart();
  openCart();
}

function updateQuantity(productId, change) {
  const item = cart.find(item => item.id === productId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(item => item.id !== productId);
  }

  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  renderCart();
}

function getCartDetails() {
  return cart
    .map(item => {
      const product = products.find(product => product.id === item.id);
      if (!product) return null;

      return {
        ...product,
        quantity: item.quantity
      };
    })
    .filter(Boolean);
}

function renderCart() {
  const cartDetails = getCartDetails();
  const totalItems = cartDetails.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartCount.textContent = totalItems;
  cartTotal.textContent = `$${totalPrice.toFixed(2)}`;

  if (!cartDetails.length) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  cartItems.innerHTML = cartDetails.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <strong>${item.name}</strong>
        <p>$${item.price.toFixed(2)}</p>
        <div class="qty-row">
          <button onclick="updateQuantity(${item.id}, -1)">−</button>
          <span>${item.quantity}</span>
          <button onclick="updateQuantity(${item.id}, 1)">+</button>
          <span class="remove" onclick="removeFromCart(${item.id})">Remove</span>
        </div>
      </div>
    </div>
  `).join("");
}

function openCart() {
  cartDrawer.classList.add("open");
  overlay.classList.add("show");
}

function closeCartDrawer() {
  cartDrawer.classList.remove("open");
  overlay.classList.remove("show");
}

async function checkout() {
  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  checkoutButton.textContent = "Loading...";
  checkoutButton.disabled = true;

  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ items: cart })
    });

    const data = await response.json();

    if (data.url) {
      localStorage.removeItem("cart");
      window.location.href = data.url;
    } else {
      alert("Checkout failed.");
    }
  } catch (error) {
    alert("Checkout failed.");
  } finally {
    checkoutButton.textContent = "Checkout";
    checkoutButton.disabled = false;
  }
}

cartButton.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartDrawer);
overlay.addEventListener("click", closeCartDrawer);
checkoutButton.addEventListener("click", checkout);

loadProducts();
