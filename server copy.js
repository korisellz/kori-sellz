import express from "express";
import cors from "cors";
import Stripe from "stripe";
import axios from "axios";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 7000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const pendingOrders = new Map();

const products = [
  {
    id: 1,
    name: "Type-C to HDMI VGA 5-in-1 Dual Display Converter",
    sku: "CJXFJTDS00064-Black",
    cost: 12.78,
    price: 29.99,
    image: "https://cf.cjdropshipping.com/203106/3190218982082.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 2,
    name: "4-in-1 Magnetic Wireless Charging Station",
    sku: "CJYD179346901AZ",
    cost: 12.37,
    price: 29.99,
    image: "https://cf.cjdropshipping.com/quick/product/6da64e9b-f353-419a-9be1-13f716dfd91b.jpg?x-oss-process=image/resize,m_pad,w_300,h_300/sharpen,100/format,jpg"
  },
  {
    id: 3,
    name: "V14 Professional 6K HD Dual Camera Drone - 2 Batteries",
    sku: "CJWR241970801AZ",
    cost: 35.0,
    price: 69.99,
    image: "https://cf.cjdropshipping.com/66ca3586-f363-4d10-b446-b93451e9f6a4.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 4,
    name: "V14 Professional 6K HD Dual Camera Drone - 3 Batteries",
    sku: "CJWR241970802BY",
    cost: 39.0,
    price: 79.99,
    image: "https://cf.cjdropshipping.com/04df2447-39a4-4c05-8b0e-c2250546f1a1.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 5,
    name: "Wireless Lavalier Microphone for iPhone",
    sku: "CJMK1698386-2in1 for IOS",
    cost: 10.98,
    price: 24.99,
    image: "https://cf.cjdropshipping.com/adbc5add-bd51-4328-84c4-106e8c198890.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  }
];

app.get("/api/products", (req, res) => {
  res.json(products);
});

function getCleanCartItems(items = []) {
  return items
    .map((item) => {
      const product = products.find((p) => p.id === Number(item.id));
      if (!product) return null;

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: Math.max(1, Number(item.quantity) || 1)
      };
    })
    .filter(Boolean);
}

function stripeAddressToCJ(shippingDetails) {
  const address = shippingDetails?.address || {};

  return {
    country: address.country || "US",
    state: address.state || "",
    city: address.city || "",
    address: [address.line1, address.line2].filter(Boolean).join(" "),
    zip: address.postal_code || "",
    name: shippingDetails?.name || "",
    phone: shippingDetails?.phone || ""
  };
}

async function sendOrderToCJ(order) {
  if (!process.env.CJ_ACCESS_TOKEN) {
    console.log("CJ skipped: missing CJ_ACCESS_TOKEN");
    return;
  }

  try {
    const response = await axios.post(
      "https://developers.cjdropshipping.cn/api2.0/v1/shopping/order/createOrderV2",
      {
        products: order.items.map((item) => ({
          productName: item.name,
          sku: item.sku,
          quantity: item.quantity
        })),
        shippingAddress: order.shippingAddress
      },
      {
        headers: {
          "CJ-Access-Token": process.env.CJ_ACCESS_TOKEN
        }
      }
    );

    console.log("Sent to CJ:", response.data);
  } catch (error) {
    console.error("CJ Error:", error.response?.data || error.message);
  }
}

async function sendConfirmationEmail({ customerEmail, customerName, items, total }) {
  if (!customerEmail || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Email skipped: missing customer email or email settings");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const itemList = items
    .map((item) => `• ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`)
    .join("\n");

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: customerEmail,
    subject: "Your order confirmation",
    text: `Hi ${customerName || "there"},

Thank you for your order!

Order summary:
${itemList}

Total: $${total.toFixed(2)}

We are processing your order now.

Thank you for shopping with us!`
  });

  console.log("Confirmation email sent to:", customerEmail);
}

app.post("/api/checkout", async (req, res) => {
  try {
    const items = getCleanCartItems(req.body.items);

    if (!items.length) {
      return res.status(400).json({ error: "Cart is empty" });
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
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name
          },
          unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity
      })),
      mode: "payment",
      success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/cancel`
    });

    pendingOrders.set(session.id, items);

    res.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error.message);
    res.status(500).json({ error: "Checkout failed" });
  }
});

app.get("/success", async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    const items = pendingOrders.get(sessionId) || [];

    if (sessionId && items.length) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["customer_details"]
      });

      const shippingAddress = stripeAddressToCJ(session.shipping_details);
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      await sendOrderToCJ({
        items,
        shippingAddress
      });

      await sendConfirmationEmail({
        customerEmail: session.customer_details?.email,
        customerName: session.customer_details?.name,
        items,
        total
      });

      pendingOrders.delete(sessionId);
    }

    res.send(`
      <html>
        <head><title>Order Successful</title></head>
        <body style="font-family: Arial; text-align:center; padding:50px;">
          <h1>Thank you for your order!</h1>
          <p>Your payment was successful and your order is being processed.</p>
          <a href="/">Back to store</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Success route error:", error.message);
    res.send("Payment successful! Your order is being processed.");
  }
});

app.get("/cancel", (req, res) => {
  res.send(`
    <html>
      <head><title>Checkout Canceled</title></head>
      <body style="font-family: Arial; text-align:center; padding:50px;">
        <h1>Checkout canceled</h1>
        <p>No payment was taken.</p>
        <a href="/">Back to store</a>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on ${BASE_URL}`);
});
