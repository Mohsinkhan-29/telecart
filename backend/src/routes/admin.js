import express, { Router } from "express";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query, withTx } from "../db.js";
import { ah, HttpError, normalizePhone, parseSpecs, slugify } from "../lib/util.js";
import { requireAdmin, signToken } from "../middleware/auth.js";
import { PRODUCT_SELECT } from "../lib/products.js";
import { sendMail } from "../lib/mail.js";
import { indexDocument } from "../lib/rag.js";
import { getSettings, SETTING_KEYS } from "../lib/settings.js";

const r = Router();
const sha = (s) => createHash("sha256").update(s).digest("hex");
const BAL = "COALESCE(SUM(CASE WHEN e.type = 'DEBIT' THEN e.amount ELSE -e.amount END), 0)::int";

// ───────── Auth (public) ─────────
r.post("/login", ah(async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const { rows } = await query("SELECT * FROM admins WHERE email = $1", [email]);
  const admin = rows[0];
  // Same message for unknown email and wrong password.
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) throw new HttpError(401, "Invalid email or password.");
  res.json({ token: signToken(admin), email: admin.email });
}));

r.post("/forgot-password", ah(async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const { rows } = await query("SELECT id, email FROM admins WHERE email = $1", [email]);
  if (rows[0]) {
    const token = randomBytes(32).toString("hex");
    await query("INSERT INTO password_reset_tokens (admin_id, token_hash, expires_at) VALUES ($1,$2, now() + interval '1 hour')", [rows[0].id, sha(token)]);
    const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/reset-password?token=${token}`;
    await sendMail(rows[0].email, "Reset your admin password",
      `<p>Click to reset your password (valid for 1 hour):</p><p><a href="${link}">${link}</a></p><p>If you didn't ask for this, ignore this email.</p>`);
  }
  // Never reveal whether the email exists.
  res.json({ message: "If that email belongs to an admin, a reset link is on its way." });
}));

r.post("/reset-password", ah(async (req, res) => {
  const password = String(req.body?.password ?? "");
  if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters.");
  const hash = await bcrypt.hash(password, 10);
  await withTx(async (db) => {
    const { rows } = await db.query(
      "SELECT id, admin_id FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE",
      [sha(String(req.body?.token ?? ""))]);
    if (!rows[0]) throw new HttpError(400, "This reset link is invalid or has expired.");
    await db.query("UPDATE admins SET password_hash = $1 WHERE id = $2", [hash, rows[0].admin_id]);
    await db.query("UPDATE password_reset_tokens SET used_at = now() WHERE id = $1", [rows[0].id]);
  });
  res.json({ ok: true });
}));

// Everything below needs a valid admin token.
r.use(requireAdmin);

r.get("/me", (req, res) => res.json(req.admin));


// Image upload: raw file body, saved in the images table
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
r.post("/upload", express.raw({ type: IMAGE_TYPES, limit: "5mb" }), ah(async (req, res) => {
  const mime = req.headers["content-type"];
  if (!IMAGE_TYPES.includes(mime) || !req.body?.length) throw new HttpError(400, "Upload a JPG, PNG, WEBP or GIF image.");
  const { rows } = await query("INSERT INTO images (mime, data) VALUES ($1, $2) RETURNING id", [mime, req.body]);
  res.status(201).json({ url: `/api/images/${rows[0].id}` });
}));

// ───────── Dashboard ─────────
r.get("/dashboard", ah(async (_req, res) => {
  const [pending, month, balances, low] = await Promise.all([
    query("SELECT count(*)::int AS n FROM orders WHERE status = 'PENDING'"),
    query("SELECT count(*)::int AS n, COALESCE(sum(total),0)::int AS total FROM orders WHERE status = 'CONFIRMED' AND created_at >= date_trunc('month', now())"),
    query(`SELECT c.id, c.name, ${BAL} AS balance FROM customers c LEFT JOIN ledger_entries e ON e.customer_id = c.id
           GROUP BY c.id HAVING ${BAL} > 0 ORDER BY balance DESC`),
    query(`SELECT v.id, v.label, v.stock, p.id AS "productId", p.name FROM variants v JOIN products p ON p.id = v.product_id
           WHERE v.stock <= 3 AND p.is_active ORDER BY v.stock, p.name LIMIT 8`),
  ]);
  res.json({
    pendingOrders: pending.rows[0].n,
    confirmedThisMonth: month.rows[0].n,
    salesThisMonth: month.rows[0].total,
    receivable: balances.rows.reduce((n, b) => n + b.balance, 0),
    topBalances: balances.rows.slice(0, 5),
    lowStock: low.rows,
  });
}));

// ───────── Site content (storefront text, contact details, SEO) ─────────
r.get("/settings", ah(async (_req, res) => {
  res.json(await getSettings());
}));

r.put("/settings/:key", ah(async (req, res) => {
  const key = req.params.key;
  if (!SETTING_KEYS.includes(key)) throw new HttpError(404, "Unknown settings section.");
  const value = req.body?.value;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "Settings must be an object.");
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1,$2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, [key, JSON.stringify(value)]);
  res.json({ ok: true });
}));

r.delete("/settings/:key", ah(async (req, res) => {
  await query("DELETE FROM settings WHERE key = $1", [req.params.key]);
  res.json({ ok: true });
}));

// ───────── Newsletter ─────────
r.get("/subscribers", ah(async (_req, res) => {
  res.json((await query(`SELECT id, email, created_at AS "createdAt" FROM subscribers ORDER BY created_at DESC`)).rows);
}));

r.delete("/subscribers/:id", ah(async (req, res) => {
  await query("DELETE FROM subscribers WHERE id = $1", [Number(req.params.id) || 0]);
  res.json({ ok: true });
}));

// ───────── Catalog ─────────
const CAT_SELECT = `SELECT c.id, c.name, c.slug, c.subtitle, c.icon, c.show_on_home AS "showOnHome", c.sort_order AS "sortOrder",
  (SELECT count(*)::int FROM products p WHERE p.category_id = c.id) AS "productCount" FROM categories c`;

r.get("/categories", ah(async (_req, res) => {
  res.json((await query(`${CAT_SELECT} ORDER BY c.sort_order, c.name`)).rows);
}));

const CategoryIn = z.object({
  name: z.string().trim().min(1).max(60),
  subtitle: z.string().trim().max(120).default(""),
  icon: z.string().trim().max(30).default("phone"),
  showOnHome: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});
const parseCategory = (body) => {
  const p = CategoryIn.safeParse(body);
  if (!p.success) throw new HttpError(400, "Give the category a name.");
  return p.data;
};
const dupName = (e) => { if (e.code === "23505") throw new HttpError(409, "A category with that name already exists."); throw e; };

r.post("/categories", ah(async (req, res) => {
  const d = parseCategory(req.body);
  try {
    const { rows } = await query(
      "INSERT INTO categories (name, slug, subtitle, icon, show_on_home, sort_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
      [d.name, slugify(d.name), d.subtitle, d.icon, d.showOnHome, d.sortOrder]);
    res.status(201).json({ id: rows[0].id });
  } catch (e) { dupName(e); }
}));

r.put("/categories/:id", ah(async (req, res) => {
  const d = parseCategory(req.body);
  try {
    const u = await query(
      "UPDATE categories SET name=$1, slug=$2, subtitle=$3, icon=$4, show_on_home=$5, sort_order=$6 WHERE id=$7",
      [d.name, slugify(d.name), d.subtitle, d.icon, d.showOnHome, d.sortOrder, Number(req.params.id) || 0]);
    if (!u.rowCount) throw new HttpError(404, "Category not found");
    res.json({ ok: true });
  } catch (e) { dupName(e); }
}));

r.delete("/categories/:id", ah(async (req, res) => {
  const id = Number(req.params.id) || 0;
  if ((await query("SELECT 1 FROM products WHERE category_id = $1 LIMIT 1", [id])).rowCount) {
    throw new HttpError(409, "Move or delete this category's products first.");
  }
  await query("DELETE FROM categories WHERE id = $1", [id]);
  res.json({ ok: true });
}));

r.get("/products", ah(async (_req, res) => {
  res.json((await query(`${PRODUCT_SELECT} ORDER BY p.created_at DESC`)).rows);
}));

r.get("/products/:id", ah(async (req, res) => {
  const { rows } = await query(`${PRODUCT_SELECT} WHERE p.id = $1`, [Number(req.params.id) || 0]);
  if (!rows[0]) throw new HttpError(404, "Product not found");
  res.json(rows[0]);
}));

const VariantIn = z.object({
  id: z.number().int().optional(),
  label: z.string().trim().min(1).max(60),
  sku: z.string().trim().max(40).nullish(),
  price: z.number().int().min(0),
  compareAtPrice: z.number().int().min(0).nullish(),
  stock: z.number().int().min(0),
});
const ProductIn = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(60),
  categoryId: z.number().int(),
  description: z.string().trim().max(4000).default(""),
  condition: z.enum(["NEW", "OPEN_BOX", "USED"]).default("NEW"),
  warranty: z.string().trim().max(120).nullish(),
  specs: z.union([z.string(), z.record(z.string())]).default({}),
  images: z.union([z.string(), z.array(z.string())]).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().trim().max(120).nullish(),
  seoDescription: z.string().trim().max(320).nullish(),
  variants: z.array(VariantIn).min(1, "Add at least one variant"),
});

function parseProduct(body) {
  const p = ProductIn.safeParse(body);
  if (!p.success) throw new HttpError(400, p.error.issues[0].message === "Required" ? `Missing ${p.error.issues[0].path.join(".")}` : p.error.issues[0].message);
  const d = p.data;
  return {
    ...d,
    specs: typeof d.specs === "string" ? parseSpecs(d.specs) : d.specs,
    images: (typeof d.images === "string" ? d.images.split("\n") : d.images).map((s) => s.trim()).filter(Boolean),
  };
}
const uniqueSku = (e) => { if (e.code === "23505") throw new HttpError(409, "That SKU or slug is already used."); throw e; };

r.post("/products", ah(async (req, res) => {
  const d = parseProduct(req.body);
  try {
    const id = await withTx(async (db) => {
      let slug = slugify(d.name);
      if ((await db.query("SELECT 1 FROM products WHERE slug = $1", [slug])).rowCount) slug += "-" + Date.now().toString(36).slice(-4);
      const p = await db.query(
        `INSERT INTO products (slug, name, brand, category_id, description, condition, warranty, specs, images, is_active, is_featured, seo_title, seo_description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [slug, d.name, d.brand, d.categoryId, d.description, d.condition, d.warranty || null, JSON.stringify(d.specs), d.images, d.isActive, d.isFeatured, d.seoTitle || null, d.seoDescription || null]);
      for (const [i, v] of d.variants.entries()) {
        await db.query(
          "INSERT INTO variants (product_id, label, sku, price, compare_at_price, stock, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7)",
          [p.rows[0].id, v.label, v.sku || null, v.price, v.compareAtPrice ?? null, v.stock, i]);
      }
      return p.rows[0].id;
    });
    res.status(201).json({ id });
  } catch (e) { uniqueSku(e); }
}));

r.put("/products/:id", ah(async (req, res) => {
  const id = Number(req.params.id) || 0;
  const d = parseProduct(req.body);
  try {
    await withTx(async (db) => {
      const u = await db.query(
        `UPDATE products SET name=$1, brand=$2, category_id=$3, description=$4, condition=$5, warranty=$6,
           specs=$7, images=$8, is_active=$9, is_featured=$10, seo_title=$11, seo_description=$12, updated_at=now() WHERE id=$13`,
        [d.name, d.brand, d.categoryId, d.description, d.condition, d.warranty || null, JSON.stringify(d.specs), d.images, d.isActive, d.isFeatured, d.seoTitle || null, d.seoDescription || null, id]);
      if (!u.rowCount) throw new HttpError(404, "Product not found");
      const keep = d.variants.flatMap((v) => (v.id ? [v.id] : []));
      await db.query("DELETE FROM variants WHERE product_id = $1 AND NOT (id = ANY($2::int[]))", [id, keep]);
      for (const [i, v] of d.variants.entries()) {
        const args = [v.label, v.sku || null, v.price, v.compareAtPrice ?? null, v.stock, i];
        if (v.id) await db.query("UPDATE variants SET label=$1, sku=$2, price=$3, compare_at_price=$4, stock=$5, sort_order=$6 WHERE id=$7 AND product_id=$8", [...args, v.id, id]);
        else await db.query("INSERT INTO variants (label, sku, price, compare_at_price, stock, sort_order, product_id) VALUES ($1,$2,$3,$4,$5,$6,$7)", [...args, id]);
      }
    });
    res.json({ id });
  } catch (e) { uniqueSku(e); }
}));

r.patch("/products/:id/toggle", ah(async (req, res) => {
  const { rows } = await query("UPDATE products SET is_active = NOT is_active, updated_at = now() WHERE id = $1 RETURNING is_active AS \"isActive\"", [Number(req.params.id) || 0]);
  if (!rows[0]) throw new HttpError(404, "Product not found");
  res.json(rows[0]);
}));

// ───────── Orders: stock + ledger change together, in one transaction ─────────
r.get("/orders", ah(async (req, res) => {
  const status = ["PENDING", "CONFIRMED", "CANCELLED"].includes(req.query.status) ? req.query.status : null;
  const { rows } = await query(`
    SELECT o.id, o.status, o.total, o.note, o.created_at AS "createdAt",
      c.id AS "customerId", c.name AS "customerName", c.phone AS "customerPhone",
      COALESCE((SELECT json_agg(json_build_object('id', i.id, 'name', i.name, 'label', i.label, 'unitPrice', i.unit_price, 'qty', i.qty) ORDER BY i.id)
                FROM order_items i WHERE i.order_id = o.id), '[]'::json) AS items
    FROM orders o JOIN customers c ON c.id = o.customer_id
    WHERE ($1::text IS NULL OR o.status = $1) ORDER BY o.created_at DESC LIMIT 100`, [status]);
  res.json(rows);
}));

r.post("/orders/:id/confirm", ah(async (req, res) => {
  const id = Number(req.params.id) || 0;
  await withTx(async (db) => {
    const o = (await db.query("SELECT id, customer_id, status, total FROM orders WHERE id = $1 FOR UPDATE", [id])).rows[0];
    if (!o) throw new HttpError(404, "Order not found.");
    if (o.status !== "PENDING") throw new HttpError(409, "Order is not pending.");
    const items = (await db.query("SELECT variant_id, name, label, qty FROM order_items WHERE order_id = $1", [id])).rows;
    for (const it of items) {
      if (!it.variant_id) continue; // variant was deleted from the catalog
      const u = await db.query("UPDATE variants SET stock = stock - $1 WHERE id = $2 AND stock >= $1", [it.qty, it.variant_id]);
      if (!u.rowCount) throw new HttpError(409, `Not enough stock for ${it.name}${it.label !== "Standard" ? ` (${it.label})` : ""}.`);
    }
    await db.query("UPDATE orders SET status = 'CONFIRMED' WHERE id = $1", [id]);
    await db.query("INSERT INTO ledger_entries (customer_id, order_id, type, amount, note) VALUES ($1,$2,'DEBIT',$3,$4)", [o.customer_id, id, o.total, `Order #${id}`]);
  });
  res.json({ ok: true });
}));

r.post("/orders/:id/cancel", ah(async (req, res) => {
  const id = Number(req.params.id) || 0;
  await withTx(async (db) => {
    const o = (await db.query("SELECT id, customer_id, status, total FROM orders WHERE id = $1 FOR UPDATE", [id])).rows[0];
    if (!o) throw new HttpError(404, "Order not found.");
    if (o.status === "CANCELLED") throw new HttpError(409, "Already cancelled.");
    if (o.status === "CONFIRMED") {
      await db.query(`UPDATE variants v SET stock = v.stock + i.qty FROM order_items i WHERE i.order_id = $1 AND i.variant_id = v.id`, [id]);
      await db.query("INSERT INTO ledger_entries (customer_id, order_id, type, amount, note) VALUES ($1,$2,'CREDIT',$3,$4)", [o.customer_id, id, o.total, `Order #${id} cancelled`]);
    }
    await db.query("UPDATE orders SET status = 'CANCELLED' WHERE id = $1", [id]);
  });
  res.json({ ok: true });
}));

// ───────── Ledger ─────────
r.get("/customers", ah(async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const params = [];
  let where = "";
  if (q) {
    params.push(`%${q}%`, `%${q.replace(/\D/g, "") || "~"}%`);
    where = "WHERE c.name ILIKE $1 OR c.phone LIKE $2";
  }
  const { rows } = await query(
    `SELECT c.id, c.name, c.phone, ${BAL} AS balance FROM customers c
     LEFT JOIN ledger_entries e ON e.customer_id = c.id ${where}
     GROUP BY c.id ${req.query.owing ? `HAVING ${BAL} > 0` : ""} ORDER BY c.name`, params);
  res.json({ customers: rows, totalOwed: rows.reduce((n, c) => n + Math.max(0, c.balance), 0) });
}));

r.post("/customers", ah(async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const phone = normalizePhone(req.body?.phone);
  if (name.length < 2) throw new HttpError(400, "Enter the customer's name.");
  if (!phone) throw new HttpError(400, "Enter a valid phone number.");
  const { rows } = await query(
    "INSERT INTO customers (name, phone) VALUES ($1,$2) ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone RETURNING id", [name, phone]);
  res.status(201).json({ id: rows[0].id });
}));

r.get("/customers/:id", ah(async (req, res) => {
  const id = Number(req.params.id) || 0;
  const c = (await query("SELECT id, name, phone FROM customers WHERE id = $1", [id])).rows[0];
  if (!c) throw new HttpError(404, "Customer not found");
  const entries = (await query(
    `SELECT id, order_id AS "orderId", type, amount, note, date FROM ledger_entries
     WHERE customer_id = $1 ORDER BY date, id`, [id])).rows;
  let running = 0;
  const withBalance = entries.map((e) => ({ ...e, running: (running += e.type === "DEBIT" ? e.amount : -e.amount) }));
  res.json({ ...c, balance: running, entries: withBalance.reverse() }); // newest first
}));

const EntryIn = z.object({
  type: z.enum(["DEBIT", "CREDIT"]),
  amount: z.coerce.number().int().positive(),
  date: z.string().optional(),
  note: z.string().trim().max(200).default(""),
});
r.post("/customers/:id/entries", ah(async (req, res) => {
  const p = EntryIn.safeParse(req.body);
  if (!p.success) throw new HttpError(400, "Enter an amount greater than zero.");
  const date = p.data.date ? new Date(p.data.date) : new Date();
  if (Number.isNaN(date.getTime())) throw new HttpError(400, "Invalid date.");
  const id = Number(req.params.id) || 0;
  if (!(await query("SELECT 1 FROM customers WHERE id = $1", [id])).rowCount) throw new HttpError(404, "Customer not found");
  await query("INSERT INTO ledger_entries (customer_id, type, amount, note, date) VALUES ($1,$2,$3,$4,$5)", [id, p.data.type, p.data.amount, p.data.note, date]);
  res.status(201).json({ ok: true });
}));

// ───────── Chatbot knowledge ─────────
r.get("/knowledge", ah(async (_req, res) => {
  res.json((await query("SELECT source, count(*)::int AS chunks FROM knowledge_chunks GROUP BY source ORDER BY source")).rows);
}));

r.post("/knowledge", ah(async (req, res) => {
  const source = slugify(req.body?.source ?? "");
  const text = String(req.body?.text ?? "").trim();
  if (!source || !text) throw new HttpError(400, "Give the document a name and some text.");
  try { res.json({ chunks: await indexDocument(source, text) }); }
  catch (e) { throw new HttpError(502, `Indexing failed: ${e.message}`); }
}));

r.delete("/knowledge/:source", ah(async (req, res) => {
  await query("DELETE FROM knowledge_chunks WHERE source = $1", [req.params.source]);
  res.json({ ok: true });
}));

export default r;
