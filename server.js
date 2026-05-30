import express from "express";
import cors from "cors";
import Stripe from "stripe";
import axios from "axios";
import dotenv from "dotenv";
import { Resend } from "resend";
import pg from "pg";

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const { Pool } = pg;

const PORT = process.env.PORT || 7000;
const SITE_URL = process.env.SITE_URL || "https://korisellz.com";
const SUPPORT_INBOX = process.env.SUPPORT_INBOX || "korisellz@gmail.com";
const EMAIL_FROM = process.env.EMAIL_FROM || "Kori Sellz <support@korisellz.com>";

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
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
    image: "https://cf.cjdropshipping.com/203106/3190218982082.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800",
    description: "A compact 5-in-1 Type-C adapter for HDMI, VGA, USB, and display connection needs.",
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 Type-C 5-in-1 converter"]
  },
  {
    id: 2,
    name: "4-in-1 Magnetic Wireless Charging Station",
    category: "Tech Accessories",
    sku: "CJYD179346901AZ",
    cost: 12.37,
    price: 29.99,
    image: "https://cf.cjdropshipping.com/quick/product/6da64e9b-f353-419a-9be1-13f716dfd91b.jpg?x-oss-process=image/resize,m_pad,w_800,h_800",
    description: "A sleek wireless charging station for keeping your everyday devices charged in one place.",
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 magnetic charging station", "1 charging cable"]
  },
  {
    id: 3,
    name: "V14 Professional 6K HD Dual Camera Drone - 2 Batteries",
    category: "Drones & Cameras",
    sku: "CJWR241970801AZ",
    cost: 35,
    price: 69.99,
    image: "https://cf.cjdropshipping.com/66ca3586-f363-4d10-b446-b93451e9f6a4.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800",
    description: "A dual camera drone made for aerial photos, videos, and beginner-friendly flying.",
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 V14 drone", "1 remote controller", "2 batteries", "1 USB charging cable", "Replacement propellers"]
  },
  {
    id: 4,
    name: "V14 Professional 6K HD Dual Camera Drone - 3 Batteries",
    category: "Drones & Cameras",
    sku: "CJWR241970802BY",
    cost: 39,
    price: 79.99,
    image: "https://cf.cjdropshipping.com/04df2447-39a4-4c05-8b0e-c2250546f1a1.png?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800",
    description: "A dual camera drone bundle with extra battery time for longer flights and content capture.",
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 V14 drone", "1 remote controller", "3 batteries", "1 USB charging cable", "Replacement propellers"]
  },
  {
    id: 5,
    name: "Wireless Lavalier Microphone for iPhone",
    category: "Creator Tools",
    sku: "CJMK1698386-2in1 for IOS",
    cost: 10.98,
    price: 24.99,
    image: "https://cf.cjdropshipping.com/adbc5add-bd51-4328-84c4-106e8c198890.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800",
    description: "A wireless lavalier microphone for videos, TikToks, interviews, livestreaming, and creator content.",
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["2 wireless microphones", "1 iPhone receiver", "1 charging cable"]
  },
  {
    id: 6,
    name: "4K Waterproof Sport Camera",
    category: "Drones & Cameras",
    sku: "CJXFXJSM00002-Black",
    cost: 8.69,
    price: 15.99,
    image: "https://cf.cjdropshipping.com/15287328/1102491960640.png?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800",
    description: "A small waterproof-style sports camera for outdoor videos, travel clips, and action shots.",
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 sport camera", "1 charging cable", "Mount accessories"]
  },
  {
    id: 7,
    name: "1080P LED Mini High Definition Projector",
    category: "Tech Accessories",
    sku: "CJCJSJYDSJ00002_SKU_HERE",
    cost: 25.14,
    price: 35.99,
    image: "https://cf.cjdropshipping.com/20190617/604935516809.png?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800",
    description: "A mini projector for cozy movie nights, bedroom setups, gaming, and simple entertainment spaces.",
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 mini projector", "1 power cable", "1 remote"]
  },
  {
    id: 8,
    name: "Electronic Burglar Alarm Intelligent Home Security Door Stop Alarm",
    category: "Home Security",
    sku: "CJZN105466804DW",
    cost: 6,
    price: 19.99,
    image: "https://cf.cjdropshipping.com/1616652882290.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800",
    description: "A door stop alarm that helps add extra security for apartments, hotel rooms, dorms, and homes.",
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 door stop alarm"]
  },
  {
    id: 9,
    name: "Electric Detangling Brush Scalp Massage Hair Brush",
    category: "Beauty",
    sku: "CJXFZNZN00544-Purple",
    cost: 5.41,
    price: 17.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/01/11/01/ed1175b4-bd77-4761-a4f1-c24037b17f2b.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800",
    description: "A detangling brush designed to help with daily hair care while giving a gentle scalp massage feel.",
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 electric detangling brush"]
  },
  {
    id: 10,
    name: "60W Fast Charging Multi-function Charging Cable Storage Box",
    category: "Tech Accessories",
    sku: "CJCD144565503CX",
    cost: 0.74,
    price: 9.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/04/17/10/538aa4eb-0082-41be-8cc2-90cf619f2b08.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800",
    description: "A travel-friendly charging cable storage box with fast charging support for everyday convenience.",
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 charging cable storage box"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 mini car vacuum", "Cleaning attachments", "1 charging cable"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 sunset lamp", "1 power cable"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 Bluetooth sleep mask", "1 charging cable"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 portable blender cup", "1 charging cable"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 makeup brush cleaner", "1 charging cable"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 magnetic car phone holder", "1 charging cable"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 motion sensor LED light"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 phone tripod", "1 Bluetooth remote"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 rechargeable neck fan", "1 charging cable"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 mini WiFi camera", "1 charging cable", "Mount accessories"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 heated eyelash curler", "1 charging cable"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 LED makeup mirror"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 facial cleansing brush"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["6 wireless alarm pieces"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["10 personal safety alarms"]
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
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 wireless doorbell camera", "Mounting accessories", "1 charging cable"]
  },
  {
    id: 27,
    name: "360° 4-Channel Dash Cam with 32GB Memory Card",
    category: "Drones & Cameras",
    sku: "CJCZ252615501AZ",
    cost: 0,
    price: 49.99,
    image: "https://cf.cjdropshipping.com/a451d26b-9b2c-48aa-8dfb-6949d55d12fb.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A 360° 4-channel dash cam for front, rear, side, and inside coverage. Includes IR night vision, loop recording, motion detection, and a 32GB memory card.",
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 dash cam system", "1 32GB memory card", "Camera wires", "Mount accessories"]
  },
  {
    id: 28,
    name: "4-Channel 360° Dash Cam with 128GB Memory Card",
    category: "Drones & Cameras",
    sku: "CJQC263293701AZ",
    cost: 44.58,
    price: 50.99,
    image: "https://cf.cjdropshipping.com/a451d26b-9b2c-48aa-8dfb-6949d55d12fb.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A 4-channel 360° dash cam with 1080P front recording, side coverage, rear recording, night vision, G-sensor impact detection, parking monitor, loop recording, and a 128GB memory card.",
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 dash cam system", "1 128GB memory card", "Camera wires", "Mount accessories"]
  },
  {
    id: 29,
    name: "Hainatech 360° 4-Channel Dash Cam with GPS & WiFi",
    category: "Drones & Cameras",
    sku: "CJHS232611301AZ",
    cost: 87.12,
    price: 99.99,
    image: "https://cf.cjdropshipping.com/61f1303c-ee57-4ddb-8b3a-14cac921e848.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A Hainatech 360° 4-channel dash cam with built-in GPS, WiFi, night vision, 24/7 parking monitoring, loop recording, and a 128GB memory card.",
    shipping: "Estimated delivery: 8-23 business days after processing.",
    whatsInBox: ["1 dash cam system", "1 128GB memory card", "GPS/WiFi supported unit", "Camera wires", "Mount accessories"]
  }
];

function safeText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeOrderNumber(sessionId) {
  return `KS-${String(sessionId).slice(-16)}`;
}

function getFullItems(itemsFromCheckout = []) {
  return itemsFromCheckout.map((item) => {
    const found = products.find((p) => String(p.id) === String(item.id) || p.sku === item.sku);

    return {
      id: found?.id || item.id,
      name: found?.name || item.name || "Kori Sellz Product",
      category: found?.category || item.category || "Kori Sellz",
      sku: found?.sku || item.sku,
      price: Number(found?.price || item.price || 0),
      cost: Number(found?.cost || item.cost || 0),
      image: found?.image || item.image || "",
      quantity: Number(item.quantity || 1)
    };
  });
}

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
        tracking_number TEXT,
        tracking_url TEXT,
        error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const columns = [
      "stripe_session_id TEXT UNIQUE",
      "order_number TEXT",
      "customer_name TEXT",
      "customer_email TEXT",
      "customer_phone TEXT",
      "shipping_address TEXT",
      "shipping_city TEXT",
      "shipping_state TEXT",
      "shipping_zip TEXT",
      "shipping_country TEXT",
      "items JSONB",
      "livemode BOOLEAN",
      "status TEXT",
      "cj_order_id TEXT",
      "tracking_number TEXT",
      "tracking_url TEXT",
      "error TEXT",
      "created_at TIMESTAMPTZ DEFAULT NOW()"
    ];

    for (const column of columns) {
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ${column};`);
    }
await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;`);
await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier TEXT;`);
    console.log("Database ready");
  } catch (error) {
    console.error("Database startup error:", error.message);
  }
}

async function getCJAccessToken() {
  if (process.env.CJ_ACCESS_TOKEN) {
    return process.env.CJ_ACCESS_TOKEN;
  }

  if (!process.env.CJ_API_KEY) {
    throw new Error("Missing CJ_API_KEY");
  }

  const response = await axios.post(
    "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
    { apiKey: process.env.CJ_API_KEY },
    { headers: { "Content-Type": "application/json" } }
  );

  console.log("CJ auth response:", {
    code: response.data?.code,
    result: response.data?.result,
    message: response.data?.message,
    dataKeys: response.data?.data ? Object.keys(response.data.data) : null
  });

  const token =
    response.data?.data?.accessToken ||
    response.data?.data?.access_token ||
    response.data?.accessToken ||
    response.data?.access_token;

  if (!token) {
    throw new Error(
      "CJ access token was not returned. CJ said: " +
        (response.data?.message || JSON.stringify(response.data))
    );
  }

  console.log("CJ access token generated");
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

  console.log("CJ response:", JSON.stringify(response.data, null, 2));

  if (!response.data?.result && !response.data?.success) {
    throw new Error(response.data?.message || "CJ order failed");
  }

  return (
    response.data?.data?.orderId ||
    response.data?.data?.cjOrderId ||
    response.data?.data?.cjOrderCode ||
    response.data?.data?.orderCode ||
    response.data?.data?.orderNumber ||
    null
  );
}

async function sendCustomerConfirmationEmail({ session, items, cjOrderId }) {
  if (!resend) {
    console.log("Resend not configured. Skipping customer email.");
    return;
  }

  const customerEmail = session.customer_details?.email;

  if (!customerEmail) {
    console.log("No customer email found. Skipping customer email.");
    return;
  }

  const orderNumber = makeOrderNumber(session.id);
  const itemRows = items
    .map((item) => `<li>${safeText(item.name)} — Qty: ${item.quantity || 1}</li>`)
    .join("");

  const emailResponse = await resend.emails.send({
    from: EMAIL_FROM,
    to: customerEmail,
    subject: `Kori Sellz Order Confirmation ${orderNumber}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>Your Kori Sellz order has been received.</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      ${cjOrderId ? `<p><strong>CJ Order ID:</strong> ${safeText(cjOrderId)}</p>` : ""}
      <h3>Items:</h3>
      <ul>${itemRows}</ul>
      <p>Shipping may take 8-23 business days after processing.</p>
      <p>You can track your order here:</p>
      <p><a href="${SITE_URL}/track.html">${SITE_URL}/track.html</a></p>
      <p>Thank you for shopping with Kori Sellz.</p>
    `
  });

  console.log("Customer confirmation email sent:", emailResponse);
}

async function sendOwnerOrderEmail({ session, items, cjOrderId, fulfillmentError }) {
  if (!resend) {
    console.log("Resend not configured. Skipping owner email.");
    return;
  }

  const shipping = session.collected_information?.shipping_details || session.shipping_details || {};
  const address = shipping.address || {};
  const customer = session.customer_details || {};
  const orderNumber = makeOrderNumber(session.id);
  const itemRows = items
    .map((item) => `<li>${safeText(item.name)} — SKU: ${safeText(item.sku)} — Qty: ${item.quantity || 1}</li>`)
    .join("");

  const emailResponse = await resend.emails.send({
    from: EMAIL_FROM,
    to: SUPPORT_INBOX,
    subject: `New Kori Sellz Order ${orderNumber}`,
    html: `
      <h2>New Kori Sellz Order</h2>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Stripe Session:</strong> ${safeText(session.id)}</p>
      <p><strong>CJ Order ID:</strong> ${safeText(cjOrderId || "N/A")}</p>
      <p><strong>Status:</strong> ${fulfillmentError ? "Payment received, CJ fulfillment needs attention" : "Payment received"}</p>
      ${fulfillmentError ? `<p><strong>Fulfillment Error:</strong> ${safeText(fulfillmentError)}</p>` : ""}
      <h3>Customer</h3>
      <p>${safeText(shipping.name || customer.name || "Customer")}</p>
      <p>${safeText(customer.email || "")}</p>
      <p>${safeText(customer.phone || "")}</p>
      <h3>Shipping Address</h3>
      <p>
        ${safeText(address.line1 || "")}<br>
        ${safeText(address.line2 || "")}<br>
        ${safeText(address.city || "")}, ${safeText(address.state || "")} ${safeText(address.postal_code || "")}<br>
        ${safeText(address.country || "US")}
      </p>
      <h3>Items</h3>
      <ul>${itemRows}</ul>
    `
  });

  console.log("Owner order email sent:", emailResponse);
}

async function sendTrackingEmail(order, trackingNumber, trackingUrl) {
  if (!resend || !order?.customer_email) return;

  const trackLink = trackingUrl || `${SITE_URL}/track.html`;

  const emailResponse = await resend.emails.send({
    from: EMAIL_FROM,
    to: order.customer_email,
    subject: `Kori Sellz Tracking Update ${order.order_number || ""}`,
    html: `
      <h2>Your order has a tracking update</h2>
      <p><strong>Order Number:</strong> ${safeText(order.order_number || "")}</p>
      <p><strong>Tracking Number:</strong> ${safeText(trackingNumber)}</p>
      <p>You can track your order here:</p>
      <p><a href="${trackLink}">${trackLink}</a></p>
      <p>Shipping may take 8-23 business days after processing.</p>
      <p>Thank you for shopping with Kori Sellz.</p>
    `
  });

  console.log("Tracking email sent:", emailResponse);
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
        order_number = EXCLUDED.order_number,
        customer_name = EXCLUDED.customer_name,
        customer_email = EXCLUDED.customer_email,
        customer_phone = EXCLUDED.customer_phone,
        shipping_address = EXCLUDED.shipping_address,
        shipping_city = EXCLUDED.shipping_city,
        shipping_state = EXCLUDED.shipping_state,
        shipping_zip = EXCLUDED.shipping_zip,
        shipping_country = EXCLUDED.shipping_country,
        items = EXCLUDED.items,
        livemode = EXCLUDED.livemode,
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

async function findLocalOrderByAnything(value) {
  if (!pool || !value) return null;

  const result = await pool.query(
    `
    SELECT * FROM orders
    WHERE order_number = $1
      OR stripe_session_id = $1
      OR cj_order_id = $1
      OR tracking_number = $1
    LIMIT 1
    `,
    [value]
  );

  return result.rows[0] || null;
}

function mapOrderRow(row) {
  return {
    id: row.id,
    stripeSessionId: row.stripe_session_id,
    stripe_session_id: row.stripe_session_id,
    orderNumber: row.order_number,
    order_number: row.order_number,
    customerName: row.customer_name,
    customer_name: row.customer_name,
    customerEmail: row.customer_email,
    customer_email: row.customer_email,
    customerPhone: row.customer_phone,
    customer_phone: row.customer_phone,
    shippingAddress: row.shipping_address,
    shipping_address: row.shipping_address,
    shippingCity: row.shipping_city,
    shipping_city: row.shipping_city,
    shippingState: row.shipping_state,
    shipping_state: row.shipping_state,
    shippingZip: row.shipping_zip,
    shipping_zip: row.shipping_zip,
    shippingCountry: row.shipping_country,
    shipping_country: row.shipping_country,
    items: row.items,
    livemode: row.livemode,
    status: row.status,
    cjOrderId: row.cj_order_id,
    cj_order_id: row.cj_order_id,
    trackingNumber: row.tracking_number,
    tracking_number: row.tracking_number,
    trackingUrl: row.tracking_url,
    tracking_url: row.tracking_url,
    error: row.error,
    createdAt: row.created_at,
    created_at: row.created_at
  };
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
      items = getFullItems(JSON.parse(session.metadata?.items || "[]"));
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
      await sendCustomerConfirmationEmail({ session, items, cjOrderId });
    } catch (error) {
      console.error("Customer Email Error:", error.response?.data || error.message);
    }

    try {
      await sendOwnerOrderEmail({ session, items, cjOrderId, fulfillmentError });
    } catch (error) {
      console.error("Owner Email Error:", error.response?.data || error.message);
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

app.get("/api/products/:id", (req, res) => {
  const product = products.find((item) => String(item.id) === String(req.params.id));

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(product);
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
                fixed_amount: { amount: 0, currency: "usd" },
                display_name: "Free Shipping",
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 8 },
                  maximum: { unit: "business_day", value: 23 }
                }
              }
            }
          ]
        : [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: 550, currency: "usd" },
                display_name: "Standard Shipping",
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 8 },
                  maximum: { unit: "business_day", value: 23 }
                }
              }
            }
          ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_creation: "always",
      shipping_address_collection: { allowed_countries: ["US"] },
      phone_number_collection: { enabled: true },
      shipping_options: shippingOptions,
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name, images: item.image ? [item.image] : [] },
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="/style.css">
      <link rel="icon" type="image/jpeg" href="/kori-logo.jpeg">
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="/style.css">
      <link rel="icon" type="image/jpeg" href="/kori-logo.jpeg">
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
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/track/:orderId", async (req, res) => {
  const lookup = decodeURIComponent(req.params.orderId || "").trim();

  if (!lookup) {
    return res.status(400).json({
      success: false,
      message: "Missing tracking or order number"
    });
  }

  try {
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: "Tracking is not available right now."
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        stripe_session_id,
        order_number,
        customer_name,
        customer_email,
        status,
        cj_order_id,
        tracking_number,
        carrier,
        created_at
      FROM orders
      WHERE
        LOWER(COALESCE(order_number, '')) = LOWER($1)
        OR LOWER(COALESCE(cj_order_id, '')) = LOWER($1)
        OR LOWER(COALESCE(tracking_number, '')) = LOWER($1)
        OR LOWER(COALESCE(stripe_session_id, '')) = LOWER($1)
        OR id::text = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [lookup]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "We could not find that order yet."
      });
    }

    const order = result.rows[0];

    return res.json({
      success: true,
      source: "database",
      data: {
        orderId: order.id,
        stripeSessionId: order.stripe_session_id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        status: order.status || "processing",
        cjOrderId: order.cj_order_id || "N/A",
        trackingNumber: order.tracking_number || null,
        carrier: order.carrier || "USPS",
        createdAt: order.created_at
      }
    });
  } catch (error) {
    console.error("Tracking lookup error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while checking tracking."
    });
  }
});

app.get("/api/admin/orders", async (req, res) => {
  try {
    const password = req.query.password;

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (!pool) {
      return res.json({ success: true, orders: [] });
    }

    const result = await pool.query(`
      SELECT * FROM orders
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      orders: result.rows.map(mapOrderRow)
    });
  } catch (error) {
    console.error("Admin orders error:", error.message);
    res.status(500).json({ success: false, error: "Unable to load orders" });
  }
});

async function updateTrackingHandler(req, res) {
  try {
    const { password, orderNumber, stripeSessionId, cjOrderId, trackingNumber, trackingUrl } = req.body;

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (!pool) {
      return res.status(500).json({ success: false, error: "Database not configured" });
    }

    if (!trackingNumber) {
      return res.status(400).json({ success: false, error: "Tracking number is required" });
    }

    const identifier = orderNumber || stripeSessionId || cjOrderId;

    if (!identifier) {
      return res.status(400).json({ success: false, error: "Order number, Stripe session ID, or CJ order ID is required" });
    }

    const result = await pool.query(
      `
      UPDATE orders
      SET tracking_number = $1,
          tracking_url = $2,
          status = 'tracking_added',
          error = NULL
      WHERE order_number = $3
         OR stripe_session_id = $3
         OR cj_order_id = $3
      RETURNING *
      `,
      [trackingNumber, trackingUrl || null, identifier]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    try {
      await sendTrackingEmail(result.rows[0], trackingNumber, trackingUrl);
    } catch (error) {
      console.error("Tracking email error:", error.response?.data || error.message);
    }

    res.json({ success: true, order: mapOrderRow(result.rows[0]) });
  } catch (error) {
    console.error("Update tracking error:", error.message);
    res.status(500).json({ success: false, error: "Something went wrong updating tracking" });
  }
}

app.post("/api/admin/tracking", updateTrackingHandler);
app.post("/api/admin/update-tracking", updateTrackingHandler);

app.post("/api/contact", async (req, res) => {
  try {
    if (!resend) {
      return res.status(500).json({ success: false, error: "Email not configured" });
    }

    const { name, email, message } = req.body;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: SUPPORT_INBOX,
      subject: `New Kori Sellz Contact Form Message from ${name || "Customer"}`,
      html: `
        <h2>New Contact Form Message</h2>
        <p><strong>Name:</strong> ${safeText(name)}</p>
        <p><strong>Email:</strong> ${safeText(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${safeText(message)}</p>
      `
    });

    res.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact form email error:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: "Message failed to send" });
  }
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml
`);
});

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");

  const pages = [
    "/",
    "/track.html",
    "/faq.html",
    "/shipping.html",
    "/contact.html",
    "/privacy.html",
    "/terms.html"
  ];

  const pageUrls = pages
    .map(
      (page) => `
  <url>
    <loc>${SITE_URL}${page}</loc>
    <priority>${page === "/" ? "1.0" : "0.6"}</priority>
  </url>`
    )
    .join("");

  const productUrls = products
    .map(
      (product) => `
  <url>
    <loc>${SITE_URL}/product.html?id=${product.id}</loc>
    <priority>0.7</priority>
  </url>`
    )
    .join("");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pageUrls}${productUrls}
</urlset>`);
});

initDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});