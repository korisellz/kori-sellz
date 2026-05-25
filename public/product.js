let products = [];

const productDescriptions = {
  1: "Connect your Type-C device to HDMI, VGA, USB, and more with this compact 5-in-1 adapter. Perfect for laptops, monitors, projectors, and everyday tech setups.",
  2: "Keep your phone, earbuds, and smartwatch powered with this sleek 4-in-1 magnetic wireless charging station. Great for desks, nightstands, and travel setups.",
  3: "Capture smooth aerial shots with this V14 Professional 6K HD dual camera drone. Comes with 2 batteries so you can fly longer and create more content.",
  4: "The V14 Professional 6K HD drone with 3 batteries gives you extra flight time, dual-camera recording, and a compact design for creators and hobby flyers.",
  5: "Record clearer audio for videos, lives, interviews, and content creation with this wireless lavalier microphone for iPhone.",
  6: "Take your adventures anywhere with this 4K waterproof sport camera. Perfect for outdoor videos, action shots, travel, and everyday content.",
  7: "Turn any room into a mini theater with this compact 1080P LED projector. Great for movies, gaming, parties, and cozy nights in.",
  8: "Add an extra layer of protection with this intelligent door stop alarm. Great for apartments, hotels, dorms, and home security.",
  9: "Detangle and massage your scalp with this electric hair brush designed to smooth knots while giving a relaxing scalp massage.",
  10: "Stay organized with this multi-function charging cable storage box. It keeps cables neat while supporting fast charging on the go."
};

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("id"));
}

function getDescription(product) {
  return productDescriptions[product.id] || "A trending Kori Sellz product selected for everyday convenience, style, and value.";
}

function getShippingEstimate(product) {
  if (product.category === "Drones & Cameras") {
    return "Estimated delivery: 7-15 business days after processing.";
  }

  if (product.category === "Beauty") {
    return "Estimated delivery: 7-14 business days after processing.";
  }

  return "Estimated delivery: 7-15 business days after processing.";
}

function getStockText(product) {
  const inventory = product.inventory || 12;

  if (inventory <= 5) {
    return `Low stock — only ${inventory} left`;
  }

  return `In stock — ${inventory} available`;
}

async function loadProductPage() {
  const res = await fetch("/api/products");
  products = await res.json();

  products = products.map((product) => ({
    ...product,
    category: product.category || "Tech Accessories",
    rating: 4.8,
    inventory: Math.floor(Math.random() * 20) + 5
  }));

  const productId = getProductIdFromUrl();
  const product = products.find((item) => item.id === productId);

  if (!product) {
    document.getElementById("productDetail").innerHTML = `
      <h1>Product not found</h1>
      <p>This product may no longer be available.</p>
      <a class="details-btn" href="/">Return to Store</a>
    `;
    return;
  }

  renderProduct(product);
  renderRelatedProducts(product);
}

function renderProduct(product) {
  document.title = `${product.name} | Kori Sellz`;

  document.getElementById("productDetail").innerHTML = `
    <div class="product-detail-layout">
      <div class="product-image-box">
        <img src="${product.image}" alt="${product.name}">
      </div>

      <div class="product-info-box">
        <span class="badge">${product.category}</span>

        <h1>${product.name}</h1>

        <div class="rating">★★★★★</div>
        <p class="review-note">No verified customer reviews yet. Be the first to try it.</p>

        <p class="detail-price">$${product.price.toFixed(2)}</p>

        <p class="stock">${getStockText(product)}</p>

        <h3>Description</h3>
        <p>${getDescription(product)}</p>

        <h3>Shipping Estimate</h3>
        <p>${getShippingEstimate(product)}</p>

        <div class="product-actions">
          <button class="buy-now large-buy" onclick="buyNow(${product.id})">Buy Now</button>
          <a class="details-btn" href="/">Continue Shopping</a>
        </div>

        <div class="trust-box">
          <p>Secure checkout powered by Stripe.</p>
          <p>Order confirmation sent by email after purchase.</p>
          <p>Tracking available once the order ships.</p>
        </div>
      </div>
    </div>
  `;
}

function renderRelatedProducts(currentProduct) {
  const related = products
    .filter((product) => product.id !== currentProduct.id && product.category === currentProduct.category)
    .slice(0, 3);

  const fallback = products
    .filter((product) => product.id !== currentProduct.id)
    .slice(0, 3);

  const relatedProducts = related.length > 0 ? related : fallback;

  document.getElementById("relatedProducts").innerHTML = relatedProducts
    .map(
      (product) => `
        <a class="related-card" href="product.html?id=${product.id}">
          <img src="${product.image}" alt="${product.name}">
          <h3>${product.name}</h3>
          <p>$${product.price.toFixed(2)}</p>
        </a>
      `
    )
    .join("");
}

async function buyNow(productId) {
  const product = products.find((item) => item.id === productId);

  if (!product) {
    alert("Product not found.");
    return;
  }

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

loadProductPage();