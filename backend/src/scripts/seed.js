// Creates the admin account, categories and 3 SAMPLE products. Safe to re-run.
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { slugify } from "../lib/util.js";

const CATEGORIES = ["Smartphones", "Chargers & Cables", "Cases & Covers", "Earbuds & Audio", "Power Banks", "Screen Protectors"];
const SAMPLE = [
  { name: "Sample Smartphone", brand: "Sample", cat: "Smartphones", warranty: "1 year",
    specs: { Display: '6.5" AMOLED', RAM: "8 GB", Battery: "5000 mAh" },
    variants: [{ label: "8GB/128GB", price: 79999, stock: 5 }, { label: "8GB/256GB", price: 89999, stock: 3 }] },
  { name: "Sample 65W Charger", brand: "Sample", cat: "Chargers & Cables", warranty: "6 months",
    specs: { Output: "65W", Ports: "USB-C" }, variants: [{ label: "Standard", price: 2499, stock: 20 }] },
  { name: "Sample Wireless Earbuds", brand: "Sample", cat: "Earbuds & Audio", warranty: "6 months",
    specs: { Battery: "24h with case", Bluetooth: "5.3" }, variants: [{ label: "Standard", price: 3999, stock: 12 }] },
];

try {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
  await pool.query(
    "INSERT INTO admins (email, password_hash) VALUES ($1,$2) ON CONFLICT (email) DO NOTHING",
    [email.toLowerCase(), await bcrypt.hash(password, 10)]);

  const cats = {};
  for (const [i, name] of CATEGORIES.entries()) {
    const { rows } = await pool.query(
      "INSERT INTO categories (name, slug, sort_order) VALUES ($1,$2,$3) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id",
      [name, slugify(name), i]);
    cats[name] = rows[0].id;
  }
  for (const p of SAMPLE) {
    const slug = slugify(p.name);
    if ((await pool.query("SELECT 1 FROM products WHERE slug = $1", [slug])).rowCount) continue;
    const { rows } = await pool.query(
      `INSERT INTO products (slug, name, brand, category_id, description, warranty, specs, is_featured)
       VALUES ($1,$2,$3,$4,'Sample item — edit or delete it from the admin catalog.',$5,$6,true) RETURNING id`,
      [slug, p.name, p.brand, cats[p.cat], p.warranty, JSON.stringify(p.specs)]);
    for (const [i, v] of p.variants.entries()) {
      await pool.query("INSERT INTO variants (product_id, label, price, stock, sort_order) VALUES ($1,$2,$3,$4,$5)", [rows[0].id, v.label, v.price, v.stock, i]);
    }
  }
  console.log("Seed done.");
} catch (e) {
  console.error("Seed failed:", e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
