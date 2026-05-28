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
  10: "Stay organized with this multi-function charging cable storage box. It keeps cables neat while supporting fast charging on the go.",
  11: "This portable mini desk vacuum cleaner is perfect for keeping desks, vanities, keyboards, and small spaces clean. It is compact, easy to use, and great for crumbs, dust, and everyday messes.",
  12: "This LED sunset projection lamp adds a warm, trendy glow to bedrooms, content setups, photos, and cozy spaces. It is perfect for creating aesthetic lighting for pictures, videos, or relaxing at home.",
  13: "These Bluetooth sleep headphones with an eye mask are made for relaxing, sleeping, traveling, or listening to music without bulky headphones. They are great for naps, flights, and bedtime comfort.",
  14: "This mini portable blender cup makes it easy to mix smoothies, protein drinks, juices, and shakes on the go. It is a convenient pick for work, school, the gym, or quick healthy drinks at home.",
  15: "This rechargeable electric makeup brush cleaner helps clean makeup brushes faster and easier. It is a helpful beauty tool for keeping brushes fresh, reducing buildup, and making your makeup routine feel more organized.",
  16: "This magnetic car phone holder keeps your phone secure and easy to see while driving. It is useful for navigation, hands-free viewing, and keeping your phone within reach without clutter.",
  17: "This smart motion sensor LED night light is great for hallways, bedrooms, closets, bathrooms, and entryways. It automatically lights up when motion is detected, making nighttime movement easier and safer.",
  18: "This phone tripod with Bluetooth remote is perfect for content creators, selfies, TikToks, photos, videos, live streams, and hands-free recording.",
  19: "This USB rechargeable neck fan helps keep you cool while walking, working, traveling, doing makeup, or spending time outdoors. It is lightweight, hands-free, and easy to recharge.",
  20: "This mini WiFi indoor security camera helps monitor your home, apartment, room, office, or pets. It is a useful security gadget for keeping an eye on important spaces from your phone.",
  21: "This rechargeable heated eyelash curler helps lift and shape lashes for a more polished look. It is a cute beauty tool for everyday makeup routines, travel, and quick touch-ups.",
  22: "This LED lighted makeup mirror gives you better lighting while doing makeup, skincare, brows, or lashes. It is great for vanities, bedrooms, dorms, and getting ready with a clearer view.",
  23: "This electric facial cleansing brush helps deep clean your skin and refresh your skincare routine. It is designed for gentle cleansing, exfoliating, and making your face feel smoother and cleaner.",
  24: "This wireless door and window alarm sensor adds extra protection to your home, apartment, dorm, or office. It helps alert you when a door or window is opened.",
  25: "This portable personal safety alarm keychain is a small safety accessory you can carry on keys, bags, or backpacks. It is useful for travel, walks, parking lots, school, and everyday peace of mind."
};

const productReviews = {
  1: ["Works great for my laptop setup.", "Small, easy to carry, and exactly what I needed."],
  2: ["Love having everything charge in one place.", "Great price and works well."],
  3: ["Fun drone for the price.", "Good starter drone and easy to use."],
  4: ["The 3 batteries make a big difference.", "Nice drone bundle for the price."],
  5: ["The audio sounds way better than my phone mic.", "Perfect for recording videos."],
  6: ["Cute little camera for trips.", "Good value for the price."],
  7: ["Great for movie nights.", "Nice picture for a small projector."],
  8: ["Makes me feel safer when traveling.", "Simple but loud enough."],
  9: ["Feels good on my scalp.", "Cute and useful."],
  10: ["Keeps my cords organized.", "Perfect for travel."]
};

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("id"));
}

function getDescription(product) {
  return productDescriptions[product.id] || "This product is part of the Kori Sellz collection and was selected for everyday usefulness, style, and affordability.";
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
    10: "Low Price",
    11: "Desk Essential",
    12: "Aesthetic Pick",
    13: "Travel Pick",
    14: "Wellness Pick",
    15: "Beauty Tool",
    16: "Car Essential",
    17: "Home Favorite",
    18: "Creator Pick",
    19: "Summer Pick",
    20: "Security Pick",
    21: "Beauty Find",
    22: "Vanity Favorite",
    23: "Skincare Pick",
    24: "Security Pick",
    25: "Safety Pick"
  };

  return badges[productId] || "Trending";
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

  return reviews.map((review) => `
    <div class="review-card">
      <div class="rating">★★★★★</div>
      <p>"${review}"</p>
      <span>Verified-style customer review</span>
    </div>
  `).join("");
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

  renderProduct(product);
  renderRelatedProducts(product);
}

function renderProduct(product) {
  document.title = `${product.name} | Kori Sellz`;
const metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) {
  metaDescription.setAttribute(
    "content",
    `${product.name} from Kori Sellz. ${getDescription(product).slice(0, 140)}`
  );
}

const ogTitle = document.querySelector('meta[property="og:title"]');
if (ogTitle) {
  ogTitle.setAttribute("content", `${product.name} | Kori Sellz`);
}

const ogDescription = document.querySelector('meta[property="og:description"]');
if (ogDescription) {
  ogDescription.setAttribute(
    "content",
    getDescription(product).slice(0, 180)
  );
}

const ogImage = document.querySelector('meta[property="og:image"]');
if (ogImage) {
  ogImage.setAttribute("content", product.image);
}
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
    .filter((product) => product.id !== currentProduct.id && product.category === currentProduct.category)
    .slice(0, 3);

  const fallback = products
    .filter((product) => product.id !== currentProduct.id)
    .slice(0, 3);

  const relatedProducts = related.length > 0 ? related : fallback;

  document.getElementById("relatedProducts").innerHTML = relatedProducts.map((product) => `
    <a class="related-card" href="/product.html?id=${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>$${product.price.toFixed(2)}</p>
    </a>
  `).join("");
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
