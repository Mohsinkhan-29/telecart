/** Digits only with country code: 0300 1234567 -> 923001234567. */
export function waDigits(raw) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0") && d.length === 11) d = "92" + d.slice(1);
  return d.length >= 10 ? d : "";
}

/** wa.me link to the shop. Without a saved number it opens WhatsApp with just the text. */
export const waLink = (number, text = "") => {
  const n = waDigits(number);
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};
