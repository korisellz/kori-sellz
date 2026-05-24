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

  console.log("âœ… Database ready");
}
