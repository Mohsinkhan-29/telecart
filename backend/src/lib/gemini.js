const BASE = "https://generativelanguage.googleapis.com/v1beta";
const DIMS = 768; // gemini-embedding-001 defaults to 3072; 768 keeps JSON rows small
const key = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  return process.env.GEMINI_API_KEY;
};
const embedModel = () => process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
// First model is tried first; the rest are backups for when it's busy.
const chatModels = () => [
  process.env.GEMINI_CHAT_MODEL || "gemini-3.8-flash",
  ...(process.env.GEMINI_FALLBACK_MODELS || "gemini-flash-latest,gemini-3.5-flash").split(","),
].map((m) => m.trim()).filter((m, i, a) => m && a.indexOf(m) === i);

const BUSY = new Set([429, 500, 503, 504]); // temporary errors worth retrying
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function embed(text, task) {
  const res = await fetch(`${BASE}/models/${embedModel()}:embedContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key() },
    body: JSON.stringify({ content: { parts: [{ text }] }, taskType: task, outputDimensionality: DIMS }),
  });
  if (!res.ok) throw new Error(`Gemini embed ${res.status}: ${await res.text()}`);
  return (await res.json()).embedding.values;
}

/** history: [{ role: "user" | "model", text }] */
export async function chat(system, history) {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
  });
  let lastError;
  for (const model of chatModels()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`${BASE}/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key() },
        body,
      });
      if (res.ok) {
        const data = await res.json();
        const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
        if (text) return text;
        lastError = new Error(`Gemini chat ${model}: empty reply`);
        break; // try the next model
      }
      lastError = new Error(`Gemini chat ${model} ${res.status}: ${await res.text()}`);
      if (!BUSY.has(res.status)) break; // e.g. 404: this model won't work, move on
      if (attempt === 0) await wait(800);
    }
    console.warn("[chat] falling back:", lastError.message.slice(0, 160));
  }
  throw lastError;
}