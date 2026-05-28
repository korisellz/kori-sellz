let products = [];
let currentProduct = null;

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("id"));
}

function getRating(product) {
  return `${product.rating || 4.8} rating • ${product.reviews || product.id * 13 + 42} reviews`;
}

function getShipping(product) {
  return product.shipping || "Estimated delivery: 8-23 business days after processing.";
}

async function loadProductPage() {
  const productId = getProductIdFromUrl();
  const productContainer = document.getElementById("productDetails");
  const relatedContainer = document.getElementById("relatedProducts");

  if (!productContainer) {
    console.error("Missing productDetails div in product.html");
    return;
  }

  productContainer.innerHTML = "<p>Loading product...</p>";

  try {
    const productRes = await fetch(`/api/products/${productId}`);

    if (!productRes.ok) {
      throw new Error("Product not found");
    }

    currentProduct = await productRes.json();

    const allProductsRes = await fetch("/api/products");
    products = await allProductsRes.json();

    productContainer.innerHTML = `
      <section class="product-detail-card">
        <div class="product-detail-image-wrap">
          <span class="badge">${currentProduct.category}</span>
          <img class="product-detail-image" src="${currentProduct.image}" alt="${currentProduct.name}">
        </div>

        <div class="product-detail-info">
          <h1>${currentProduct.name}</h1>

          <div class="rating">★★★★★</div>
          <p>${getRating(currentProduct)}</p>

          <p class="price">$${Number(currentProduct.price).toFixed(2)}</p>

          <p class="product-description">
            ${currentProduct.description || "This product was selected by Kori Sellz for everyday usefulness, style, and affordability."}
          </p>

          <div class="product-highlights">
            <p><strong>Shipping:</strong> ${getShipping(currentProduct)}</p>
            <p><strong>Checkout:</strong> Secure payment through Stripe.</p>
            <p><strong>Support:</strong> Contact Kori Sellz anytime if you need help with your order.</p>
          </div>

          <div class="product-actions">
            <button onclick="addToCart(${currentProduct.id})">Add to Cart</button>
            <button class="buy-now" onclick="buyNow(${currentProduct.id})">Buy Now</button>
          </div>

          <a class="track-link" href="/">Back to Store</a>
        </div>
      </section>
    `;

    if (relatedContainer) {
      const related = products
        .filter((item) => item.id !== currentProduct.id && item.category === currentProduct.category)
        .slice(0, 4);

      relatedContainer.innerHTML = related.map((item) => `
        <div class="card">
          <span class="badge">${item.category}</span>
          <img src="${item.image}" alt="${item.name}">
          <h2>${item.name}</h2>
          <div class="rating">★★★★★</div>
          <p>${getRating(item)}</p>
          <p class="price">$${Number(item.price).toFixed(2)}</p>
          <a class="track-link" href="/product.html?id=${item.id}">View Details</a>
        </div>
      `).join("");
    }
  } catch (error) {
    console.error("Product page load error:", error);

    productContainer.innerHTML = `
      <div class="tracking-box">
        <h1>Product Loading Error</h1>
        <p>Something went wrong loading this product.</p>
        <p>${error.message}</p>
        <a class="track-link" href="/">Back to Store</a>
      </div>
    `;
  }
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId) || currentProduct;

  let cart = JSON.parse(localStorage.getItem("koriCart")) || [];
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  localStorage.setItem("koriCart", JSON.stringify(cart));
  alert("Added to cart!");
}

async function buyNow(productId) {
  const product = products.find((item) => item.id === productId) || currentProduct;

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: [
        {
          ...product,
          quantity: 1
        }
      ]
    })
  });

  const data = await res.json();

  if (data.url) {
    window.location.href = data.url;
  } else {
    alert("Checkout failed");
  }
}

document.addEventListener("DOMContentLoaded", loadProductPage);
 
 <script src="/product-page.js?v=5"></script>
  <script src="/footer.js"></script>
</body>
</html>