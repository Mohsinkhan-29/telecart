import express from "express";
import path from "node:path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pool } from "./db.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: (process.env.FRONTEND_URL || "http://localhost:5173").split(",") }));
app.use(express.json({ limit: "100kb" }));

const limiter = (windowMin, max, message) =>
  rateLimit({ windowMs: windowMin * 60_000, max, standardHeaders: true, legacyHeaders: false, message: { error: message } });

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/orders", limiter(10, 20, "Too many orders — try again in a few minutes."));
app.use("/api/chat", limiter(1, 15, "Slow down a little — try again in a minute."));
app.use("/api/subscribe", limiter(10, 10, "Too many sign-ups — try again later."));
app.use("/api/admin/login", limiter(15, 10, "Too many login attempts — try again later."));
app.use("/api/admin/forgot-password", limiter(15, 5, "Too many requests — try again later."));
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const port = process.env.PORT || 5000;
app.listen(port, async () => {
  try {
    await pool.query("SELECT 1 FROM telecart.categories LIMIT 1");
    console.log(`Telecart API on :${port}`);
  } catch (e) {
    console.error(`API started on :${port}, but the database isn't ready: ${e.message}\nRun: npm run migrate && npm run seed`);
  }
});
