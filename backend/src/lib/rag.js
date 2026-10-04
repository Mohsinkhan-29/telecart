import { query, withTx } from "../db.js";
import { embed } from "./gemini.js";

/** ~800-char chunks split on paragraphs, with a small overlap. */
export function chunkText(text, target = 800, overlap = 100) {
  const paras = text.replace(/\r/g, "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let cur = "";
  const push = () => { if (cur.trim()) chunks.push(cur.trim()); };
  for (const p of paras) {
    if (p.length > target) {
      push(); cur = "";
      for (let i = 0; i < p.length; i += target - overlap) chunks.push(p.slice(i, i + target));
    } else if ((cur + "\n\n" + p).length > target) {
      push();
      cur = (cur.slice(-overlap) + "\n\n" + p).trim();
    } else cur = cur ? cur + "\n\n" + p : p;
  }
  push();
  return chunks;
}

const cosine = (a, b) => {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  return d / (Math.sqrt(na) * Math.sqrt(nb) || 1);
};

/** Re-indexing a source replaces its old chunks. Embeds first, so a Gemini failure leaves old data intact. */
export async function indexDocument(source, text) {
  const chunks = chunkText(text);
  const vectors = [];
  for (const c of chunks) vectors.push(await embed(c, "RETRIEVAL_DOCUMENT"));
  await withTx(async (db) => {
    await db.query("DELETE FROM knowledge_chunks WHERE source = $1", [source]);
    for (let i = 0; i < chunks.length; i++) {
      await db.query(
        "INSERT INTO knowledge_chunks (source, chunk_index, content, embedding) VALUES ($1,$2,$3,$4)",
        [source, i, chunks[i], JSON.stringify(vectors[i])]
      );
    }
  });
  return chunks.length;
}

export async function retrieve(question, topK = 4, minScore = 0.5) {
  const { rows } = await query("SELECT source, content, embedding FROM knowledge_chunks");
  if (!rows.length) return [];
  const q = await embed(question, "RETRIEVAL_QUERY");
  return rows
    .map((r) => ({ source: r.source, content: r.content, score: cosine(q, r.embedding) }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/** Live catalog snapshot — prices and stock are always current, never stale KB text. */
export async function catalogSnapshot() {
  const { rows } = await query(`
    SELECT p.name, p.brand, p.condition, p.warranty, c.name AS category,
      COALESCE((SELECT string_agg(v.label || ': Rs ' || v.price || ' (' ||
          CASE WHEN v.stock > 0 THEN v.stock || ' in stock' ELSE 'out of stock' END || ')', '; ' ORDER BY v.sort_order, v.id)
        FROM variants v WHERE v.product_id = p.id), '') AS variants
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.is_active ORDER BY c.sort_order, p.name`);
  return rows
    .map((p) => `- ${p.name} [${p.category}, ${p.brand}, ${p.condition.toLowerCase().replace("_", " ")}${p.warranty ? `, warranty: ${p.warranty}` : ""}] ${p.variants}`)
    .join("\n");
}
