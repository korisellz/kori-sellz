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

console.log("Stripe key loaded?", process.env.STRIPE_SECRET_KEY ? "YES" : "NO");
console.log("Stripe webhook secret loaded?", process.env.STRIPE_WEBHOOK_SECRET ? "YES" : "NO");
console.log("CJ API key loaded?", process.env.CJ_API_KEY || process.env.CJ_ACCESS_TOKEN ? "YES" : "NO");
console.log("Resend key loaded?", process.env.RESEND_API_KEY ? "YES" : "NO");
console.log("Admin password loaded?", process.env.ADMIN_PASSWORD ? "YES" : "NO");
console.log("Database loaded?", process.env.DATABASE_URL ? "YES" : "NO");

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

const products = [
  {
    id: 1,
    name: "Type-C to HDMI VGA 5-in-1 Dual Display Converter",
    category: "Tech Accessories",
    sku: "CJXFJTDS00064-Black",
    cost: 19.56,
    price: 24.99,
    image: "https://cf.cjdropshipping.com/203106/3190218982082.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800",
    description: "A compact 5-in-1 Type-C adapter that helps connect your device to HDMI, VGA, and other display options. Great for work, streaming, school, and travel.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 2,
    name: "4-in-1 Magnetic Wireless Charging Station",
    category: "Tech Accessories",
    sku: "CJYD179346901AZ",
    cost: 23.41,
    price: 29.99,
    image: "https://cf.cjdropshipping.com/quick/product/6da64e9b-f353-419a-9be1-13f716dfd91b.jpg?x-oss-process=image/resize,m_pad,w_800,h_800/sharpen,100/format,jpg",
    description: "Charge multiple devices in one place with this sleek 4-in-1 magnetic wireless charging station. Perfect for phones, watches, earbuds, and everyday desk setups.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 3,
    name: "V14 Professional 6K HD Dual Camera Drone - 2 Batteries",
    category: "Drones & Cameras",
    sku: "CJWR241970801AZ",
    cost: 35.0,
    price: 39.99,
    image: "https://cf.cjdropshipping.com/66ca3586-f363-4d10-b446-b93451e9f6a4.jpg?x-oss-process=image/resize,m_fill,m_pad,w_800,h_800",
    description: "Capture aerial shots with this V14 dual camera drone featuring HD recording, foldable design, and two batteries for extra flight time.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 4,
    name: "V14 Professional 6K HD Dual Camera Drone - 3 Batteries",
    category: "Drones & Cameras",
    sku: "CJWR241970802BY",
    cost: 39.0,
    price: 49.99,
    image: "https://cf.cjdropshipping.com/04df2447-39a4-4c05-8b0e-c2250546f1a1.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A foldable dual camera drone with HD recording and three batteries for longer use. Great for beginners, travel shots, and outdoor content.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 5,
    name: "Wireless Lavalier Microphone for iPhone",
    category: "Creator Tools",
    sku: "CJMK1698386-2in1 for IOS",
    cost: 12.98,
    price: 24.99,
    image: "https://cf.cjdropshipping.com/adbc5add-bd51-4328-84c4-106e8c198890.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A wireless lavalier microphone made for creators, vloggers, interviews, TikTok videos, and everyday content recording.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 6,
    name: "4K Waterproof Sport Camera",
    category: "Drones & Cameras",
    sku: "CJXFXJSM00002-Black",
    cost: 22.57,
    price: 29.99,
    image: "https://cf.cjdropshipping.com/15287328/1102491960640.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A compact waterproof sport camera designed for outdoor activities, travel, action shots, and everyday video recording.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 7,
    name: "1080P LED Mini High Definition Projector",
    category: "Home Gadgets",
    sku: "CJCJSJYDSJ00002_SKU_HERE",
    cost: 7.26,
    price: 10.99,
    image: "https://cf.cjdropshipping.com/20190617/604935516809.png?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A mini LED projector for movie nights, small rooms, gaming setups, and portable entertainment.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 8,
    name: "Electronic Burglar Alarm Intelligent Home Security Door Stop Alarm",
    category: "Home Security",
    sku: "CJZN105466804DW",
    cost: 7.54,
    price: 9.99,
    image: "https://cf.cjdropshipping.com/1616652882290.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A portable door stop alarm designed to help add extra security at home, hotels, dorms, apartments, and travel stays.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 9,
    name: "Electric Detangling Brush Scalp Massage Hair Brush",
    category: "Beauty",
    sku: "CJXFZNZN00544-Purple",
    cost: 12.66,
    price: 17.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/01/11/01/ed1175b4-bd77-4761-a4f1-c24037b17f2b.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A gentle electric detangling brush designed to help smooth hair while massaging the scalp for easier everyday styling.",
    shipping: "Estimated delivery: 8-23 business days after processing."
  },
  {
    id: 10,
    name: "60W Fast Charging Multi-function Charging Cable Storage Box",
    category: "Tech Accessories",
    sku: "CJCD144565503CX",
    cost: 6.31,
    price: 9.99,
    image: "https://oss-cf.cjdropshipping.com/product/2025/04/17/10/538aa4eb-0082-41be-8cc2-90cf619f2b08.jpg?x-oss-process=image/format,webp,image/resize,m_fill,m_pad,w_800,h_800",
    description: "A compact cable storage box with fast charging support, perfect for keeping your everyday tech accessories organized.",
    shipping: "Estimated delivery: 8-23 business days after processing."
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
const whatsInBoxByCategory = {
  "Tech Accessories": [
    "1 product unit",
    "Charging or connection accessories if included by supplier",
    "Basic packaging"
  ],
  "Drones & Cameras": [
    "1 camera or drone device",
    "Included accessories shown in product photos",
    "Charging cable or power cable if included by supplier",
    "User setup items if provided by supplier"
  ],
  "Beauty": [
    "1 beauty device or tool",
    "Charging cable if rechargeable",
    "Basic packaging"
  ],
  "Home Security": [
    "1 security device or kit",
    "Mounting or setup accessories if included by supplier",
    "Basic packaging"
  ],
  "Creator Tools": [
    "1 creator accessory",
    "Connection or charging accessories if included",
    "Basic packaging"
  ],
  "Home Gadgets": [
    "1 home gadget",
    "Power or charging accessory if included",
    "Basic packaging"
  ]
};

products.forEach((product) => {
  if (!product.whatsInBox) {
    product.whatsInBox = whatsInBoxByCategory[product.category] || [
      "1 product unit",
      "Basic packaging"
    ];
  }
});
async function setupDatabase() {
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
    "order_number TEXT, " +
    "items JSONB, " +
    "livemode BOOLEAN, " +
    "status TEXT, " +
    "cj_order_id TEXT, " +
    "tracking_number TEXT, " +
    "error TEXT, " +
    "created_at TIMESTAMPTZ DEFAULT NOW()" +
    ");";

  await pool.query(createOrdersTableSQL);
  console.log("Database ready");
}

function getProductByIdOrSku(item) {
  return products.find((product) => product.id === item.id || product.sku === item.sku);
}

function parseItemsFromSession(session) {
  try {
    const savedItems = JSON.parse(session.metadata?.items || "[]");

    return savedItems.map((savedItem) => {
      const fullProduct = getProductByIdOrSku(savedItem);

      return {
        ...(fullProduct || {}),
        ...savedItem,
        quantity: savedItem.quantity || 1
      };
    });
  } catch (error) {
    console.error("Item parse error:", error.message);
    return [];
  }
}

function getShippingAddress(session) {
  const shipping = session.collected_information?.shipping_details || session.shipping_details || {};
  const address = shipping.address || {};

  return {
    name: shipping.name || session.customer_details?.name || "",
    phone: session.customer_details?.phone || "",
    email: session.customer_details?.email || "",
    line1: address.line1 || "",
    line2: address.line2 || "",
    city: address.city || "",
    state: address.state || "",
    postal_code: address.postal_code || "",
    country: address.country || "US"
  };
}

function buildOrderNumber(sessionId) {
  return `KS-${sessionId.slice(-16)}`;
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
    }
  );

  const token = response.data?.data?.accessToken;

  if (!token) {
    throw new Error("CJ access token was not returned");
  }

  console.log("CJ access token generated");
  return token;
}

async function sendOrderToCJ(session, items) {
  const token = await getCJAccessToken();
  const shipping = getShippingAddress(session);
  const orderNumber = buildOrderNumber(session.id);

  const payload = {
    orderNumber,
    shippingZip: shipping.postal_code,
    shippingCountry: "United States",
    shippingCountryCode: shipping.country || "US",
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
        "CJ-Access-Token": token,
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

  console.log("CJ Order ID:", cjOrderId || "No CJ order ID found in response");

  return {
    cjOrderId,
    cjResponse: response.data
  };
}

async function saveOrder({ session, items, status, cjOrderId = null, error = null }) {
  if (!pool) return;

  const shipping = getShippingAddress(session);
  const orderNumber = buildOrderNumber(session.id);

  await pool.query(
    `INSERT INTO orders (
      stripe_session_id,
      customer_name,
      customer_email,
      customer_phone,
      order_number,
      items,
      livemode,
      status,
      cj_order_id,
      error
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (stripe_session_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      cj_order_id = EXCLUDED.cj_order_id,
      error = EXCLUDED.error`,
    [
      session.id,
      shipping.name,
      shipping.email,
      shipping.phone,
      orderNumber,
      JSON.stringify(items),
      session.livemode,
      status,
      cjOrderId,
      error
    ]
  );
}

async function sendConfirmationEmail(session, items, cjOrderId = null) {
  if (!resend) {
    console.log("No Resend API key. Email skipped.");
    return;
  }

  const shipping = getShippingAddress(session);
  const orderNumber = buildOrderNumber(session.id);

  if (!shipping.email) {
    console.log("No customer email. Confirmation email skipped.");
    return;
  }

  const itemRows = items
    .map(
      (item) =>
        `<li>${item.name || item.sku} - Quantity: ${item.quantity || 1} - $${Number(item.price || 0).toFixed(2)}</li>`
    )
    .join("");

  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Kori Sellz <onboarding@resend.dev>",
    to: shipping.email,
    subject: `Kori Sellz Order Confirmation - ${orderNumber}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>Hi ${shipping.name || "there"},</p>
      <p>Your Kori Sellz order has been received and is being processed.</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      ${cjOrderId ? `<p><strong>CJ Order ID:</strong> ${cjOrderId}</p>` : ""}
      <h3>Items</h3>
      <ul>${itemRows}</ul>
      <p><strong>Shipping:</strong> Estimated delivery is 8-23 business days after processing.</p>
      <p>You can track your order here: <a href="${SITE_URL}/track.html">${SITE_URL}/track.html</a></p>
      <p>Need help? Contact us at ${process.env.SUPPORT_INBOX || "support@korisellz.com"}.</p>
      <p>Thank you for shopping with Kori Sellz.</p>
    `
  });

  console.log("Confirmation email sent:", result);
}

app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  console.log("WEBHOOK TRIGGERED");

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Webhook signature error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("Payment confirmed:", session.id);

    const items = parseItemsFromSession(session);

    try {
      let cjOrderId = null;

      await sendConfirmationEmail(session, items);

      if (session.livemode) {
        const cjResult = await sendOrderToCJ(session, items);
        cjOrderId = cjResult.cjOrderId;

        await saveOrder({
          session,
          items,
          status: "forwarded_to_cj",
          cjOrderId
        });

        console.log("Order forwarded to CJ successfully.");
      } else {
        console.log("Stripe test payment detected — skipping real CJ order creation.");
        console.log("Test order items:", items);

        await saveOrder({
          session,
          items,
          status: "test_order_not_sent_to_cj",
          cjOrderId: null
        });
      }
    } catch (error) {
      console.error("Fulfillment Error:", error.response?.data || error.message);

      await saveOrder({
        session,
        items,
        status: "fulfillment_error",
        cjOrderId: null,
        error: JSON.stringify(error.response?.data || error.message)
      });
    }
  }

  res.json({ received: true });
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find((item) => item.id === Number(req.params.id));

  if (!product) {
    return res.status(404).json({
      success: false,
      error: "Product not found"
    });
  }

  res.json(product);
});

app.post("/api/checkout", async (req, res) => {
  try {
    const items = req.body.items || [];

    if (!items.length) {
      return res.status(400).json({
        error: "Cart is empty"
      });
    }

    const cleanedItems = items
      .map((item) => {
        const fullProduct = getProductByIdOrSku(item);

        return {
          ...(fullProduct || item),
          quantity: item.quantity || 1
        };
      })
      .filter((item) => item.name && item.price && item.sku);

    if (!cleanedItems.length) {
      return res.status(400).json({
        error: "No valid items found"
      });
    }

    const subtotalCents = cleanedItems.reduce((sum, item) => {
      return sum + Math.round(Number(item.price) * 100) * (item.quantity || 1);
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
      phone_number_collection: {
        enabled: true
      },
      customer_creation: "always",
      line_items: cleanedItems.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : []
          },
          unit_amount: Math.round(Number(item.price) * 100)
        },
        quantity: item.quantity || 1
      })),
      shipping_options: shippingOptions,
      mode: "payment",
      success_url: `${SITE_URL}/success`,
      cancel_url: `${SITE_URL}/cancel`,
      metadata: {
        items: JSON.stringify(
          cleanedItems.map((item) => ({
            id: item.id,
            sku: item.sku,
            quantity: item.quantity || 1
          }))
        )
      }
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
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Successful | Kori Sellz</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #0b0d1f;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
          padding: 20px;
        }

        .box {
          background: #15172e;
          border: 1px solid #2f335f;
          border-radius: 18px;
          padding: 35px;
          max-width: 520px;
          box-shadow: 0 10px 25px #0006;
        }

        p {
          color: #ddd;
          line-height: 1.5;
        }

        a {
          display: inline-block;
          margin: 10px;
          background: white;
          color: #151B54;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 999px;
          font-weight: bold;
        }

        a:hover {
          background: #e6e6e6;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>Payment Successful</h1>
        <p>Thank you for shopping with Kori Sellz. Your order has been received and is being processed.</p>
        <p>Please check your email for confirmation. Shipping may take 8-23 business days after processing.</p>
        <a href="/">Return to Kori Sellz</a>
        <a href="/track.html">Track Order</a>
      </div>
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
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #0b0d1f;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
          padding: 20px;
        }

        .box {
          background: #15172e;
          border: 1px solid #2f335f;
          border-radius: 18px;
          padding: 35px;
          max-width: 500px;
          box-shadow: 0 10px 25px #0006;
        }

        p {
          color: #ddd;
          line-height: 1.5;
        }

        a {
          display: inline-block;
          margin-top: 20px;
          background: white;
          color: #151B54;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 999px;
          font-weight: bold;
        }

        a:hover {
          background: #e6e6e6;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>Payment Canceled</h1>
        <p>Your payment was canceled and you were not charged.</p>
        <p>You can return to Kori Sellz and continue shopping whenever you're ready.</p>
        <a href="/">Return to Kori Sellz</a>
      </div>
    </body>
    </html>
  `);
});

app.post("/api/contact", async (req, res) => {
  try {
    if (!resend) {
      return res.status(500).json({
        success: false,
        error: "Email service not configured"
      });
    }

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
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

    const result = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC LIMIT 100"
    );

    const orders = result.rows.map((order) => ({
      id: order.id,
      stripeSessionId: order.stripe_session_id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      orderNumber: order.order_number,
      items: order.items,
      livemode: order.livemode,
      status: order.status,
      cjOrderId: order.cj_order_id,
      trackingNumber: order.tracking_number,
      error: order.error,
      createdAt: order.created_at
    }));

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Admin orders error:", error.message);

    res.status(500).json({
      success: false,
      error: "Unable to load orders"
    });
  }
});

app.get("/api/track/:orderId", async (req, res) => {
  try {
    const token = await getCJAccessToken();

    const response = await axios.get(
      `https://developers.cjdropshipping.cn/api2.0/v1/shopping/order/getOrderDetail?orderId=${encodeURIComponent(req.params.orderId)}`,
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

app.get("/sitemap.xml", (req, res) => {
  const productUrls = products
    .map(
      (product) => `
  <url>
    <loc>${SITE_URL}/product.html?id=${product.id}</loc>
  </url>`
    )
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
  </url>
  <url>
    <loc>${SITE_URL}/faq.html</loc>
  </url>
  <url>
    <loc>${SITE_URL}/shipping.html</loc>
  </url>
  <url>
    <loc>${SITE_URL}/contact.html</loc>
  </url>
  <url>
    <loc>${SITE_URL}/track.html</loc>
  </url>
  ${productUrls}
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(sitemap);
});

setupDatabase()
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