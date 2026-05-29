const params = new URLSearchParams(window.location.search);
const productId = Number(params.get("id"));

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const product = products.find((item) => item.id === productId);

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const cartCount = document.getElementById("cartCount");
  if (!cartCount) return;

  cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function addToCart(productId) {
  const item = products.find((p) => p.id === productId);
  if (!item) return;

  const existing = cart.find((cartItem) => cartItem.id === productId);

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
  const item = products.find((p) => p.id === productId);
  if (!item) return;

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
    console.error(error);
    alert("Checkout failed.");
  }
}

function getRelatedProducts(currentProduct) {
  return products
    .filter((item) => item.category === currentProduct.category && item.id !== currentProduct.id)
    .slice(0, 4);
}

function renderProductPage() {
  const productPage = document.getElementById("productPage");

  if (!productPage) return;

  if (!product) {
    productPage.innerHTML = `
      <section class="product-detail-card">
        <h1>Product not found</h1>
        <p>This product could not be found.</p>
        <a class="track-link" href="/">Return to Store</a>
      </section>
    `;
    return;
  }

  const relatedProducts = getRelatedProducts(product);

  productPage.innerHTML = `
    <section class="product-detail-card">
      <div class="product-detail-grid">
        <div class="product-detail-image-wrap">
          <img class="product-detail-image" src="${product.image}" alt="${product.name}">
        </div>

        <div class="product-detail-info">
          <span class="badge">${product.category}</span>
          <h1>${product.name}</h1>

          <div class="rating">★★★★★</div>
          <p class="review-text">4.8 rating • Customer favorite</p>

          <p class="product-detail-price">$${product.price.toFixed(2)}</p>

          <p class="product-description">${product.description || "A trending Kori Sellz product made for everyday use."}</p>

          <div class="product-info-box">
            <h3>Shipping Estimate</h3>
            <p>${product.shipping || "Estimated delivery: 8-23 business days after processing."}</p>
          </div>

          <div class="product-info-box">
            <h3>What’s in the Box</h3>
            <ul>
              ${(product.whatsInBox || ["1 product unit", "Basic packaging"]).map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </div>

          <div class="product-info-box">
            <h3>Product Details</h3>
            <p><strong>SKU:</strong> ${product.sku}</p>
            <p><strong>Category:</strong> ${product.category}</p>
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
                <img src="${item.image}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p>$${item.price.toFixed(2)}</p>
                <a href="/product.html?id=${item.id}">View Details</a>
              </div>
            `).join("")
            : "<p>No related products found.</p>"
        }
      </div>
    </section>
  `;
}

renderProductPage();
updateCartCount();