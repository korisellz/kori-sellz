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

const productReviews = {
  1: [
    "Works great for my laptop setup. Super helpful for connecting to my monitor.",
    "Small, easy to carry, and exactly what I needed."
  ],
  2: [
    "Love having everything charge in one place. Looks clean on my nightstand.",
    "Great price and works well for my phone and earbuds."
  ],
  3: [
    "Fun drone for the price. The extra battery is definitely worth it.",
    "Good starter drone and easy to use."
  ],
  4: [
    "The 3 batteries make a big difference. Great for longer use.",
    "Nice drone bundle for the price."
  ],
  5: [
    "The audio sounds way better than my phone mic.",
    "Perfect for recording videos and content."
  ],
  6: [
    "Cute little camera for trips and outdoor videos.",
    "Good value for the price."
  ],
  7: [
    "Great for movie nights. Easy to set up.",
    "Nice picture for a small projector."
  ],
  8: [
    "Makes me feel safer when traveling.",
    "Simple but loud enough to get attention."
  ],
  9: [
    "Feels good on my scalp and helps with tangles.",
    "Cute and actually useful."
  ],
  10: [
    "Keeps my cords organized and easy to find.",
    "Perfect for travel and my purse."
  ]
};

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("id"));
}

function getDescription(product) {
  return (
    productDescriptions[product.id] ||
    "A trending Kori Sellz product selected for everyday convenience, style, and value."
  );
}

function getShippingEstimate(product) {
  if (product.category === "Beauty") {
    return "Estimated delivery: 7-14 business days after processing.";
  }

  return "Estimated delivery: 7-15 business days after processing.";
}

function renderReviews(product) {
  const reviews = productReviews[product.id] || [
    "Great product and easy checkout experience.",
    "Good value and helpful order updates."
  ];

  return reviews
    .map(
      (review) => `
        <div class="review-card">
          <div class="rating">★★★★★</div>
          <p>"${review}"</p>
          <span>Verified-style customer review</span>
        </div>
      `
    )
    .join("");
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

  if (!res.ok) {
    throw new Error("Products API failed to load.");
  }

  products = await res.json();

 products = products.map((product) => ({
  ...product,
  category: product.category || "Tech Accessories",
  rating: 4.8,
  inventory: Math.floor(Math.random() * 20) + 5,
  badge: getProductBadge(product.id)
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
        <div class="badge-row">
  <span class="badge">${product.category}</span>
  <span class="product-badge">${product.badge}</span>
</div>

        <h1>${product.name}</h1>

        <div class="rating">★★★★★</div>
        <p class="review-note">${product.rating}/5 average rating</p>

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

        <div class="reviews-section">
          <h3>Customer Reviews</h3>
          <p class="review-summary">★★★★★ ${product.rating}/5 average rating</p>
          ${renderReviews(product)}
        </div>
      </div>
    </div>
  `;
}

function renderRelatedProducts(currentProduct) {
  const related = products
    .filter(
      (product) =>
        product.id !== currentProduct.id &&
        product.category === currentProduct.category
    )
    .slice(0, 3);

  const fallback = products
    .filter((product) => product.id !== currentProduct.id)
    .slice(0, 3);

  const relatedProducts = related.length > 0 ? related : fallback;

  document.getElementById("relatedProducts").innerHTML = relatedProducts
    .map(
      (product) => `
        <a class="related-card" href="/product.html?id=${product.id}">
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

loadProductPage().catch((error) => {
  console.error("Product page failed:", error);

  document.getElementById("productDetail").innerHTML = `
    <h1>Product failed to load</h1>
    <p>Something went wrong loading this product. Please go back to the store and try again.</p>
    <a class="details-btn" href="/">Back to Store</a>
  `;
});