export const SHOP = import.meta.env.VITE_SHOP_NAME || "Telecart";
export const formatPKR = (n) => `₨ ${Math.round(n).toLocaleString("en-PK")}`;
export const CONDITION_LABELS = { NEW: "New", OPEN_BOX: "Open box", USED: "Used" };
export const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
export const fmtDateTime = (d) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
export const specsToText = (specs) => Object.entries(specs || {}).map(([k, v]) => `${k}: ${v}`).join("\n");
