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
  const boxes = {
    1: [
      "1 x Type-C to HDMI VGA adapter",
      "1 x Basic packaging"
    ],
    2: [
      "1 x 4-in-1 magnetic wireless charging station",
      "1 x Charging cable",
      "1 x Basic packaging"
    ],
    3: [
      "1 x V14 drone",
      "1 x Remote controller",
      "2 x Drone batteries",
      "1 x USB charging cable",
      "1 x Spare propeller set",
      "1 x Basic packaging"
    ],
    4: [
      "1 x V14 drone",
      "1 x Remote controller",
      "3 x Drone batteries",
      "1 x USB charging cable",
      "1 x Spare propeller set",
      "1 x Basic packaging"
    ],
    5: [
      "1 x Wireless lavalier microphone set",
      "1 x iPhone receiver",
      "1 x Charging cable",
      "1 x Basic packaging"
    ],
    6: [
      "1 x 4K waterproof sport camera",
      "1 x Waterproof case",
      "1 x Charging cable",
      "1 x Mounting accessories set",
      "1 x Basic packaging"
    ],
    7: [
      "1 x 1080P LED mini projector",
      "1 x Power cable",
      "1 x Remote control if included by supplier",
      "1 x Basic packaging"
    ],
    8: [
      "1 x Door stop alarm device",
      "1 x Basic packaging"
    ],
    9: [
      "1 x Electric detangling scalp massage brush",
      "1 x Basic packaging"
    ],
    10: [
      "1 x Multi-function charging cable storage box",
      "1 x Included charging cable set",
      "1 x Basic packaging"
    ],
    11: [
      "1 x Mini car vacuum cleaner",
      "1 x Power cable or charging cable if included",
      "1 x Nozzle/accessory attachment if included",
      "1 x Basic packaging"
    ],
    12: [
      "1 x LED sunset projection lamp",
      "1 x USB power cable",
      "1 x Basic packaging"
    ],
    13: [
      "1 x Bluetooth sleep headphones eye mask",
      "1 x USB charging cable",
      "1 x Basic packaging"
    ],
    14: [
      "1 x Portable blender cup",
      "1 x USB charging cable",
      "1 x Basic packaging"
    ],
    15: [
      "1 x Electric makeup brush cleaner",
      "1 x Cleaning bowl or holder if included",
      "1 x USB charging cable",
      "1 x Basic packaging"
    ],
    16: [
      "1 x Magnetic wireless charging car holder",
      "1 x Mounting accessory",
      "1 x Charging cable if included",
      "1 x Basic packaging"
    ],
    17: [
      "1 x Motion sensor LED night light",
      "1 x Charging cable or adhesive/mounting accessory if included",
      "1 x Basic packaging"
    ],
    18: [
      "1 x Phone tripod",
      "1 x Bluetooth remote",
      "1 x Phone holder mount",
      "1 x Basic packaging"
    ],
    19: [
      "1 x USB rechargeable neck fan",
      "1 x USB charging cable",
      "1 x Basic packaging"
    ],
    20: [
      "1 x Mini WiFi indoor security camera",
      "1 x Power cable",
      "1 x Mounting accessory if included",
      "1 x Basic packaging"
    ],
    21: [
      "1 x Heated eyelash curler",
      "1 x USB charging cable",
      "1 x Basic packaging"
    ],
    22: [
      "1 x LED makeup mirror",
      "1 x Power/charging cable if included",
      "1 x Basic packaging"
    ],
    23: [
      "1 x Electric facial cleansing brush",
      "1 x Charging cable if rechargeable",
      "1 x Basic packaging"
    ],
    24: [
      "1 x Wireless home security alarm kit",
      "6 x Alarm pieces/sensors",
      "1 x Basic packaging"
    ],
    25: [
      "10 x Personal safety alarms",
      "1 x Basic packaging"
    ],
    26: [
      "1 x 1080P WiFi video doorbell camera",
      "1 x Mounting bracket",
      "1 x Screw/accessory kit if included",
      "1 x Charging cable if rechargeable",
      "1 x Basic packaging"
    ],
    27: [
      "1 x Product unit",
      "1 x Included accessories shown in product photos",
      "1 x Basic packaging"
    ],
    28: [
      "1 x Wired dash camera unit",
      "1 x Rear camera if included",
      "1 x Car power cable",
      "1 x Mounting accessories",
      "1 x Basic packaging"
    ],
    29: [
      "1 x Product unit",
      "1 x Included accessories shown in product photos",
      "1 x Basic packaging"
    ]
  };

  return boxes[Number(product.id)] || [
    "1 x Product unit",
    "1 x Basic packaging"
  ];
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