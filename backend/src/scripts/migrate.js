// Creates everything inside a dedicated "telecart" schema. Safe to re-run.
import { pool } from "../db.js";

const SQL = `
CREATE SCHEMA IF NOT EXISTS telecart;
SET search_path TO telecart;

CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  admin_id   INT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  brand       TEXT NOT NULL,
  category_id INT NOT NULL REFERENCES categories(id),
  description TEXT NOT NULL DEFAULT '',
  condition   TEXT NOT NULL DEFAULT 'NEW' CHECK (condition IN ('NEW','OPEN_BOX','USED')),
  warranty    TEXT,
  specs       JSONB NOT NULL DEFAULT '{}',
  images      TEXT[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Price and stock live on the variant ("8GB/256GB"). Accessories get one "Standard" variant.
CREATE TABLE IF NOT EXISTS variants (
  id               SERIAL PRIMARY KEY,
  product_id       INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label            TEXT NOT NULL DEFAULT 'Standard',
  sku              TEXT UNIQUE,
  price            INT NOT NULL CHECK (price >= 0),
  compare_at_price INT,
  stock            INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sort_order       INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);

CREATE TABLE IF NOT EXISTS customers (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id          SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id),
  status      TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','CANCELLED')),
  total       INT NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- name/label/unit_price are snapshots so old orders survive catalog edits.
CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id INT REFERENCES variants(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  label      TEXT NOT NULL,
  unit_price INT NOT NULL,
  qty        INT NOT NULL CHECK (qty > 0)
);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);

-- Append-only account book. Balance owed = SUM(DEBIT) - SUM(CREDIT).
CREATE TABLE IF NOT EXISTS ledger_entries (
  id          SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id    INT REFERENCES orders(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN ('DEBIT','CREDIT')),
  amount      INT NOT NULL CHECK (amount > 0),
  note        TEXT NOT NULL DEFAULT '',
  date        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_customer ON ledger_entries(customer_id, date);

-- RAG knowledge (shop info). Products/prices are read live from the catalog, not stored here.
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id          SERIAL PRIMARY KEY,
  source      TEXT NOT NULL,
  chunk_index INT NOT NULL DEFAULT 0,
  content     TEXT NOT NULL,
  embedding   JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_source ON knowledge_chunks(source);

-- Storefront content edited from Admin → Site content. One JSON document per section
-- (store, hero, home, about, ...). Only overrides are stored; the frontend fills in defaults.
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Newsletter sign-ups from the footer.
CREATE TABLE IF NOT EXISTS subscribers (
  id         SERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Category tiles on the home page.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS subtitle     TEXT    NOT NULL DEFAULT '';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon         TEXT    NOT NULL DEFAULT 'phone';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT true;

-- Per-product search snippet (falls back to the template in Site content → SEO).
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Uploaded product photos, stored in the database and served from /api/images/:id
CREATE TABLE IF NOT EXISTS images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mime       TEXT NOT NULL,
  data       BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;



try {
  await pool.query(SQL);
  console.log("Migration complete (schema: telecart).");
} catch (e) {
  console.error("Migration failed:", e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
