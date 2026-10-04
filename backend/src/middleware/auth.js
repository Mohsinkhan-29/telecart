import jwt from "jsonwebtoken";
import { HttpError } from "../lib/util.js";

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error("JWT_SECRET missing or too short");
  return s;
};

export const signToken = (admin) =>
  jwt.sign({ sub: admin.id, email: admin.email, role: "admin" }, secret(), { expiresIn: "7d" });

export function requireAdmin(req, _res, next) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || "");
  if (!m) return next(new HttpError(401, "Not logged in"));
  try {
    const p = jwt.verify(m[1], secret());
    if (p.role !== "admin") throw new Error("bad role");
    req.admin = { id: p.sub, email: p.email };
    next();
  } catch {
    next(new HttpError(401, "Session expired — log in again"));
  }
}
