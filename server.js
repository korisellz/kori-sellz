import express from "express";
import cors from "cors";
import Stripe from "stripe";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

console.log("Stripe key loaded?", process.env.STRIPE_SECRET_KEY ? "YES" : "NO");
console.log("CJ token loaded?", process.env.CJ_ACCESS_TOKEN ? "YES" : "NO");
console.log("Webhook secret loaded?", process.env.STRIPE_WEBHOOK_SECRET ? "YES" : "NO");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// WEBHOOK MUST COME BEFORE express.json()
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
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
    console.log("✅ Payment confirmed:", session.id);
    await fulfillOrder(session);
  }

  res.json({ received: true });
});

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

async function sendOrderToCJ(order) {
  try {
    const response = await axios.post(
      "https://developers.cjdropshipping.cn/api2.0/v1/shopping/order/createOrderV2",
      {
        products: order.items.map((item) => ({
          productName: item.name,
          sku: item.sku,
          quantity: item.quantity || 1
        })),
        shippingAddress: order.shippingAddress
      },
      {
        headers: {
          "CJ-Access-Token": process.env.CJ_ACCESS_TOKEN
        }
      }
    );

    console.log("✅ Sent to CJ:", response.data);
  } catch (error) {
    console.error("CJ Error:", error.response?.data || error.message);
  }
}

async function fulfillOrder(session) {
  try {
    const items = JSON.parse(session.metadata.items);
    const shipping = session.customer_details?.address;

    await sendOrderToCJ({
      items,
      shippingAddress: {
        country: shipping?.country || "US",
        state: shipping?.state || "",
        city: shipping?.city || "",
        address: shipping?.line1 || "",
        address2: shipping?.line2 || "",
        zip: shipping?.postal_code || ""
      }
    });

    console.log("✅ Order forwarded to CJ successfully.");
  } catch (error) {
    console.error("Fulfillment Error:", error.message);
  }
}

app.post("/api/checkout", async (req, res) => {
  try {
    const items = req.body.items;

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

      success_url: "https://kori-sellz.onrender.com/success",
      cancel_url: "https://kori-sellz.onrender.com/cancel"
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error.message);

    res.status(500).json({
      error: "Checkout failed"
    });
  }
});

app.get("/success", (req, res) => {
  res.send("Payment successful! Your order is being processed.");
});

app.get("/cancel", (req, res) => {
  res.send("Payment canceled.");
});

const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});