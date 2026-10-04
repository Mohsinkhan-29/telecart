import { Router } from "express";
import { z } from "zod";
import { query, withTx } from "../db.js";
import { ah, HttpError, normalizePhone } from "../lib/util.js";
import { PRODUCT_SELECT } from "../lib/products.js";
import { buildOrderMessage, waLink } from "../lib/whatsapp.js";
import { chat } from "../lib/gemini.js";
import { catalogSnapshot, retrieve } from "../lib/rag.js";
import { getSettings, shopName, storeFacts, storeWhatsApp } from "../lib/settings.js";

const r = Router();

// Storefront content saved from Admin → Site content (only the parts the admin changed).
r.get("/settings", ah(async (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(await getSettings());
}));

r.get("/categories", ah(async (_req, res) => {
  const { rows } = await query(`
    SELECT c.id, c.name, c.slug, c.subtitle, c.icon, c.show_on_home AS "showOnHome",
      (SELECT count(*)::int FROM products p WHERE p.category_id = c.id AND p.is_active) AS "productCount"
    FROM categories c ORDER BY c.sort_order, c.name`);
  res.json(rows);
}));

// Footer newsletter.
r.post("/subscribe", ah(async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 160) throw new HttpError(400, "Enter a valid email address.");
  await query("INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING", [email]);
  res.status(201).json({ ok: true });
}));

r.get("/products", ah(async (req, res) => {
  const { category, brand, q, featured, limit } = req.query;
  const where = ["p.is_active"], params = [];
  if (category) { params.push(String(category)); where.push(`c.slug = $${params.length}`); }
  if (brand) { params.push(String(brand)); where.push(`p.brand = $${params.length}`); }
  if (q) { params.push(`%${String(q).slice(0, 80)}%`); where.push(`p.name ILIKE $${params.length}`); }
  if (featured) where.push("p.is_featured");
  params.push(Math.min(Number(limit) || 100, 100));
  const { rows } = await query(
    `${PRODUCT_SELECT} WHERE ${where.join(" AND ")} ORDER BY p.created_at DESC LIMIT $${params.length}`, params);
  res.json(rows);
}));

r.get("/brands", ah(async (_req, res) => {
  const { rows } = await query("SELECT DISTINCT brand FROM products WHERE is_active ORDER BY brand");
  res.json(rows.map((x) => x.brand));
}));

r.get("/products/:slug", ah(async (req, res) => {
  const { rows } = await query(`${PRODUCT_SELECT} WHERE p.slug = $1 AND p.is_active`, [req.params.slug]);
  if (!rows[0]) throw new HttpError(404, "Product not found");
  res.json(rows[0]);
}));

// ───────── Checkout: save the order, return a pre-filled WhatsApp link ─────────
const OrderBody = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  note: z.string().trim().max(500).optional(),
  items: z.array(z.object({ variantId: z.number().int(), qty: z.number().int().min(1).max(10) })).min(1).max(30),
});

r.post("/orders", ah(async (req, res) => {
  const parsed = OrderBody.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Please check your name, phone and cart.");
  const { name, note, items } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) throw new HttpError(400, "Enter a valid phone number.");
  const wa = await storeWhatsApp();
  if (!wa) throw new HttpError(500, "Store WhatsApp number is not configured. Add it in Admin → Site content → Store details.");

  // Merge duplicate lines, then price everything from the DB — never trust client prices.
  const qtyById = new Map();
  for (const i of items) qtyById.set(i.variantId, (qtyById.get(i.variantId) ?? 0) + i.qty);
  const { rows: variants } = await query(
    `SELECT v.id, v.label, v.price, v.stock, p.name, p.is_active
       FROM variants v JOIN products p ON p.id = v.product_id WHERE v.id = ANY($1::int[])`,
    [[...qtyById.keys()]]);
  if (variants.length !== qtyById.size) throw new HttpError(409, "Some items are no longer available. Refresh your cart.");
  for (const v of variants) {
    const qty = qtyById.get(v.id);
    if (!v.is_active || v.stock < qty) {
      throw new HttpError(409, `${v.name}${v.label !== "Standard" ? ` (${v.label})` : ""} — only ${Math.max(0, v.stock)} available.`);
    }
  }
  const lines = variants.map((v) => ({ variantId: v.id, name: v.name, label: v.label, unitPrice: v.price, qty: qtyById.get(v.id) }));
  const total = lines.reduce((n, l) => n + l.unitPrice * l.qty, 0);

  const orderId = await withTx(async (db) => {
    const c = await db.query(
      `INSERT INTO customers (name, phone) VALUES ($1,$2)
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [name, phone]);
    const o = await db.query(
      "INSERT INTO orders (customer_id, total, note) VALUES ($1,$2,$3) RETURNING id", [c.rows[0].id, total, note || null]);
    for (const l of lines) {
      await db.query(
        "INSERT INTO order_items (order_id, variant_id, name, label, unit_price, qty) VALUES ($1,$2,$3,$4,$5,$6)",
        [o.rows[0].id, l.variantId, l.name, l.label, l.unitPrice, l.qty]);
    }
    return o.rows[0].id;
  });

  const shop = await shopName();
  res.status(201).json({ orderId, waUrl: waLink(wa, buildOrderMessage({ id: orderId, name, phone, note, total, items: lines, shop })) });
}));

// ───────── RAG chatbot ─────────
const ChatBody = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "model"]), text: z.string().max(600) })).min(1).max(12),
});

r.post("/chat", ah(async (req, res) => {
  const parsed = ChatBody.safeParse(req.body);
  const history = parsed.success ? parsed.data.messages : null;
  if (!history || history[history.length - 1].role !== "user") throw new HttpError(400, "Bad request");
  const last = history[history.length - 1];
  const SHOP = await shopName();
  try {
    const [chunks, catalog, facts] = await Promise.all([retrieve(last.text), catalogSnapshot(), storeFacts()]);
    if (facts) chunks.unshift({ source: "site-content", content: facts });
    const system = [
      `You are the sales assistant for ${SHOP}, a mobile phone and accessories shop. Be brief and friendly.`,
      `Answer ONLY from the two sections below. If the answer is not there (shop address, delivery, returns, rates, anything), say you are not sure and suggest the customer message the shop on WhatsApp. Never invent prices, specs, stock, addresses or policies.`,
      `Prices are in Pakistani rupees (Rs). To buy, the customer adds items to the cart and checks out — the order is sent to the shop's WhatsApp.`,
      `\n## LIVE CATALOG (prices and stock are current)\n${catalog || "(no products listed)"}`,
      `\n## SHOP INFORMATION\n${chunks.length ? chunks.map((c) => c.content).join("\n---\n") : "(nothing relevant found)"}`,
    ].join("\n");
    const reply = await chat(system, history);
    res.json({ reply, sources: [...new Set(chunks.map((c) => c.source))] });
  } catch (err) {
    console.error("[chat]", err.message);
    throw new HttpError(502, "The assistant is unavailable right now.");
  }
}));

export default r;
