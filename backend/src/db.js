import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (copy .env.example to .env)");

// Everything lives in the "telecart" schema, so existing tables in the database never collide.
export const pool = new pg.Pool({
  connectionString: url,
  options: "-c search_path=telecart,public",
  max: 10,
});

export const query = (text, params) => pool.query(text, params);

/** Run fn(client) inside a transaction; commits on success, rolls back on any throw. */
export async function withTx(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
