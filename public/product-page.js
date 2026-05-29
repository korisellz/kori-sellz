const params = new URLSearchParams(window.location.search);
const productParam = params.get("id") || params.get("sku");

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const cartCount = document.getElementById("cartCount");
  if (!cartCount) return;

  cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getProductByParam(param) {
  if (!param) return null;

  return products.find((item) => {
    return String(item.id) === String(param) || String(item.sku) === String(param);
  });
}

function getBoxItems(product) {
  if (product.whatsInBox && product.whatsInBox.length) {
    return product.whatsInBox;
  }

  const categoryBoxes = {
    "Tech Accessories": [
      "1 x Product unit",
      "1 x Charging or connection accessory if included by supplier",
      "1 x Basic packaging"
    ],
    "Drones & Cameras": [
      "1 x Camera or drone device",
      "1 x Included accessories shown in product photos",
      "1 x Charging cable or power cable if included by supplier",
      "1 x Basic packaging"
    ],
    "Beauty": [
      "1 x Beauty device or tool",
      "1 x Charging cable if rechargeable",
      "1 x Basic packaging"
    ],
    "Home Security": [
      "1 x Security device or kit",
      "1 x Mounting or setup accessories if included by supplier",
      "1 x Basic packaging"
    ],
    "Creator Tools": [
      "1 x Creator accessory",
      "1 x Connection or charging accessory if included",
      "1 x Basic packaging"
    ],
    "Home Gadgets": [
      "1 x Home gadget",
      "1 x Power or charging accessory if included",
      "1 x Basic packaging"
    ]
  };

  return categoryBoxes[product.category] || [
    "1 x Product unit",
    "1 x Basic packaging"
  ];
}

function addToCart(productId) {
  const item = products.find((p) => Number(p.id) === Number(productId));

  if (!item) {
    alert("Product not found.");
    return;
  }

  const existing = cart.find((cartItem) => Number(cartItem.id) === Number(productId));

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }

  saveCart();
  updateCartCount();
  alert("Added to cart!");
}

function buyNow(productId) {
  const item = products.find((p) => Number(p.id) === Number(productId));

  if (!item) {
    alert("Product not found.");
    return;
  }

  cart = [{ ...item, quantity: 1 }];
  saveCart();
  checkout();
}

async function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty.");
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
      alert("Checkout failed.");
    }
  } catch (error) {
    console.error("Checkout failed:", error);
    alert("Checkout failed.");
  }
}

function getRelatedProducts(currentProduct) {
  return products
    .filter((item) => item.category === currentProduct.category && item.id !== currentProduct.id)
    .slice(0, 4);
}

function renderProductPage(product) {
  const productPage = document.getElementById("productPage");

  if (!productPage) return;

  if (!product) {
    productPage.innerHTML = `
      <section class="product-detail-card">
        <h1>Product not found</h1>
        <p>This product could not be found.</p>
        <p>Product link used: ${productParam || "No product ID found"}</p>
        <a class="track-link" href="/">Return to Store</a>
      </section>
    `;
    return;
  }

  const relatedProducts = getRelatedProducts(product);
  const boxItems = getBoxItems(product);

  productPage.innerHTML = `
    <section class="product-detail-card">
      <div class="product-detail-grid">
        <div class="product-detail-image-wrap">
          <img class="product-detail-image" src="${product.image}" alt="${product.name}" onerror="this.src='/kori-logo.jpeg'">
        </div>

        <div class="product-detail-info">
          <span class="badge">${product.category || "Kori Sellz"}</span>
          <h1>${product.name}</h1>

          <div class="rating">★★★★★</div>
          <p class="review-text">4.8 rating • Customer favorite</p>

          <p class="product-detail-price">$${Number(product.price).toFixed(2)}</p>

          <p class="product-description">
            ${product.description || "A trending Kori Sellz product made for everyday use."}
          </p>

          <div class="product-info-box">
            <h3>Shipping Estimate</h3>
            <p>${product.shipping || "Estimated delivery: 8-23 business days after processing."}</p>
          </div>

          <div class="product-info-box">
            <h3>What’s in the Box</h3>
            <ul>
              ${boxItems.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </div>

          <div class="product-info-box">
            <h3>Product Details</h3>
            <p><strong>SKU:</strong> ${product.sku || "N/A"}</p>
            <p><strong>Category:</strong> ${product.category || "N/A"}</p>
          </div>

          <div class="product-actions">
            <button onclick="addToCart(${product.id})">Add to Cart</button>
            <button class="buy-now" onclick="buyNow(${product.id})">Buy Now</button>
          </div>
        </div>
      </div>
    </section>

    <section class="related-section">
      <h2>Related Products</h2>
      <div class="related-products">
        ${
          relatedProducts.length
            ? relatedProducts.map((item) => `
              <div class="related-card">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='/kori-logo.jpeg'">
                <h3>${item.name}</h3>
                <p>$${Number(item.price).toFixed(2)}</p>
                <a href="/product.html?id=${item.id}">View Details</a>
              </div>
            `).join("")
            : "<p>No related products found.</p>"
        }
      </div>
    </section>
  `;
}

async function loadProductPage() {
  const productPage = document.getElementById("productPage");

  try {
    const res = await fetch("/api/products");

    if (!res.ok) {
      throw new Error("Products API failed");
    }

    products = await res.json();

    const product = getProductByParam(productParam);

    renderProductPage(product);
    updateCartCount();
  } catch (error) {
    console.error("Product page failed to load:", error);

    if (productPage) {
      productPage.innerHTML = `
        <section class="product-detail-card">
          <h1>Product failed to load</h1>
          <p>Please refresh the page or try again soon.</p>
          <a class="track-link" href="/">Return to Store</a>
        </section>
      `;
    }
  }
}

loadProductPage();