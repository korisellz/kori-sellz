import express from "express";
import cors from "cors";
import Stripe from "stripe";
import axios from "axios";
import dotenv from "dotenv";
import { Resend } from "resend";
import pg from "pg";

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const { Pool } = pg;

const PORT = process.env.PORT || 7000;
const SITE_URL = process.env.SITE_URL || "https://korisellz.com";

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
console.log("CJ API key loaded?", process.env.CJ_API_KEY || process.env.CJ_ACCESS_TOKEN ? "YES" : "NO");
console.log("Resend key loaded?", process.env.RESEND_API_KEY ? "YES" : "NO");
console.log("Admin password loaded?", process.env.ADMIN_PASSWORD ? "YES" : "NO");
console.log("Database loaded?", process.env.DATABASE_URL ? "YES" : "NO");

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
    image: "https://cf.cjdropshipping.com/quick/product/6da64e9b-f353-419a-9be1-13f716dfd91b.jpg?x-oss-process=image/resize,m_pad,w_800,h_800"
  },
  {
    id: 3,
    name: "V14 Professional 6K HD Dual Camera Drone - 2 Batteries",
    category: "Drones & Cameras",
    sku: "CJWR241970801AZ",
    cost: 35,
    price: 69.99,
    image: "https://cf.cjdropshipping.com/66ca3586-f363-4d10-b446-b93451e9f6a4.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 4,
    name: "V14 Professional 6K HD Dual Camera Drone - 3 Batteries",
    category: "Drones & Cameras",
    sku: "CJWR241970802BY",
    cost: 39,
    price: 79.99,
    image: "https://cf.cjdropshipping.com/04df2447-39a4-4c05-8b0e-c2250546f1a1.png?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 5,
    name: "Wireless Lavalier Microphone for iPhone",
    category: "Creator Tools",
    sku: "CJMK1698386-2in1 for IOS",
    cost: 10.98,
    price: 24.99,
    image: "https://cf.cjdropshipping.com/adbc5add-bd51-4328-84c4-106e8c198890.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 6,
    name: "4K Waterproof Sport Camera",
    category: "Drones & Cameras",
    sku: "CJXFXJSM00002-Black",
    cost: 8.69,
    price: 15.99,
    image: "https://cf.cjdropshipping.com/15287328/1102491960640.png?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 7,
    name: "1080P LED Mini High Definition Projector",
    category: "Tech Accessories",
    sku: "CJCJSJYDSJ00002_SKU_HERE",
    cost: 25.14,
    price: 35.99,
    image: "https://cf.cjdropshipping.com/20190617/604935516809.png?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 8,
    name: "Electronic Burglar Alarm Intelligent Home Security Door Stop Alarm",
    category: "Home Security",
    sku: "CJZN105466804DW",
    cost: 6,
    price: 19.99,
    image: "https://cf.cjdropshipping.com/1616652882290.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 9,
    name: "Electric Detangling Brush Scalp Massage Hair Brush",
    category: "Beauty",
    sku: "CJXFZNZN00544-Purple",
    cost: 5.41,
    price: 17.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/01/11/01/ed1175b4-bd77-4761-a4f1-c24037b17f2b.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 10,
    name: "60W Fast Charging Multi-function Charging Cable Storage Box",
    category: "Tech Accessories",
    sku: "CJCD144565503CX",
    cost: 0.74,
    price: 9.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/04/17/10/538aa4eb-0082-41be-8cc2-90cf619f2b08.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800"
  },
  {
    id: 11,
    name: "Car Vacuum Cleaner Powerful Mini - Car Dual-Purpose Power",
    category: "Tech Accessories",
    sku: "CJXC103967002BY",
    cost: 25.82,
    price: 29.99,
    image: "https://cf.cjdropshipping.com/1615531072424.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A portable mini car vacuum cleaner for quick cleanups, car interiors, small messes, and everyday convenience.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 12,
    name: "LED Sunset Projection Lamp",
    category: "Home Gadgets",
    sku: "CJTY115427723WD",
    cost: 35.75,
    price: 39.99,
    image: "https://cf.cjdropshipping.com/4b5880f2-2caa-448a-9f07-1803e4ed8a7b.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "Create a cozy aesthetic vibe with this LED sunset projection lamp, perfect for photos, bedrooms, videos, and relaxing spaces.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 13,
    name: "Bluetooth Sleep Headphones Eye Mask",
    category: "Tech Accessories",
    sku: "CJJT175857504DW",
    cost: 22.16,
    price: 24.99,
    image: "https://cf.cjdropshipping.com/53a65dde-8d21-4a96-8d4c-e243dbd1ae3a.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A soft Bluetooth sleep mask with built-in headphones, great for relaxing, travel, meditation, and sleeping with music or white noise.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 14,
    name: "Mini Portable Blender Cup",
    category: "Home Gadgets",
    sku: "CJJJJTCF00622-blue",
    cost: 30.97,
    price: 34.99,
    image: "https://cf.cjdropshipping.com/15584544/1173139706670.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A portable blender cup designed for smoothies, shakes, fruit drinks, and quick blends on the go.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 15,
    name: "Rechargeable Electric Makeup Brush Cleaner",
    category: "Beauty",
    sku: "CJMJ223191302BY",
    cost: 22.07,
    price: 29.99,
    image: "https://oss-cf.cjdropshipping.com/product/2024/12/04/01/ffa28e14-d497-492a-8606-deefc2397021_trans.jpeg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A rechargeable makeup brush cleaner designed to make cleaning beauty tools faster, easier, and more convenient.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 16,
    name: "Magnetic Wireless Charging Mobile Phone Car Holder",
    category: "Tech Accessories",
    sku: "CJSJ121627701AZ",
    cost: 15.42,
    price: 19.99,
    image: "https://cf.cjdropshipping.com/12a84093-bc7a-42fc-b308-d35c3e4c7e4e.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A magnetic phone holder with wireless charging support, perfect for hands-free driving and keeping your phone powered on the road.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 17,
    name: "Smart Motion Sensor LED Night Light",
    category: "Home Security",
    sku: "CJJT187400502BY",
    cost: 7.83,
    price: 9.99,
    image: "https://oss-cf.cjdropshipping.com/product/2023/10/18/09/273fe5d1-fe54-468d-89be-500f7e4c04b5.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A motion sensor LED night light for hallways, bedrooms, bathrooms, closets, and added visibility around your home.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 18,
    name: "Phone Tripod with Bluetooth Remote",
    category: "Creator Tools",
    sku: "CJYD227569301AZ",
    cost: 25.86,
    price: 29.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/01/21/02/004c7170-5f19-4226-97f2-2b5eecc305b8_trans.jpeg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A phone tripod with Bluetooth remote for selfies, content creation, livestreaming, recording, and hands-free photos.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 19,
    name: "USB Rechargeable Neck Fan",
    category: "Tech Accessories",
    sku: "CJFU241984201AZ",
    cost: 16.08,
    price: 19.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/07/04/01/81762b21-9c33-4dbd-bac7-540ba4061aa2.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A USB rechargeable neck fan designed for hands-free cooling during travel, work, outdoor activities, and hot days.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 20,
    name: "Mini WiFi Indoor Security Camera",
    category: "Home Security",
    sku: "CJJT27577190001",
    cost: 15.96,
    price: 19.99,
    image: "https://cf.cjdropshipping.com/28c4098e-9248-4316-bfbe-0c1474525187.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A compact WiFi indoor security camera for checking on rooms, pets, small spaces, and everyday home monitoring.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 21,
    name: "Rechargeable Heated Eyelash Curler",
    category: "Beauty",
    sku: "CJJJ265100603CX",
    cost: 12.81,
    price: 14.99,
    image: "https://cf.cjdropshipping.com/4a15a241-cd39-4777-aeab-92e05739aed6.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A rechargeable heated eyelash curler designed to help lift and style lashes quickly for everyday beauty routines.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 22,
    name: "LED Makeup Mirror",
    category: "Beauty",
    sku: "CJJJJTJT02992-black",
    cost: 13.31,
    price: 24.99,
    image: "https://cf.cjdropshipping.com/15641568/23132624195.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A bright LED makeup mirror designed for beauty routines, skincare, travel, and better lighting while getting ready.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 23,
    name: "Electric Facial Cleansing Brush",
    category: "Beauty",
    sku: "CJBJPFMB00672-Blue-Q1pc",
    cost: 10.72,
    price: 19.99,
    image: "https://cf.cjdropshipping.com/20200321/1960128325958.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "An electric facial cleansing brush designed to support daily skincare routines and help cleanse more effectively.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 24,
    name: "6 PCS Wireless Home Security Alarm",
    category: "Home Security",
    sku: "CJJT253279301AZ",
    cost: 8.36,
    price: 12.99,
    image: "https://cf.cjdropshipping.com/cfd297ab-a7ad-4817-9b1f-8ebaf38f7a4c.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A 6-piece wireless home security alarm set for doors, windows, apartments, dorms, and small spaces.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 25,
    name: "10 PCS Personal Alarm Safety Set",
    category: "Home Security",
    sku: "CJKY212180601AZ",
    cost: 11.83,
    price: 19.99,
    image: "https://oss-cf.cjdropshipping.com/product/2024/08/28/01/1fcf48bf-a11d-456c-9407-345f89f507ee.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A portable personal safety alarm set that can be carried on keys, bags, or backpacks for extra peace of mind.",
    shipping: "Estimated delivery: 8-23 business days after processing."
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
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 27,
    name: "360° 4-Channel Dash Cam with 32GB Memory Card",
    category: "Drones & Cameras",
    sku: "CJCZ252615501AZ",
    cost: 0,
    price: 49.99,
    image: "https://cf.cjdropshipping.com/a451d26b-9b2c-48aa-8dfb-6949d55d12fb.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "Get full driving coverage with this 360° 4-channel dash cam. It records the front, rear, left, right, and inside views to help protect your vehicle on the road or while parked. Features IR night vision, loop recording, motion detection, and includes a free 32GB memory card.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 28,
    name: "4-Channel 360° Dash Cam with 128GB Memory Card",
    category: "Drones & Cameras",
    sku: "CJQC263293701AZ",
    cost: 44.58,
    price: 50.99,
    image: "https://cf.cjdropshipping.com/a451d26b-9b2c-48aa-8dfb-6949d55d12fb.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "Drive with extra peace of mind using this 4-channel 360° dash cam. It features 1080P front recording, left and right side coverage, rear recording, night vision, G-sensor impact detection, parking monitor, loop recording, and a 128GB memory card for extended storage.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 29,
    name: "Hainatech 360° 4-Channel Dash Cam with GPS & WiFi",
    category: "Drones & Cameras",
    sku: "CJHS232611301AZ",
    cost: 87.12,
    price: 99.99,
    image: "https://cf.cjdropshipping.com/61f1303c-ee57-4ddb-8b3a-14cac921e848.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "Upgrade your car security with this Hainatech 360° 4-channel dash cam. It records front, rear, inside, left, and right views and includes built-in GPS, WiFi, night vision, 24/7 parking monitoring, loop recording, and a free 128GB memory card. Perfect for daily drivers, rideshare drivers, and road trips.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  }
];


  // Add products 11-28 here if they are not already in this list.


async function initDatabase() {
  if (!pool) {
    console.log("No DATABASE_URL found. Database disabled.");
    return;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        stripe_session_id TEXT UNIQUE,
        order_number TEXT,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        shipping_address TEXT,
        shipping_city TEXT,
        shipping_state TEXT,
        shipping_zip TEXT,
        shipping_country TEXT,
        items JSONB,
        livemode BOOLEAN,
        status TEXT,
        cj_order_id TEXT,
        error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state TEXT;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_zip TEXT;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_country TEXT;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS livemode BOOLEAN;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cj_order_id TEXT;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS error TEXT;`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`);

    console.log("Database ready");
  } catch (error) {
    console.error("Database startup error:", error.message);
  }
}

function getFullItems(itemsFromCheckout) {
  return itemsFromCheckout.map((item) => {
    const found = products.find((p) => String(p.id) === String(item.id) || p.sku === item.sku);

    return {
      id: found?.id || item.id,
      name: found?.name || item.name || "Kori Sellz Product",
      sku: found?.sku || item.sku,
      price: Number(found?.price || item.price || 0),
      cost: Number(found?.cost || item.cost || 0),
      quantity: Number(item.quantity || 1)
    };
  });
}

function makeOrderNumber(sessionId) {
  return `KS-${String(sessionId).slice(-16)}`;
}

async function getCJAccessToken() {
  if (process.env.CJ_ACCESS_TOKEN) {
    return process.env.CJ_ACCESS_TOKEN;
  }

  if (!process.env.CJ_EMAIL || !process.env.CJ_API_KEY) {
    throw new Error("Missing CJ_ACCESS_TOKEN or CJ_EMAIL/CJ_API_KEY");
  }

  const response = await axios.post(
    "https://developers.cjdropshipping.cn/api2.0/v1/authentication/getAccessToken",
    {
      email: process.env.CJ_EMAIL,
      password: process.env.CJ_API_KEY
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  const data = response.data?.data;

  const token =
    data?.accessToken ||
    data?.access_token ||
    data?.token ||
    data?.access_token_value;

  if (!token) {
    console.log("CJ auth response:", response.data);
    throw new Error("CJ access token was not returned");
  }

  return token;
}

async function sendOrderToCJ({ session, items }) {
  const token = await getCJAccessToken();

  const shipping = session.collected_information?.shipping_details || session.shipping_details || {};
  const address = shipping.address || {};
  const customer = session.customer_details || {};

  const orderNumber = makeOrderNumber(session.id);

  const cjPayload = {
    orderNumber,
    shippingZip: address.postal_code || "",
    shippingCountry: "United States",
    shippingCountryCode: address.country || "US",
    shippingProvince: address.state || "",
    shippingCity: address.city || "",
    shippingCounty: "",
    shippingPhone: customer.phone || "",
    shippingCustomerName: shipping.name || customer.name || "Customer",
    shippingAddress: address.line1 || "",
    shippingAddress2: address.line2 || "",
    email: customer.email || "",
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

  console.log("CJ payload being sent:", JSON.stringify(cjPayload, null, 2));

  const response = await axios.post(
    "https://developers.cjdropshipping.cn/api2.0/v1/shopping/order/createOrderV2",
    cjPayload,
    {
      headers: {
        "CJ-Access-Token": token,
        "Content-Type": "application/json"
      }
    }
  );

  console.log("CJ response:", response.data);

  if (!response.data?.result && !response.data?.success) {
    throw new Error(response.data?.message || "CJ order failed");
  }

  return response.data?.data?.orderId || response.data?.data?.cjOrderCode || null;
}

async function sendConfirmationEmail({ session, items, cjOrderId }) {
  if (!resend) {
    console.log("Resend not configured. Skipping email.");
    return;
  }

  const customerEmail = session.customer_details?.email;

  if (!customerEmail) {
    console.log("No customer email found. Skipping email.");
    return;
  }

  const orderNumber = makeOrderNumber(session.id);

  const itemRows = items
    .map(
      (item) => `
        <li>
          ${item.name} — Qty: ${item.quantity || 1}
        </li>
      `
    )
    .join("");

  const emailResponse = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Kori Sellz <onboarding@resend.dev>",
    to: customerEmail,
    subject: `Kori Sellz Order Confirmation ${orderNumber}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>Your Kori Sellz order has been received.</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      ${cjOrderId ? `<p><strong>CJ Order ID:</strong> ${cjOrderId}</p>` : ""}
      <h3>Items:</h3>
      <ul>${itemRows}</ul>
      <p>Shipping may take 8-23 business days after processing.</p>
      <p>You can track your order here:</p>
      <p><a href="${SITE_URL}/track.html">${SITE_URL}/track.html</a></p>
      <p>Thank you for shopping with Kori Sellz.</p>
    `
  });

  console.log("Confirmation email sent:", emailResponse);
}

async function saveOrder({ session, items, status, cjOrderId, errorMessage }) {
  if (!pool) return;

  try {
    const shipping = session.collected_information?.shipping_details || session.shipping_details || {};
    const address = shipping.address || {};
    const customer = session.customer_details || {};

    await pool.query(
      `
      INSERT INTO orders (
        stripe_session_id,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_country,
        items,
        livemode,
        status,
        cj_order_id,
        error
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      ON CONFLICT (stripe_session_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        cj_order_id = EXCLUDED.cj_order_id,
        error = EXCLUDED.error
      `,
      [
        session.id,
        makeOrderNumber(session.id),
        shipping.name || customer.name || "",
        customer.email || "",
        customer.phone || "",
        address.line1 || "",
        address.city || "",
        address.state || "",
        address.postal_code || "",
        address.country || "US",
        JSON.stringify(items),
        session.livemode || false,
        status,
        cjOrderId || null,
        errorMessage || null
      ]
    );

    console.log("Order saved to database.");
  } catch (error) {
    console.error("Database save error:", error.message);
  }
}

app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  console.log("WEBHOOK TRIGGERED");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("Payment confirmed:", session.id);

    let items = [];

    try {
      const metadataItems = session.metadata?.items || "[]";
      items = getFullItems(JSON.parse(metadataItems));
    } catch (error) {
      console.error("Item parse error:", error.message);
      items = [];
    }

    let cjOrderId = null;
    let fulfillmentError = null;

    try {
      if (session.livemode === true) {
        cjOrderId = await sendOrderToCJ({ session, items });
        console.log("CJ Order ID:", cjOrderId || "No CJ order ID found");
      } else {
        console.log("Stripe test payment detected — skipping real CJ order creation.");
        console.log("Test order items:", items);
      }
    } catch (error) {
      fulfillmentError = error.message;
      console.error("Fulfillment Error:", fulfillmentError);
    }

    try {
      await sendConfirmationEmail({ session, items, cjOrderId });
    } catch (error) {
      console.error("Email Error:", error.response?.data || error.message);
    }

    await saveOrder({
      session,
      items,
      status: fulfillmentError ? "payment_received_fulfillment_failed" : "payment_received",
      cjOrderId,
      errorMessage: fulfillmentError
    });
  }

  return res.json({ received: true });
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/checkout", async (req, res) => {
  try {
    const rawItems = req.body.items || [];

    if (!rawItems.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const items = getFullItems(rawItems);

    const subtotalCents = items.reduce((sum, item) => {
      return sum + Math.round(item.price * 100) * (item.quantity || 1);
    }, 0);

    const shippingOptions =
      subtotalCents >= 5000
        ? [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: {
                  amount: 0,
                  currency: "usd"
                },
                display_name: "Free Shipping",
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
      mode: "payment",
      customer_creation: "always",

      shipping_address_collection: {
        allowed_countries: ["US"]
      },

      phone_number_collection: {
        enabled: true
      },

      shipping_options: shippingOptions,

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

      metadata: {
        items: JSON.stringify(
          items.map((item) => ({
            id: item.id,
            sku: item.sku,
            quantity: item.quantity || 1
          }))
        )
      },

      success_url: `${SITE_URL}/success`,
      cancel_url: `${SITE_URL}/cancel`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error.message);
    res.status(500).json({ error: "Checkout failed" });
  }
});

app.get("/success", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Successful | Kori Sellz</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <main class="tracking-page">
        <div class="tracking-box">
          <h1>Payment Successful!</h1>
          <p>Your order has been received and is being processed.</p>
          <p>You will receive an email confirmation shortly.</p>
          <a class="track-link" href="/">Return to Kori Sellz</a>
        </div>
      </main>
    </body>
    </html>
  `);
});

app.get("/cancel", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Canceled | Kori Sellz</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <main class="tracking-page">
        <div class="tracking-box">
          <h1>Payment Canceled</h1>
          <p>Your payment was canceled. No order was placed.</p>
          <a class="track-link" href="/">Return to Kori Sellz</a>
        </div>
      </main>
    </body>
    </html>
  `);
});

app.get("/cj-auth-test", async (req, res) => {
  try {
    const token = await getCJAccessToken();

    res.json({
      success: true,
      message: "CJ auth worked",
      accessTokenPreview: `${token.slice(0, 6)}...${token.slice(-6)}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get("/api/track/:orderId", async (req, res) => {
  try {
    const token = await getCJAccessToken();

    const response = await axios.get(
      `https://developers.cjdropshipping.cn/api2.0/v1/shopping/order/getOrderDetail?orderId=${req.params.orderId}`,
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
      error: "Tracking lookup failed"
    });
  }
});

app.get("/api/admin/orders", async (req, res) => {
  try {
    const password = req.query.password;

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    if (!pool) {
      return res.json({
        success: true,
        orders: []
      });
    }

    const result = await pool.query(`
      SELECT
        id,
        stripe_session_id,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_country,
        items,
        livemode,
        status,
        cj_order_id,
        error,
        created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      orders: result.rows
    });
  } catch (error) {
    console.error("Admin orders error:", error.message);

    res.status(500).json({
      success: false,
      error: "Unable to load orders"
    });
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    if (!resend) {
      return res.status(500).json({
        success: false,
        error: "Email not configured"
      });
    }

    const { name, email, message } = req.body;

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

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc></url>
  <url><loc>${SITE_URL}/track.html</loc></url>
  <url><loc>${SITE_URL}/faq.html</loc></url>
  <url><loc>${SITE_URL}/shipping.html</loc></url>
  <url><loc>${SITE_URL}/contact.html</loc></url>
</urlset>`);
});

initDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});