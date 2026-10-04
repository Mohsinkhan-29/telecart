// Indexes every file in /knowledge for the chatbot. Refuses to run while any TODO placeholder remains.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "../db.js";
import { indexDocument } from "../lib/rag.js";

try {
  const dir = join(process.cwd(), "knowledge");
  const files = readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".txt"));
  const pending = files.filter((f) => readFileSync(join(dir, f), "utf8").includes("TODO"));
  if (pending.length) {
    console.error("Fill in the TODO lines first (the bot would repeat them to customers):\n  " + pending.join("\n  "));
    process.exitCode = 1;
  } else {
    for (const f of files) console.log(`${f}: ${await indexDocument(f.replace(/\.(md|txt)$/, ""), readFileSync(join(dir, f), "utf8"))} chunks`);
  }
} catch (e) {
  console.error("Ingest failed:", e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
