export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/** Wrap async route handlers so thrown errors reach the error middleware. */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Digits only, with country code. Pakistani local numbers (03xx...) become 923xx... */
export function normalizePhone(raw) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0") && d.length === 11) d = "92" + d.slice(1);
  return d.length >= 10 && d.length <= 15 ? d : null;
}

/** "Key: Value" lines -> object */
export function parseSpecs(text) {
  const out = {};
  for (const line of String(text ?? "").split("\n")) {
    const i = line.indexOf(":");
    if (i < 1) continue;
    const k = line.slice(0, i).trim(), v = line.slice(i + 1).trim();
    if (k && v) out[k] = v;
  }
  return out;
}
