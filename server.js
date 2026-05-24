import express from "express";
import cors from "cors";
import Stripe from "stripe";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

console.log("Stripe key loaded?", process.env.STRIPE_SECRET_KEY ? "YES" : "NO");
console.log("Stripe webhook secret loaded?", process.env.STRIPE_WEBHOOK_SECRET ? "YES" : "NO");
console.log("CJ API key loaded?", process.env.CJ_API_KEY ? "YES" : "NO");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SITE_URL = process.env.SITE_URL || "https://kori-sellz.onrender.com";

let cachedCJAccessToken = null;

async function getCJAccessToken() {
  if (cachedCJAccessToken) {
    return cachedCJAccessToken;
  }

  const response = await axios.post(
    "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
    {
      apiKey: process.env.CJ_API_KEY
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.data?.data?.accessToken) {
    throw new Error(`CJ auth failed: ${JSON.stringify(response.data)}`);
  }

  cachedCJAccessToken = response.data.data.accessToken;

  console.log("✅ CJ access token generated");

  return cachedCJAccessToken;
}

// Stripe webhook MUST stay before express.json()
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      console.log("🔥 WEBHOOK TRIGGERED");
      console.log("✅ Payment confirmed:", session.id);

      await fulfillOrder(session);
    }

    res.json({ received: true });
  }
);

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const products = [
  {
    id: 1,
    name: "Type-C to HDMI VGA 5-in-1 Dual Display Converter",
    sku: "CJXFJTDS00064-Black",
    cost: 12.78,
    price: 29.99,
    image:
      "https://cf.cjdropshipping.com/203106/3190218982082.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 2,
    name: "4-in-1 Magnetic Wireless Charging Station",
    sku: "CJYD179346901AZ",
    cost: 12.37,
    price: 29.99,
    image:
      "https://cf.cjdropshipping.com/quick/product/6da64e9b-f353-419a-9be1-13f716dfd91b.jpg?x-oss-process=image/resize,m_pad,w_300,h_300/sharpen,100/format,jpg"
  },
  {
    id: 3,
    name: "V14 Professional 6K HD Dual Camera Drone - 2 Batteries",
    sku: "CJWR241970801AZ",
    cost: 35.0,
    price: 69.99,
    image:
      "https://cf.cjdropshipping.com/66ca3586-f363-4d10-b446-b93451e9f6a4.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 4,
    name: "V14 Professional 6K HD Dual Camera Drone - 3 Batteries",
    sku: "CJWR241970802BY",
    cost: 39.0,
    price: 79.99,
    image:
      "https://cf.cjdropshipping.com/04df2447-39a4-4c05-8b0e-c2250546f1a1.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 5,
    name: "Wireless Lavalier Microphone for iPhone",
    sku: "CJMK1698386-2in1 for IOS",
    cost: 10.98,
    price: 24.99,
    image:
      "https://cf.cjdropshipping.com/adbc5add-bd51-4328-84c4-106e8c198890.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  }
];

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.get("/cj-auth-test", async (req, res) => {
  try {
    const token = await getCJAccessToken();

    res.json({
      success: true,
      message: "CJ auth worked",
      accessTokenPreview: token.slice(0, 6) + "..." + token.slice(-6)
    });
  } catch (error) {
    console.error("CJ auth test error:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

app.get("/cj-token-test", async (req, res) => {
  try {
    const token = await getCJAccessToken();

    const response = await axios.get(
      "https://developers.cjdropshipping.com/api2.0/v1/product/listV2?page=1&size=1",
      {
        headers: {
          "CJ-Access-Token": token
        }
      }
    );

    res.json({
      success: true,
      message: "CJ token worked",
      data: response.data
    });
  } catch (error) {
    console.error("CJ token test error:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

async function sendOrderToCJ(order) {
  const token = await getCJAccessToken();

  const payload = {
    orderNumber: order.orderNumber,

    shippingZip: order.shippingAddress.zip,
    shippingCountry: "United States",
    shippingCountryCode: "US",
    shippingProvince: order.shippingAddress.state,
    shippingCity: order.shippingAddress.city,
    shippingCounty: "",
    shippingPhone: order.phone || "0000000000",
    shippingCustomerName: order.customerName || "Kori Sellz Customer",
    shippingAddress: order.shippingAddress.address,
    shippingAddress2: order.shippingAddress.address2 || "",

    email: order.email || "",
    remark: "Kori Sellz order from Stripe",

    logisticName: "CJPacket Ordinary",
    fromCountryCode: "CN",

    products: order.items.map((item, index) => ({
      sku: item.sku,
      quantity: item.quantity || 1,
      unitPrice: item.price,
      storeLineItemId: `${order.orderNumber}-${index + 1}`
    }))
  };

  console.log("📦 CJ payload being sent:", JSON.stringify(payload, null, 2));

  const response = await axios.post(
    "https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV2",
    payload,
    {
      headers: {
        "CJ-Access-Token": token,
        "Content-Type": "application/json"
      }
    }
  );

  console.log("✅ CJ response:", response.data);

  if (!response.data?.result) {
    throw new Error(`CJ rejected order: ${JSON.stringify(response.data)}`);
  }

  return response.data;
}

async function fulfillOrder(session) {
  try {
    const items = JSON.parse(session.metadata.items);

    const shipping =
      session.collected_information?.shipping_details?.address ||
      session.customer_details?.address;

    const orderNumber = `KS-${session.id.slice(-20)}`;

    const cjResponse = await sendOrderToCJ({
      orderNumber,
      items,

      customerName: session.customer_details?.name,
      email: session.customer_details?.email,
      phone: session.customer_details?.phone,

      shippingAddress: {
        country: shipping?.country || "US",
        state: shipping?.state || "",
        city: shipping?.city || "",
        address: shipping?.line1 || "",
        address2: shipping?.line2 || "",
        zip: shipping?.postal_code || ""
      }
    });

    const cjOrderId =
      cjResponse?.data?.orderId ||
      cjResponse?.data?.orderNum ||
      cjResponse?.data?.id ||
      cjResponse?.data?.cjOrderId ||
      "No CJ order ID found in response";

    console.log("📦 CJ Order ID:", cjOrderId);
    console.log("✅ Order forwarded to CJ successfully.");
  } catch (error) {
    console.error(
      "Fulfillment Error:",
      error.response?.data || error.message
    );
  }
}

app.post("/api/checkout", async (req, res) => {
  try {
    const items = req.body.items;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Cart is empty"
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      shipping_address_collection: {
        allowed_countries: ["US"]
      },

      phone_number_collection: {
        enabled: true
      },

      customer_creation: "always",

      metadata: {
        items: JSON.stringify(
          items.map((item) => ({
            name: item.name,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity || 1
          }))
        )
      },

      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name
          },
          unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity || 1
      })),

      mode: "payment",

      success_url: `${SITE_URL}/success`,
      cancel_url: `${SITE_URL}/cancel`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error.message);

    res.status(500).json({
      error: "Checkout failed"
    });
  }
});

app.get("/api/track/:orderId", async (req, res) => {
  try {
    const token = await getCJAccessToken();

    const response = await axios.get(
      `https://developers.cjdropshipping.com/api2.0/v1/shopping/order/getOrderDetail?orderId=${req.params.orderId}`,
      {
        headers: {
          "CJ-Access-Token": token
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Tracking error:", error.response?.data || error.message);

    res.status(500).json({
      error: "Tracking lookup failed",
      details: error.response?.data || error.message
    });
  }
});

app.get("/success", (req, res) => {
  res.send(`
    <h1>Payment successful!</h1>
    <p>Your order is being processed.</p>
    <a href="/">Return to Kori Sellz</a>
  `);
});

app.get("/cancel", (req, res) => {
  res.send(`
    <h1>Payment canceled</h1>
    <p>Your order was not completed.</p>
    <a href="/">Return to Kori Sellz</a>
  `);
});

const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});