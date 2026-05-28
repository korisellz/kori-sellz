import express from "express";
import cors from "cors";
import Stripe from "stripe";
import axios from "axios";
import dotenv from "dotenv";
import { Resend } from "resend";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 7000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

console.log("Stripe key loaded?", process.env.STRIPE_SECRET_KEY ? "YES" : "NO");
console.log("Stripe webhook secret loaded?", process.env.STRIPE_WEBHOOK_SECRET ? "YES" : "NO");
console.log("CJ API key loaded?", process.env.CJ_ACCESS_TOKEN || process.env.CJ_EMAIL ? "YES" : "NO");
console.log("Resend key loaded?", process.env.RESEND_API_KEY ? "YES" : "NO");
console.log("Admin password loaded?", process.env.ADMIN_PASSWORD ? "YES" : "NO");
console.log("Database loaded?", process.env.DATABASE_URL ? "YES" : "NO");

/* ----------------------------- PRODUCTS ----------------------------- */

const products = [
  {
    id: 1,
    name: "Type-C to HDMI VGA 5-in-1 Dual Display Converter",
    category: "Tech Accessories",
    sku: "CJXFJTDS00064-Black",
    cost: 12.78,
    price: 29.99,
    image: "https://cf.cjdropshipping.com/203106/3190218982082.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 2,
    name: "4-in-1 Magnetic Wireless Charging Station",
    category: "Tech Accessories",
    sku: "CJYD179346901AZ",
    cost: 12.37,
    price: 29.99,
    image: "https://cf.cjdropshipping.com/quick/product/6da64e9b-f353-419a-9be1-13f716dfd91b.jpg?x-oss-process=image/resize,m_pad,w_800,h_800/sharpen,100/format,jpg"
  },
  {
    id: 3,
    name: "V14 Professional 6K HD Dual Camera Drone - 2 Batteries",
    category: "Drones & Cameras",
    sku: "CJWR241970801AZ",
    cost: 35.0,
    price: 69.99,
    image: "https://cf.cjdropshipping.com/66ca3586-f363-4d10-b446-b93451e9f6a4.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 4,
    name: "V14 Professional 6K HD Dual Camera Drone - 3 Batteries",
    category: "Drones & Cameras",
    sku: "CJWR241970802BY",
    cost: 39.0,
    price: 79.99,
    image: "https://cf.cjdropshipping.com/04df2447-39a4-4c05-8b0e-c2250546f1a1.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 5,
    name: "Wireless Lavalier Microphone for iPhone",
    category: "Creator Tools",
    sku: "CJMK1698386-2in1 for IOS",
    cost: 10.98,
    price: 24.99,
    image: "https://cf.cjdropshipping.com/adbc5add-bd51-4328-84c4-106e8c198890.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 6,
    name: "4K Waterproof Sport Camera",
    category: "Drones & Cameras",
    sku: "CJXFXJSM00002-Black",
    cost: 8.69,
    price: 15.99,
    image: "https://cf.cjdropshipping.com/15287328/1102491960640.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 7,
    name: "1080P LED Mini High Definition Projector",
    category: "Tech Accessories",
    sku: "CJCJSJYDSJ00002_SKU_HERE",
    cost: 25.14,
    price: 35.99,
    image: "https://cf.cjdropshipping.com/20190617/604935516809.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 8,
    name: "Electronic Burglar Alarm Intelligent Home Security Door Stop Alarm",
    category: "Home Security",
    sku: "CJZN105466804DW",
    cost: 6.0,
    price: 19.99,
    image: "https://cf.cjdropshipping.com/1616652882290.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 9,
    name: "Electric Detangling Brush Scalp Massage Hair Brush",
    category: "Beauty",
    sku: "CJXFZNZN00544-Purple",
    cost: 5.41,
    price: 17.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/01/11/01/ed1175b4-bd77-4761-a4f1-c24037b17f2b.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 10,
    name: "60W Fast Charging Multi-function Charging Cable Storage Box",
    category: "Tech Accessories",
    sku: "CJCD144565503CX",
    cost: 0.74,
    price: 9.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/04/17/10/538aa4eb-0082-41be-8cc2-90cf619f2b08.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800"
  }
];

/* ----------------------------- DATABASE ----------------------------- */

async function initDatabase() {
  if (!pool) {
    console.log("No DATABASE_URL found. Database disabled.");
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      stripe_session_id TEXT UNIQUE NOT NULL,
      customer_name TEXT,
      customer_email TEXT,
      customer_phone TEXT,
      shipping_address TEXT,
      items JSONB,
      livemode BOOLEAN,
      status TEXT,
      cj_order_id TEXT,
      tracking_number TEXT,
      tracking_url TEXT,
      error TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS tracking_number TEXT,
    ADD COLUMN IF NOT EXISTS tracking_url TEXT;
  `);

  console.log("Database ready");
}

async function saveOrderToDatabase(order) {
  if (!pool) return null;

  const result = await pool.query(
    `
    INSERT INTO orders (
      stripe_session_id,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      items,
      livemode,
      status,
      cj_order_id,
      tracking_number,
      tracking_url,
      error
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (stripe_session_id)
    DO UPDATE SET
      customer_name = EXCLUDED.customer_name,
      customer_email = EXCLUDED.customer_email,
      customer_phone = EXCLUDED.customer_phone,
      shipping_address = EXCLUDED.shipping_address,
      items = EXCLUDED.items,
      livemode = EXCLUDED.livemode,
      status = EXCLUDED.status,
      cj_order_id = COALESCE(EXCLUDED.cj_order_id, orders.cj_order_id),
      tracking_number = COALESCE(EXCLUDED.tracking_number, orders.tracking_number),
      tracking_url = COALESCE(EXCLUDED.tracking_url, orders.tracking_url),
      error = EXCLUDED.error
    RETURNING *
    `,
    [
      order.stripeSessionId,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.shippingAddress,
      JSON.stringify(order.items || []),
      order.livemode,
      order.status,
      order.cjOrderId || null,
      order.trackingNumber || null,
      order.trackingUrl || null,
      order.error || null
    ]
  );

  return result.rows[0];
}

/* ----------------------------- STRIPE WEBHOOK ----------------------------- */
/* This must stay BEFORE app.use(express.json()) */

app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  console.log("WEBHOOK TRIGGERED");

  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      await handleCompletedCheckout(session);
    } catch (error) {
      console.error("Fulfillment Error:", error.response?.data || error.message);
    }
  }

  res.json({ received: true });
});

/* ----------------------------- MIDDLEWARE ----------------------------- */

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ----------------------------- HELPERS ----------------------------- */

function parseItemsFromSession(session) {
  try {
    return JSON.parse(session.metadata?.items || "[]");
  } catch {
    return [];
  }
}

function getShippingAddress(session) {
  const shipping =
    session.collected_information?.shipping_details ||
    session.shipping_details ||
    {};

  const address = shipping.address || {};

  return {
    name: shipping.name || session.customer_details?.name || "Customer",
    email: session.customer_details?.email || "",
    phone: session.customer_details?.phone || "",
    line1: address.line1 || "",
    line2: address.line2 || "",
    city: address.city || "",
    state: address.state || "",
    postalCode: address.postal_code || "",
    country: address.country || "US"
  };
}

function formatAddress(address) {
  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country
  ]
    .filter(Boolean)
    .join(", ");
}

function makeStoreOrderNumber(sessionId) {
  return `KS-${sessionId.slice(-16)}`;
}

async function getCJAccessToken() {
  if (process.env.CJ_ACCESS_TOKEN) {
    return process.env.CJ_ACCESS_TOKEN;
  }

  if (!process.env.CJ_EMAIL || !process.env.CJ_PASSWORD) {
    throw new Error("Missing CJ_ACCESS_TOKEN or CJ_EMAIL/CJ_PASSWORD");
  }

  const response = await axios.post(
    "https://developers.cjdropshipping.cn/api2.0/v1/authentication/getAccessToken",
    {
      email: process.env.CJ_EMAIL,
      password: process.env.CJ_PASSWORD
    }
  );

  const token =
    response.data?.data?.accessToken ||
    response.data?.data?.accessTokenValue ||
    response.data?.data;

  if (!token) {
    throw new Error("CJ access token was not returned");
  }

  return token;
}

async function sendOrderToCJ(session, items, shipping) {
  const accessToken = await getCJAccessToken();
  const orderNumber = makeStoreOrderNumber(session.id);

  const payload = {
    orderNumber,
    shippingZip: shipping.postalCode,
    shippingCountry: "United States",
    shippingCountryCode: "US",
    shippingProvince: shipping.state,
    shippingCity: shipping.city,
    shippingCounty: "",
    shippingPhone: shipping.phone || "0000000000",
    shippingCustomerName: shipping.name,
    shippingAddress: shipping.line1,
    shippingAddress2: shipping.line2 || "",
    email: shipping.email,
    remark: "Kori Sellz order from Stripe",
    logisticName: "CJPacket Ordinary",
    fromCountryCode: "CN",
    products: items.map((item, index) => ({
      sku: item.sku,
      quantity: item.quantity || 1,
      unitPrice: item.cost || item.price,
      storeLineItemId: `${orderNumber}-${index + 1}`
    }))
  };

  console.log("CJ payload being sent:", JSON.stringify(payload, null, 2));

  const response = await axios.post(
    "https://developers.cjdropshipping.cn/api2.0/v1/shopping/order/createOrderV2",
    payload,
    {
      headers: {
        "CJ-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    }
  );

  console.log("CJ response:", response.data);

  const cjOrderId =
    response.data?.data?.orderId ||
    response.data?.data?.cjOrderCode ||
    response.data?.data?.orderNumber ||
    null;

  return {
    response: response.data,
    cjOrderId
  };
}

async function sendConfirmationEmail(session, items, shipping) {
  if (!resend) {
    console.log("No Resend API key. Skipping confirmation email.");
    return;
  }

  if (!shipping.email) {
    console.log("No customer email. Skipping confirmation email.");
    return;
  }

  const orderNumber = makeStoreOrderNumber(session.id);

  const itemsHtml = items
    .map((item) => {
      const price = Number(item.price || 0).toFixed(2);
      return `<li>${item.name} — Qty: ${item.quantity || 1} — $${price}</li>`;
    })
    .join("");

  const emailResult = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Kori Sellz <onboarding@resend.dev>",
    to: shipping.email,
    subject: "Your Kori Sellz Order Confirmation",
    html: `
      <h2>Thank you for your order!</h2>
      <p>Your Kori Sellz order has been received and is now being processed.</p>

      <p><strong>Order Number:</strong> ${orderNumber}</p>

      <h3>Items Ordered:</h3>
      <ul>${itemsHtml}</ul>

      <p><strong>Shipping:</strong> Standard shipping is $5.50. Orders $50 or more receive free standard shipping. Estimated delivery is 8-23 business days after processing.</p>

      <p>You can track your order here:</p>
      <p><a href="https://korisellz.com/track.html">https://korisellz.com/track.html</a></p>

      <p>If you have questions, contact us at support@korisellz.com.</p>

      <p>Thank you for shopping with Kori Sellz!</p>
    `
  });

  console.log("Confirmation email sent:", emailResult);
}

async function handleCompletedCheckout(session) {
  console.log("Payment confirmed:", session.id);

  const items = parseItemsFromSession(session);
  const shipping = getShippingAddress(session);

  await sendConfirmationEmail(session, items, shipping);

  let status = "Paid";
  let cjOrderId = null;
  let errorMessage = null;

  if (!session.livemode) {
    console.log("Stripe test payment detected — skipping real CJ order creation.");
    console.log("Test order items:", items);
    status = "Test Paid";
  } else {
    try {
      const cjResult = await sendOrderToCJ(session, items, shipping);
      cjOrderId = cjResult.cjOrderId;
      status = cjOrderId ? "Sent to CJ" : "CJ Sent - No ID Returned";
      console.log("CJ Order ID:", cjOrderId || "No CJ order ID found");
    } catch (error) {
      status = "CJ Error";
      errorMessage = JSON.stringify(error.response?.data || error.message);
      console.error("CJ Error:", error.response?.data || error.message);
    }
  }

  await saveOrderToDatabase({
    stripeSessionId: session.id,
    customerName: shipping.name,
    customerEmail: shipping.email,
    customerPhone: shipping.phone,
    shippingAddress: formatAddress(shipping),
    items,
    livemode: session.livemode,
    status,
    cjOrderId,
    error: errorMessage
  });
}

/* ----------------------------- ROUTES ----------------------------- */

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/checkout", async (req, res) => {
  try {
    const items = req.body.items || [];

    if (!items.length) {
      return res.status(400).json({
        error: "Cart is empty"
      });
    }

    const subtotal = items.reduce((sum, item) => {
      return sum + Number(item.price) * (item.quantity || 1);
    }, 0);

    const shippingOptions =
      subtotal >= 50
        ? [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: {
                  amount: 0,
                  currency: "usd"
                },
                display_name: "Free Standard Shipping",
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
          ]
        : [
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
          ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      shipping_address_collection: {
        allowed_countries: ["US"]
      },

      shipping_options: shippingOptions,

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
          unit_amount: Math.round(Number(item.price) * 100)
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

    res.json({
      url: session.url
    });
  } catch (error) {
    console.error("Checkout error:", error.message);

    res.status(500).json({
      error: "Checkout failed",
      details: error.message
    });
  }
});

app.get("/success", (req, res) => {
  res.send("Payment successful! Your order is being processed.");
});

app.get("/cancel", (req, res) => {
  res.send("Payment canceled.");
});

app.get("/api/track/:search", async (req, res) => {
  try {
    const search = decodeURIComponent(req.params.search).trim();

    if (!search) {
      return res.status(400).json({
        success: false,
        error: "Please enter an order number or tracking number."
      });
    }

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Database not connected."
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE
        id::text = $1
        OR stripe_session_id = $1
        OR cj_order_id = $1
        OR tracking_number = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [search]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found. Please check the number and try again."
      });
    }

    const order = result.rows[0];

    res.json({
      success: true,
      message: "Order found",
      order: {
        id: order.id,
        status: order.status || "Processing",
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        cjOrderId: order.cj_order_id,
        trackingNumber: order.tracking_number,
        trackingUrl: order.tracking_url,
        createdAt: order.created_at,
        items: order.items
      }
    });
  } catch (error) {
    console.error("Tracking lookup error:", error.message);

    res.status(500).json({
      success: false,
      error: "Tracking lookup failed."
    });
  }
});

app.get("/api/admin/orders", async (req, res) => {
  try {
    const password = req.query.password;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Database not connected"
      });
    }

    const result = await pool.query(`
      SELECT *
      FROM orders
      ORDER BY created_at DESC
      LIMIT 100
    `);

    const orders = result.rows.map((order) => ({
      id: order.id,
      stripeSessionId: order.stripe_session_id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      shippingAddress: order.shipping_address,
      items: order.items,
      livemode: order.livemode,
      status: order.status,
      cjOrderId: order.cj_order_id,
      trackingNumber: order.tracking_number,
      trackingUrl: order.tracking_url,
      error: order.error,
      createdAt: order.created_at,

      stripe_session_id: order.stripe_session_id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      shipping_address: order.shipping_address,
      cj_order_id: order.cj_order_id,
      tracking_number: order.tracking_number,
      tracking_url: order.tracking_url,
      created_at: order.created_at
    }));

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Admin orders error:", error.message);

    res.status(500).json({
      success: false,
      error: "Failed to load orders"
    });
  }
});

app.post("/api/admin/update-tracking", async (req, res) => {
  try {
    const { password, orderId, trackingNumber, trackingUrl } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    if (!orderId || !trackingNumber) {
      return res.status(400).json({
        success: false,
        error: "Order ID and tracking number are required"
      });
    }

    if (!pool) {
      return res.status(500).json({
        success: false,
        error: "Database not connected"
      });
    }

    const result = await pool.query(
      `
      UPDATE orders
      SET
        tracking_number = $1,
        tracking_url = $2,
        status = 'Processing - Tracking Created'
      WHERE id = $3
      RETURNING *
      `,
      [trackingNumber, trackingUrl || null, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    res.json({
      success: true,
      message: "Tracking updated successfully",
      order: result.rows[0]
    });
  } catch (error) {
    console.error("Update tracking error:", error.message);

    res.status(500).json({
      success: false,
      error: "Failed to update tracking"
    });
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!resend) {
      return res.status(500).json({
        success: false,
        error: "Email service not configured"
      });
    }

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and message are required"
      });
    }

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Kori Sellz <onboarding@resend.dev>",
      to: process.env.SUPPORT_INBOX || "support@korisellz.com",
      subject: `New Kori Sellz Contact Form Message from ${name}`,
      html: `
        <h2>New Contact Form Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });

    res.json({
      success: true,
      message: "Message sent successfully"
    });
  } catch (error) {
    console.error("Contact form email error:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: "Message failed to send"
    });
  }
});

/* ----------------------------- CJ TEST ROUTES ----------------------------- */

app.get("/cj-auth-test", async (req, res) => {
  try {
    const token = await getCJAccessToken();

    res.json({
      success: true,
      message: "CJ auth worked",
      accessTokenPreview: `${String(token).slice(0, 6)}...${String(token).slice(-6)}`
    });
  } catch (error) {
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
      "https://developers.cjdropshipping.cn/api2.0/v1/product/list?pageNum=1&pageSize=1",
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
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

/* ----------------------------- START SERVER ----------------------------- */

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database startup error:", error.message);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} without database`);
    });
  });