# Telecart — React + Node.js

- `backend/`  Express + PostgreSQL (`pg`), JWT admin auth, Resend password reset, Gemini RAG chatbot
- `frontend/` React 18 + Vite + React Router + Tailwind

## Run it (two terminals)

**Backend**
```
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, ADMIN_EMAIL/PASSWORD, WHATSAPP_NUMBER
npm install
npm run migrate             # creates the tables
npm run seed                # admin login + categories + 3 SAMPLE products
npm run seed:inventory      # your real price list: 8 iPhone options + 14 accessories (stock 5 each)
npm run dev                 # API on http://localhost:5000
```

**Frontend**
```
cd frontend
npm install
npm run dev                 # http://localhost:5173  (admin: /admin)
```
In development Vite proxies `/api` to the backend (port 5000; override with `VITE_API_PROXY`). In production set `VITE_API_URL` to your API's URL and `FRONTEND_URL` (backend) to your site's URL.

## Database
All tables are created inside their own Postgres schema called `telecart`, so they can't clash with any tables already in the database (including the old Prisma ones). The migration is safe to re-run. On Neon, use the direct (non-pooled) connection string for `npm run migrate`.

## How it works
- **Cart → WhatsApp:** cart lives in the browser. `POST /api/orders` re-prices every line from the database, checks stock, saves the order as PENDING, and returns a `wa.me` link with the order pre-filled.
- **Orders (admin):** *Confirm* deducts stock and posts a DEBIT to the customer's ledger in one transaction. *Cancel* on a confirmed order restores stock and posts a reversing CREDIT.
- **Ledger (admin):** one account book per customer. Debit = they owe more, credit = payment received. Entries are append-only; fix mistakes with an opposite entry. Walk-in customers can be added by hand.
- **Chatbot:** answers from the live catalog (products, prices, stock) plus your shop-info documents. Fill in `backend/knowledge/*.md` (location, delivery, returns, rates) and run `npm run rag:ingest` — it refuses to run while any `TODO` remains — or paste documents in Admin → Chatbot.
- **Password reset:** Admin → "Forgot password?" emails a one-hour link via Resend.

## Notes
- Product images are URLs (no upload storage yet).
- Gemini model names are env vars (`GEMINI_CHAT_MODEL`, `GEMINI_EMBEDDING_MODEL`). If the chat returns an error, check Google's current model list. Changing the embedding model means re-running ingest.
- There is no delivery charge on orders yet.

## Storefront design + admin-editable content (new)
- **Look:** the storefront uses the new Tele Cart design (dark header, Poppins, border-glow product cards, spotlight cards, price list, custom cursor). **The hero is unchanged**: same canvas, card and phones; only its text now comes from the admin.
- **Admin → Site content:** edit every text on the site without code: store details (WhatsApp, phone, address, hours, socials), theme colour and cursor, header menu, hero, every home section, shop page, About, Contact, Delivery & returns, footer and SEO titles/descriptions. Saved text is stored in the `settings` table; anything you never edited falls back to `frontend/src/lib/siteDefaults.js`.
- **WhatsApp number:** orders now go to the number in Site content → Store details; `WHATSAPP_NUMBER` in `.env` is only the fallback.
- **Admin → Categories:** add, rename, reorder and pick an icon; tick "Home" to show a category as a tile on the home page.
- **Admin → Newsletter:** emails from the footer sign-up, with CSV download.
- **Products:** optional SEO title/description per product. Products without photos get a drawn phone in the colour named in the variant label (White, Blue, Orange…) or a drawn charger/cable/handsfree.
- **New pages:** `/about`, `/contact`, `/delivery-returns`. Every page sets its own title, description and Open Graph tags; product pages also add Product structured data.
- **Chatbot:** also answers from Store details and the Delivery & returns text.
- Run `npm run migrate` once after updating; it only adds tables/columns and is safe on your existing data.
