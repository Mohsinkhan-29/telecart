// Loads Tele Cart's real price list (phones + accessories) into the catalog. Safe to re-run:
// existing products (same slug) are skipped, so your later edits in the admin are kept.
//   npm run seed:inventory            -> every variant gets stock 5
//   npm run seed:inventory -- 10      -> every variant gets stock 10
// Prices are PKR. Update stock, prices and photos in Admin → Catalog afterwards.
import { pool } from "../db.js";
import { slugify } from "../lib/util.js";

const STOCK = Math.max(0, Number(process.argv[2]) || 5);

const CATEGORIES = [
  { name: "Mobile Phones", subtitle: "iPhone 17 Pro Max, 17 Pro, iPhone 16", icon: "phone", order: 0 },
  { name: "Chargers", subtitle: "20W, 40W and Samsung fast chargers", icon: "charger", order: 1 },
  { name: "Cables", subtitle: "iPhone 14, 15, 16 and C to C cables", icon: "cable", order: 2 },
  { name: "Handsfree", subtitle: "Type-C handsfree for iPhone", icon: "headset", order: 3 },
];

const PHONES = [
  {
    name: "iPhone 17 Pro Max", brand: "Apple", cat: "Mobile Phones", featured: true,
    specs: { Display: "6.9-inch", Chip: "A19 Pro", "Rear camera": "48MP triple camera system" },
    description: "Apple's biggest-screen flagship. Choose 256GB or 512GB in White, Orange or Blue, with a physical SIM or eSIM.",
    variants: [
      ["512GB · White · Physical SIM", 440000],
      ["512GB · Orange · eSIM", 390000],
      ["256GB · Blue · Physical SIM", 385000],
      ["256GB · Blue · eSIM", 345000],
    ],
  },
  {
    name: "iPhone 17 Pro", brand: "Apple", cat: "Mobile Phones", featured: true,
    specs: { Display: "6.3-inch", Chip: "A19 Pro", "Rear camera": "48MP triple camera system" },
    description: "Flagship power in a more compact size, in 256GB and 512GB with a physical SIM or eSIM.",
    variants: [
      ["256GB · White · eSIM", 330000],
      ["256GB · White · Physical SIM", 360000],
      ["512GB · White · eSIM", 360000],
    ],
  },
  {
    name: "iPhone 16", brand: "Apple", cat: "Mobile Phones", featured: true,
    specs: { Display: "6.1-inch", Chip: "A18" },
    description: "A new iPhone at a lower price. JV: factory unlocked, not PTA registered. Ask us about PTA status before you buy.",
    variants: [["128GB · Black · JV", 145000]],
  },
];

const ACCESSORIES = [
  ["20W Charger (2-pin)", "Generic", "Chargers", 1500, { Output: "20W", Plug: "2-pin" }],
  ["20W Fast Charger (3-pin)", "Generic", "Chargers", 3000, { Output: "20W", Plug: "3-pin" }, true],
  ["20W NFC Fast Charger (3-pin)", "Generic", "Chargers", 4000, { Output: "20W", Plug: "3-pin", Extra: "NFC" }],
  ["40W Fast Charger (3-pin)", "Generic", "Chargers", 6500, { Output: "40W", Plug: "3-pin" }],
  ["Samsung 25W Fast Charger", "Samsung", "Chargers", 2500, { Output: "25W" }],
  ["Samsung 45W Fast Charger", "Samsung", "Chargers", 4500, { Output: "45W" }, true],
  ["iPhone 14 Cable", "Generic", "Cables", 1500, { For: "iPhone 14" }],
  ["iPhone 14 Original Cable", "Apple", "Cables", 2000, { For: "iPhone 14", Type: "Original" }],
  ["iPhone 15 Cable", "Generic", "Cables", 2000, { For: "iPhone 15" }],
  ["iPhone 15 Original Cable", "Apple", "Cables", 2500, { For: "iPhone 15", Type: "Original" }],
  ["iPhone 16 Original Cable", "Apple", "Cables", 3000, { For: "iPhone 16", Type: "Original" }, true],
  ["USB-C to USB-C Cable", "Generic", "Cables", 1200, { Connectors: "USB-C to USB-C" }],
  ["240W USB-C to USB-C Cable", "Generic", "Cables", 5000, { Connectors: "USB-C to USB-C", Power: "240W" }],
  ["Type-C Handsfree for iPhone", "Generic", "Handsfree", 1500, { Connector: "USB-C", For: "iPhone" }],
];

try {
  const cats = {};
  for (const c of CATEGORIES) {
    const { rows } = await pool.query(
      `INSERT INTO categories (name, slug, subtitle, icon, show_on_home, sort_order) VALUES ($1,$2,$3,$4,true,$5)
       ON CONFLICT (slug) DO UPDATE SET subtitle = EXCLUDED.subtitle, icon = EXCLUDED.icon RETURNING id`,
      [c.name, slugify(c.name), c.subtitle, c.icon, c.order]);
    cats[c.name] = rows[0].id;
  }

  let added = 0, skipped = 0;
  const insert = async (p) => {
    const slug = slugify(p.name);
    if ((await pool.query("SELECT 1 FROM products WHERE slug = $1", [slug])).rowCount) { skipped++; return; }
    const { rows } = await pool.query(
      `INSERT INTO products (slug, name, brand, category_id, description, specs, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [slug, p.name, p.brand, cats[p.cat], p.description || "", JSON.stringify(p.specs || {}), !!p.featured]);
    for (const [i, [label, price]] of p.variants.entries()) {
      await pool.query("INSERT INTO variants (product_id, label, price, stock, sort_order) VALUES ($1,$2,$3,$4,$5)",
        [rows[0].id, label, price, STOCK, i]);
    }
    added++;
  };

  for (const p of PHONES) await insert(p);
  for (const [name, brand, cat, price, specs, featured] of ACCESSORIES) {
    await insert({ name, brand, cat, specs, featured, variants: [["Standard", price]] });
  }
  console.log(`Inventory loaded: ${added} added, ${skipped} already there. Stock per variant: ${STOCK}.`);
} catch (e) {
  console.error("Inventory seed failed:", e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
