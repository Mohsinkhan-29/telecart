import { query } from "../db.js";
import { normalizePhone } from "./util.js";

// Sections the admin can edit. The storefront ships the default text for each one
// (frontend/src/lib/siteDefaults.js); the database only keeps what the admin changed.
export const SETTING_KEYS = ["store", "theme", "header", "hero", "home", "shop", "about", "contact", "policies", "footer", "seo"];

export async function getSettings() {
  const { rows } = await query("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getSection(key) {
  const { rows } = await query("SELECT value FROM settings WHERE key = $1", [key]);
  return rows[0]?.value ?? {};
}

/** WhatsApp number for orders: Site content → Store details first, then WHATSAPP_NUMBER in .env. */
export async function storeWhatsApp() {
  const store = await getSection("store").catch(() => ({}));
  return normalizePhone(store.whatsapp) || normalizePhone(process.env.WHATSAPP_NUMBER) || null;
}

export async function shopName() {
  const store = await getSection("store").catch(() => ({}));
  return (store.name || process.env.SHOP_NAME || "Tele Cart").trim();
}

/** Plain-text store facts for the chatbot, so it can answer "where are you?" from Site content. */
export async function storeFacts() {
  const s = await getSettings().catch(() => ({}));
  const st = s.store || {};
  const lines = [
    st.address && `Address: ${st.address}`,
    st.hours && `Opening hours: ${st.hours}`,
    st.phone && `Phone: ${st.phone}`,
    st.whatsapp && `WhatsApp: ${st.whatsapp}`,
    st.email && `Email: ${st.email}`,
  ].filter(Boolean);
  for (const sec of s.policies?.sections ?? []) {
    if (sec?.title && sec?.body) lines.push(`${sec.title}: ${String(sec.body).replace(/\s+/g, " ").trim()}`);
  }
  return lines.join("\n");
}
