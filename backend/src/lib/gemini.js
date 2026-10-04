const BASE = "https://generativelanguage.googleapis.com/v1beta";
const DIMS = 768; // gemini-embedding-001 defaults to 3072; 768 keeps JSON rows small
const key = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  return process.env.GEMINI_API_KEY;
};
const embedModel = () => process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const chatModel = () => process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";

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
  const res = await fetch(`${BASE}/models/${chatModel()}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key() },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini chat ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
}
