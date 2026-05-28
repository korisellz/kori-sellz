let products = [];
let currentProduct = null;
let cart = JSON.parse(localStorage.getItem("koriCart")) || [];

const fallbackDescriptions = {
  1: "A compact 5-in-1 Type-C adapter that helps connect your device to HDMI, VGA, and other display options. Great for work, streaming, school, and travel.",
  2: "Charge multiple devices in one place with this sleek 4-in-1 magnetic wireless charging station. Perfect for phones, watches, earbuds, and everyday desk setups.",
  3: "Capture aerial shots with this V14 dual camera drone featuring HD recording, foldable design, and two batteries for extra flight time.",
  4: "A foldable dual camera drone with HD recording and three batteries for longer use. Great for beginners, travel shots, and outdoor content.",
  5: "A wireless lavalier microphone made for creators, vloggers, interviews, TikTok videos, and everyday content recording.",
  6: "A compact waterproof sport camera designed for outdoor activities, travel, action shots, and everyday video recording.",
  7: "A mini LED projector for movie nights, small rooms, gaming setups, and portable entertainment.",
  8: "A portable door stop alarm designed to help add extra security at home, hotels, dorms, apartments, and travel stays.",
  9: "A gentle electric detangling brush designed to help smooth hair while massaging the scalp for easier everyday styling.",
  10: "A compact cable storage box with fast charging support, perfect for keeping your everyday tech accessories organized.",
  11: "A portable mini car vacuum cleaner for quick cleanups, car interiors, small messes, and everyday convenience.",
  12: "Create a cozy aesthetic vibe with this LED sunset projection lamp, perfect for photos, bedrooms, videos, and relaxing spaces.",
  13: "A soft Bluetooth sleep mask with built-in headphones, great for relaxing, travel, meditation, and sleeping with music or white noise.",
  14: "A portable blender cup designed for smoothies, shakes, fruit drinks, and quick blends on the go.",
  15: "A rechargeable makeup brush cleaner designed to make cleaning beauty tools faster, easier, and more convenient.",
  16: "A magnetic phone holder with wireless charging support, perfect for hands-free driving and keeping your phone powered on the road.",
  17: "A motion sensor LED night light for hallways, bedrooms, bathrooms, closets, and added visibility around your home.",
  18: "A phone tripod with Bluetooth remote for selfies, content creation, livestreaming, recording, and hands-free photos.",
  19: "A USB rechargeable neck fan designed for hands-free cooling during travel, work, outdoor activities, and hot days.",
  20: "A compact WiFi indoor security camera for checking on rooms, pets, small spaces, and everyday home monitoring.",
  21: "A rechargeable heated eyelash curler designed to help lift and style lashes quickly for everyday beauty routines.",
  22: "A bright LED makeup mirror designed for beauty routines, skincare, travel, and better lighting while getting ready.",
  23: "An electric facial cleansing brush designed to support daily skincare routines and help cleanse more effectively.",
  24: "A 6-piece wireless home security alarm set for doors, windows, apartments, dorms, and small spaces.",
  25: "A portable personal safety alarm set that can be carried on keys, bags, or backpacks for extra peace of mind.",
  26: "A budget-friendly wireless video doorbell camera with 1080P video, motion detection, night vision, two-way audio, and mobile app alerts. Great for apartments, homes, and small businesses.",
  27: "Get full driving coverage with this 360° 4-channel dash cam. It records the front, rear, left, right, and inside views to help protect your vehicle on the road or while parked. Features IR night vision, loop recording, motion detection, and includes a free 32GB memory card.",
  28: "Drive with extra peace of mind using this 4-channel 360° dash cam. It features 1080P front recording, left and right side coverage, rear recording, night vision, G-sensor impact detection, parking monitor, loop recording, and a 128GB memory card for extended storage.",
  29: "Upgrade your car security with this Hainatech 360° 4-channel dash cam. It records front, rear, inside, left, and right views and includes built-in GPS, WiFi, night vision, 24/7 parking monitoring, loop recording, and a free 128GB memory card. Perfect for daily drivers, rideshare drivers, and road trips."
};

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("id"));
}

function getDescription(product) {
  return (
    product.description ||
    fallbackDescriptions[product.id] ||
    "This product was selected by Kori Sellz for everyday usefulness, quality, and affordability."
  );
}

function getBadge(product) {
  const badges = {
    1: "Tech Essential",
    2: "Best Seller",
    3: "Drone Pick",
    4: "Extended Battery",
    5: "Creator Favorite",
    6: "Action Camera",
    7: "Home Entertainment",
    8: "Security Pick",
    9: "Beauty Tool",
    10: "Travel Friendly",
    11: "Car Essential",
    12: "Aesthetic Find",
    13: "Relaxation Pick",
    14: "Kitchen Gadget",
    15: "Beauty Essential",
    16: "Car Tech",
    17: "Home Essential",
    18: "Creator Tool",
    19: "Summer Pick",
    20: "Security Camera",
    21: "Beauty Pick",
    22: "Glow Up",
    23: "Skincare Tool",
    24: "Home Security",
    25: "Safety Pick",
    26: "Doorbell Camera",
    27: "Car Tech",
    28: "Road Safety",
    29: "Premium Dash Cam"
  };

  return badges[product.id] || product.category || "Kori Pick";
}

function getRating(product) {
  const rating = product.rating || 4.8;
  const reviews = product.reviews || product.id * 13 + 42;
  return `${rating} rating • ${reviews} reviews`;
}

function getShipping(product) {
  return product.shipping || "Estimated delivery: 8-23 business days after processing.";
}

async function loadProductPage() {
  const productId = getProductIdFromUrl();
  const productContainer = document.getElementById("productDetails");
  const relatedContainer = document.getElementById("relatedProducts");

  if (!productContainer) {
    console.error("Missing #productDetails container in product.html");
    return;
  }

  productContainer.innerHTML = "<p>Loading product...</p>";

try {
  const res = await fetch(`/api/products/${productId}`);

  if (!res.ok) {
    throw new Error("Product not found");
  }

currentProduct = await res.json();

const allProductsRes = await fetch("/api/products");
products = await allProductsRes.json();

    currentProduct = products.find((product) => product.id === productId);

    if (!currentProduct) {
      productContainer.innerHTML = `
        <div class="tracking-box">
          <h1>Product Not Found</h1>
          <p>We could not find this product.</p>
          <a class="track-link" href="/">Back to Store</a>
        </div>
      `;
      return;
    }

    renderProductDetails(currentProduct);
    renderRelatedProducts(currentProduct);

    if (relatedContainer && relatedContainer.innerHTML.trim() === "") {
      relatedContainer.innerHTML = "<p>No related products found.</p>";
    }
  } catch (error) {
    console.error("Product page load error:", error);
    productContainer.innerHTML = `
      <div class="tracking-box">
        <h1>Product Loading Error</h1>
        <p>Something went wrong loading this product. Please refresh the page.</p>
        <a class="track-link" href="/">Back to Store</a>
      </div>
    `;
  }
}

function renderProductDetails(product) {
  const productContainer = document.getElementById("productDetails");

  productContainer.innerHTML = `
    <section class="product-detail-card">
      <div class="product-detail-image-wrap">
        <span class="badge">${getBadge(product)}</span>
        <img class="product-detail-image" src="${product.image}" alt="${product.name}">
      </div>

      <div class="product-detail-info">
        <p class="badge">${product.category || "Kori Sellz"}</p>
        <h1>${product.name}</h1>

        <div class="rating">★★★★★</div>
        <p>${getRating(product)}</p>

        <p class="price">$${Number(product.price).toFixed(2)}</p>

        <p class="product-description">${getDescription(product)}</p>

        <div class="product-highlights">
          <p><strong>Shipping:</strong> ${getShipping(product)}</p>
          <p><strong>Checkout:</strong> Secure payment through Stripe.</p>
          <p><strong>Support:</strong> Contact Kori Sellz anytime if you need help with your order.</p>
        </div>

        <div class="product-actions">
          <button onclick="addToCart(${product.id})">Add to Cart</button>
          <button class="buy-now" onclick="buyNow(${product.id})">Buy Now</button>
        </div>

        <a class="track-link" href="/">Back to Store</a>
      </div>
    </section>
  `;
}

function renderRelatedProducts(product) {
  const relatedContainer = document.getElementById("relatedProducts");

  if (!relatedContainer) return;

  const related = products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 4);

  relatedContainer.innerHTML = related
    .map(
      (item) => `
      <div class="card">
        <span class="badge">${item.category}</span>
        <img src="${item.image}" alt="${item.name}">
        <h2>${item.name}</h2>
        <div class="rating">★★★★★</div>
        <p>${getRating(item)}</p>
        <p class="price">$${Number(item.price).toFixed(2)}</p>
        <a class="track-link" href="/product.html?id=${item.id}">View Details</a>
      </div>
    `
    )
    .join("");
}

function saveCart() {
  localStorage.setItem("koriCart", JSON.stringify(cart));
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  saveCart();
  alert("Added to cart!");
}

async function buyNow(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const buyNowCart = [
    {
      ...product,
      quantity: 1
    }
  ];

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: buyNowCart
      })
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Checkout failed. Please try again.");
    }
  } catch (error) {
    console.error("Buy now error:", error);
    alert("Checkout failed. Please try again.");
  }
}

loadProductPage();