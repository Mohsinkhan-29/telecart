const SHOP = process.env.SHOP_NAME || "Telecart";
const pkr = (n) => `₨ ${Math.round(n).toLocaleString("en-PK")}`;

export const waLink = (number, text) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

export function buildOrderMessage(o) {
  const lines = o.items.map((i, n) => {
    const variant = i.label && i.label !== "Standard" ? ` (${i.label})` : "";
    return `${n + 1}. ${i.name}${variant} × ${i.qty} — ${pkr(i.unitPrice * i.qty)}`;
  });
  return [
    `*New order #${o.id} — ${o.shop || SHOP}*`, "",
    `Name: ${o.name}`, `Phone: ${o.phone}`, "",
    ...lines, "",
    `*Total: ${pkr(o.total)}*`,
    o.note ? `Note: ${o.note}` : "",
  ].filter(Boolean).join("\n");
}
