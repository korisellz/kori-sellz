import express from "express";
import cors from "cors";
import Stripe from "stripe";
import axios from "axios";
import dotenv from "dotenv";
import { Resend } from "resend";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

console.log("Stripe key loaded?", process.env.STRIPE_SECRET_KEY ? "YES" : "NO");
console.log("Stripe webhook secret loaded?", process.env.STRIPE_WEBHOOK_SECRET ? "YES" : "NO");
console.log("CJ API key loaded?", process.env.CJ_API_KEY ? "YES" : "NO");
console.log("Resend key loaded?", process.env.RESEND_API_KEY ? "YES" : "NO");
console.log("Admin password loaded?", process.env.ADMIN_PASSWORD ? "YES" : "NO");
console.log("Database loaded?", process.env.DATABASE_URL ? "YES" : "NO");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

const SITE_URL = process.env.SITE_URL || "https://kori-sellz.onrender.com";

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })
  : null;

let cachedCJAccessToken = null;

const products = [
  {
    id: 1,
    name: "Type-C to HDMI VGA 5-in-1 Dual Display Converter",
    category: "Tech Accessories",
    sku: "CJXFJTDS00064-Black",
    cost: 19.56,
    price: 24.99,
    image: "https://cf.cjdropshipping.com/203106/3190218982082.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 2,
    name: "4-in-1 Magnetic Wireless Charging Station",
    category: "Tech Accessories",
    sku: "CJYD179346901AZ",
    cost: 23.41,
    price: 29.99,
    image: "https://cf.cjdropshipping.com/quick/product/6da64e9b-f353-419a-9be1-13f716dfd91b.jpg?x-oss-process=image/resize,m_pad,w_800,h_800/sharpen,100/format,jpg"
  },
  {
    id: 3,
    name: "V14 Professional 6K HD Dual Camera Drone - 2 Batteries",
    category: "Drones & Cameras",
    sku: "CJWR241970801AZ",
    cost: 35.00,
    price: 39.99,
    image: "https://cf.cjdropshipping.com/66ca3586-f363-4d10-b446-b93451e9f6a4.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 4,
    name: "V14 Professional 6K HD Dual Camera Drone - 3 Batteries",
    category: "Drones & Cameras",
    sku: "CJWR241970802BY",
    cost: 39.00,
    price: 49.99,
    image: "https://cf.cjdropshipping.com/04df2447-39a4-4c05-8b0e-c2250546f1a1.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 5,
    name: "Wireless Lavalier Microphone for iPhone",
    category: "Creator Tools",
    sku: "CJMK1698386-2in1 for IOS",
    cost: 12.98,
    price: 24.99,
    image: "https://cf.cjdropshipping.com/adbc5add-bd51-4328-84c4-106e8c198890.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 6,
    name: "4K Waterproof Sport Camera",
    category: "Drones & Cameras",
    sku: "CJXFXJSM00002-Black",
    cost: 22.57,
    price: 29.99,
    image: "https://cf.cjdropshipping.com/15287328/1102491960640.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 7,
    name: "1080P LED Mini High Definition Projector",
    category: "Home Gadgets",
    sku: "CJCJSJYDSJ00002_SKU_HERE",
    cost: 7.26,
    price: 10.99,
    image: "https://cf.cjdropshipping.com/20190617/604935516809.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 8,
    name: "Electronic Burglar Alarm Intelligent Home Security Door Stop Alarm",
    category: "Home Security",
    sku: "CJZN105466804DW",
    cost: 7.54,
    price: 9.99,
    image: "https://cf.cjdropshipping.com/1616652882290.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 9,
    name: "Electric Detangling Brush Scalp Massage Hair Brush",
    category: "Beauty",
    sku: "CJXFZNZN00544-Purple",
    cost: 12.66,
    price: 17.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/01/11/01/ed1175b4-bd77-4761-a4f1-c24037b17f2b.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 10,
    name: "60W Fast Charging Multi-function Charging Cable Storage Box",
    category: "Tech Accessories",
    sku: "CJCD144565503CX",
    cost: 6.31,
    price: 9.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/04/17/10/538aa4eb-0082-41be-8cc2-90cf619f2b08.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 11,
    name: "Car Vacuum Cleaner Powerful Mini - Car Dual - Purpose Power",
    category: "Tech Accessories",
    sku: "CJXC103967002BY",
    cost: 25.82,
    price: 29.99,
    image: "https://cf.cjdropshipping.com/1615531072424.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 12,
    name: "LED Sunset Projection Lamp",
    category: "Home Gadgets",
    sku: "CJTY115427723WD",
    cost: 35.75,
    price: 39.99,
    image: "https://cf.cjdropshipping.com/4b5880f2-2caa-448a-9f07-1803e4ed8a7b.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 13,
    name: "Bluetooth Sleep Headphones Eye Mask",
    category: "Tech Accessories",
    sku: "CJJT175857504DW",
    cost: 22.16,
    price: 24.99,
    image: "https://cf.cjdropshipping.com/53a65dde-8d21-4a96-8d4c-e243dbd1ae3a.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 14,
    name: "Mini Portable Blender Cup",
    category: "Home Gadgets",
    sku: "CJJJJTCF00622-blue",
    cost: 30.97,
    price: 34.99,
    image: "https://cf.cjdropshipping.com/15584544/1173139706670.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 15,
    name: "Rechargeable Electric Makeup Brush Cleaner",
    category: "Beauty",
    sku: "CJMJ223191302BY",
    cost: 22.07,
    price: 29.99,
    image: "https://oss-cf.cjdropshipping.com/product/2024/12/04/01/ffa28e14-d497-492a-8606-deefc2397021_trans.jpeg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 16,
    name: "Magnetic Wireless Charging Mobile Phone Car Holder Magnetic Car Holder",
    category: "Tech Accessories",
    sku: "CJSJ121627701AZ",
    cost: 15.42,
    price: 19.99,
    image: "https://cf.cjdropshipping.com/12a84093-bc7a-42fc-b308-d35c3e4c7e4e.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 17,
    name: "Smart Motion Sensor LED Night Light",
    category: "Home Security",
    sku: "CJJT187400502BY",
    cost: 7.83,
    price: 9.99,
    image: "https://oss-cf.cjdropshipping.com/product/2023/10/18/09/273fe5d1-fe54-468d-89be-500f7e4c04b5.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 18,
    name: "Phone Tripod with Bluetooth Remote",
    category: "Creator Tools",
    sku: "CJYD227569301AZ",
    cost: 25.86,
    price: 29.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/01/21/02/004c7170-5f19-4226-97f2-2b5eecc305b8_trans.jpeg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 19,
    name: "USB Rechargeable Neck Fan",
    category: "Tech Accessories",
    sku: "CJFU241984201AZ",
    cost: 16.08,
    price: 19.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/07/04/01/81762b21-9c33-4dbd-bac7-540ba4061aa2.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 20,
    name: "Mini WiFi Indoor Security Camera",
    category: "Home Security",
    sku: "CJJT27577190001",
    cost: 15.96,
    price: 19.99,
    image: "https://cf.cjdropshipping.com/28c4098e-9248-4316-bfbe-0c1474525187.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 21,
    name: "Rechargeable Heated Eyelash Curler",
    category: "Beauty",
    sku: "CJJJ265100603CX",
    cost: 12.81,
    price: 14.99,
    image: "https://cf.cjdropshipping.com/4a15a241-cd39-4777-aeab-92e05739aed6.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 22,
    name: "LED makeup mirror",
    category: "Beauty",
    sku: "CJJJJTJT02992-black",
    cost: 13.31,
    price: 24.99,
    image: "https://cf.cjdropshipping.com/15641568/23132624195.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 23,
    name: "Electric Facial Cleansing Brush",
    category: "Beauty",
    sku: "CJBJPFMB00672-Blue-Q1pc",
    cost: 10.72,
    price: 19.99,
    image: "https://cf.cjdropshipping.com/20200321/1960128325958.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 24,
    name: "6 PCS WIRELESS Home Security ALARM",
    category: "Home Security",
    sku: "CJJT253279301AZ",
    cost: 8.36,
    price: 12.99,
    image: "https://cf.cjdropshipping.com/cfd297ab-a7ad-4817-9b1f-8ebaf38f7a4c.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 25,
    name: "10 PCS Personal Alarm Safety Set",
    category: "Home Security",
    sku: "CJKY212180601AZ",
    cost: 11.83,
    price: 19.99,
    image: "https://oss-cf.cjdropshipping.com/product/2024/08/28/01/1fcf48bf-a11d-456c-9407-345f89f507ee.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
  id: 26,
  name: "1080P Wireless WiFi Video Doorbell Camera",
  category: "Home Security",
  sku: "CJJD245497601AZ",
  cost: 15.23,
  price: 29.99,
  image: "https://cf.cjdropshipping.com/8083315b-22af-4500-9357-84195d8d7b51.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
  description: "A budget-friendly wireless video doorbell camera with 1080P video, motion detection, night vision, two-way audio, and mobile app alerts. Great for apartments, homes, and small businesses.",
  shipping: "Estimated delivery: 7-20 business days after processing."
}
];

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function initDatabase() {
  if (!pool) {
    console.log("No DATABASE_URL found. Database disabled.");
    return;
  }

  const createOrdersTableSQL =
    "CREATE TABLE IF NOT EXISTS orders (" +
    "id SERIAL PRIMARY KEY, " +
    "stripe_session_id TEXT UNIQUE NOT NULL, " +
    "customer_name TEXT, " +
    "customer_email TEXT, " +
    "customer_phone TEXT, " +
    "amount_total NUMERIC, " +
    "currency TEXT, " +
    "items JSONB, " +
    "livemode BOOLEAN, " +
    "status TEXT, " +
    "cj_order_id TEXT, " +
    "error TEXT, " +
    "created_at TIMESTAMPTZ DEFAULT NOW()" +
    ");";

  await pool.query(createOrdersTableSQL);

  console.log("Database ready");
}

async function saveOrder(order) {
  if (!pool) {
    console.log("No database connected. Order not saved permanently.");
    return;
  }

  const errorText =
    typeof order.error === "string"
      ? order.error
      : order.error
      ? JSON.stringify(order.error)
      : null;

  await pool.query(
    "INSERT INTO orders (" +
      "stripe_session_id, customer_name, customer_email, customer_phone, amount_total, currency, items, livemode, status, cj_order_id, error, created_at" +
      ") VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12) " +
      "ON CONFLICT (stripe_session_id) DO UPDATE SET " +
      "customer_name = EXCLUDED.customer_name, " +
      "customer_email = EXCLUDED.customer_email, " +
      "customer_phone = EXCLUDED.customer_phone, " +
      "amount_total = EXCLUDED.amount_total, " +
      "currency = EXCLUDED.currency, " +
      "items = EXCLUDED.items, " +
      "livemode = EXCLUDED.livemode, " +
      "status = EXCLUDED.status, " +
      "cj_order_id = EXCLUDED.cj_order_id, " +
      "error = EXCLUDED.error;",
    [
      order.stripeSessionId,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.amountTotal,
      order.currency,
      JSON.stringify(order.items || []),
      order.livemode,
      order.status,
      order.cjOrderId || null,
      errorText,
      order.createdAt
    ]
  );

  console.log("Order saved to database");
}

async function getOrdersFromDatabase() {
  if (!pool) {
    return [];
  }

  const result = await pool.query(
    "SELECT * FROM orders ORDER BY created_at DESC LIMIT 100;"
  );

  return result.rows.map((row) => ({
    stripeSessionId: row.stripe_session_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    amountTotal: Number(row.amount_total || 0),
    currency: row.currency || "usd",
    items: row.items || [],
    livemode: row.livemode,
    status: row.status,
    cjOrderId: row.cj_order_id,
    error: row.error,
    createdAt: row.created_at
  }));
}

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

  if (!response.data || !response.data.data || !response.data.data.accessToken) {
    throw new Error("CJ auth failed: " + JSON.stringify(response.data));
  }

  cachedCJAccessToken = response.data.data.accessToken;

  console.log("CJ access token generated");

  return cachedCJAccessToken;
}

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
      return res.status(400).send("Webhook Error: " + err.message);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      console.log("WEBHOOK TRIGGERED");
      console.log("Payment confirmed:", session.id);

      await fulfillOrder(session);
    }

    res.json({ received: true });
  }
);

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

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

async function sendCustomerConfirmationEmail(session, items) {
  try {
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name || "there";

    if (!customerEmail) {
      console.log("No customer email found. Skipping email.");
      return;
    }

    if (!process.env.RESEND_API_KEY) {
      console.log("No Resend API key found. Skipping email.");
      return;
    }

    const itemsHtml = items
      .map((item) => {
        return (
          '<li style="margin-bottom:10px;">' +
          "<strong>" +
          escapeHtml(item.name) +
          "</strong><br>" +
          "Quantity: " +
          escapeHtml(item.quantity || 1) +
          "<br>" +
          "Price: $" +
          Number(item.price).toFixed(2) +
          "</li>"
        );
      })
      .join("");

    const html =
      '<div style="font-family: Arial, sans-serif; background:#0b0d1f; color:white; padding:30px;">' +
      '<div style="max-width:600px; margin:auto; background:#15172e; padding:25px; border-radius:18px;">' +
      '<h1 style="color:white;">Thank you for shopping with Kori Sellz!</h1>' +
      "<p>Hi " +
      escapeHtml(customerName) +
      ",</p>" +
      "<p>Your payment was successful and your order is now being processed.</p>" +
      "<h2>Order Summary</h2>" +
      '<ul style="padding-left:20px;">' +
      itemsHtml +
      "</ul>" +
      "<p>You will receive tracking information once your order ships.</p>" +
      "<p>You can track your order here:</p>" +
      '<a href="' +
      SITE_URL +
      '/track.html" style="display:inline-block; background:white; color:#151B54; padding:12px 18px; border-radius:10px; text-decoration:none; font-weight:bold;">Track My Order</a>' +
      '<p style="margin-top:25px;">Thank you for supporting Kori Sellz.</p>' +
      '<p style="color:#aaa; font-size:13px;">This is an automated confirmation email.</p>' +
      "</div>" +
      "</div>";

    const emailResponse = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Kori Sellz <onboarding@resend.dev>",
      to: customerEmail,
      subject: "Your Kori Sellz order is confirmed",
      html
    });

    if (emailResponse.error) {
      console.error("Email Error:", emailResponse.error);
      return;
    }

    console.log("Confirmation email sent:", emailResponse.data);
  } catch (error) {
    console.error("Email Error:", error.message);
  }
}

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
      storeLineItemId: order.orderNumber + "-" + (index + 1)
    }))
  };

  console.log("CJ payload being sent:", JSON.stringify(payload, null, 2));

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

  console.log("CJ response:", response.data);

  if (!response.data?.result) {
    throw new Error("CJ rejected order: " + JSON.stringify(response.data));
  }

  return response.data;
}

async function fulfillOrder(session) {
  let baseOrderRecord = null;

  try {
    const items = JSON.parse(session.metadata.items);

    baseOrderRecord = {
      stripeSessionId: session.id,
      customerName: session.customer_details?.name || "",
      customerEmail: session.customer_details?.email || "",
      customerPhone: session.customer_details?.phone || "",
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency || "usd",
      items,
      livemode: session.livemode,
      createdAt: new Date().toISOString(),
      status: "Payment confirmed",
      cjOrderId: null
    };

    await sendCustomerConfirmationEmail(session, items);

    if (!session.livemode) {
      await saveOrder({
        ...baseOrderRecord,
        status: "Test payment - CJ skipped"
      });

      console.log("Stripe test payment detected - skipping real CJ order creation.");
      console.log("Test order items:", items);
      return;
    }

    const shipping =
      session.collected_information?.shipping_details?.address ||
      session.customer_details?.address;

    const orderNumber = "KS-" + session.id.slice(-20);

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

    await saveOrder({
      ...baseOrderRecord,
      status: "Forwarded to CJ",
      cjOrderId
    });

    console.log("CJ Order ID:", cjOrderId);
    console.log("Order forwarded to CJ successfully.");
  } catch (error) {
    const errorMessage = error.response?.data || error.message;

    if (baseOrderRecord) {
      await saveOrder({
        ...baseOrderRecord,
        status: "Fulfillment error",
        error: errorMessage
      });
    }

    console.error("Fulfillment Error:", errorMessage);
  }
}
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, orderNumber, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and message are required."
      });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Email service is not configured."
      });
    }

    const supportEmail = process.env.SUPPORT_EMAIL || "support@korisellz.com";

    const emailResponse = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Kori Sellz <onboarding@resend.dev>",
      to: supportEmail,
      replyTo: email,
      subject: orderNumber
        ? `New Kori Sellz message for order ${orderNumber}`
        : "New Kori Sellz contact form message",
      html:
        "<div style='font-family: Arial, sans-serif; padding: 20px;'>" +
        "<h2>New Kori Sellz Contact Message</h2>" +
        "<p><strong>Name:</strong> " + escapeHtml(name) + "</p>" +
        "<p><strong>Email:</strong> " + escapeHtml(email) + "</p>" +
        "<p><strong>Order Number:</strong> " + escapeHtml(orderNumber || "Not provided") + "</p>" +
        "<p><strong>Message:</strong></p>" +
        "<div style='background:#f4f4f4; padding:15px; border-radius:10px;'>" +
        escapeHtml(message).replaceAll("\\n", "<br>") +
        "</div>" +
        "</div>"
    });

    if (emailResponse.error) {
      console.error("Contact form email error:", emailResponse.error);

      return res.status(500).json({
        success: false,
        error: "Email failed to send."
      });
    }

    console.log("Contact form message sent:", emailResponse.data);

    res.json({
      success: true,
      message: "Message sent successfully."
    });
  } catch (error) {
    console.error("Contact form error:", error.message);

    res.status(500).json({
      success: false,
      error: "Contact form failed."
    });
  }
});
app.post("/api/checkout", async (req, res) => {
  try {
    const items = req.body.items;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      shipping_address_collection: {
        allowed_countries: ["US"]
      },

      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 550,
              currency: "usd"
            },
            display_name: "Standard Shipping",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 8
              },
              maximum: {
                unit: "business_day",
                value: 23
              }
            }
          }
        }
      ],

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
        quantity: item.quantity || 1
      })),

      mode: "payment",

      metadata: {
        items: JSON.stringify(items)
      },

      success_url: "https://korisellz.com/success",
      cancel_url: "https://korisellz.com/cancel"
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
      "https://developers.cjdropshipping.com/api2.0/v1/shopping/order/getOrderDetail?orderId=" +
        encodeURIComponent(req.params.orderId),
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

app.get("/api/admin/orders", async (req, res) => {
  const password = req.query.password;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  try {
    const orders = await getOrdersFromDatabase();

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Admin orders error:", error.message);

    res.status(500).json({
      success: false,
      error: "Could not load orders"
    });
  }
});

app.get("/success", (req, res) => {
  res.send(
    "<h1>Payment successful!</h1>" +
      "<p>Your order is being processed.</p>" +
      "<p>You can track your order once tracking becomes available.</p>" +
      '<a href="/track.html">Track Order</a>' +
      "<br><br>" +
      '<a href="/">Return to Kori Sellz</a>'
  );
});

app.get("/cancel", (req, res) => {
  res.send(
    "<h1>Payment canceled</h1>" +
      "<p>Your order was not completed.</p>" +
      '<a href="/">Return to Kori Sellz</a>'
  );
});

const PORT = process.env.PORT || 7000;

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server running on port " + PORT);
    });
  })
  .catch((error) => {
    console.error("Database startup error:", error.message);

    app.listen(PORT, () => {
      console.log("Server running on port " + PORT + " without database");
    });
  });
