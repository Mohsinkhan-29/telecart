import { useState } from "react";
import { adminApi } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { ErrorBox, Loading } from "../components/Status";

export default function Knowledge() {
  const { data, error, loading, reload } = useFetch(() => adminApi.get("/knowledge"));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function save(e) {
    e.preventDefault();
    const form = e.target;
    setBusy(true); setMsg(null);
    try {
      const { chunks } = await adminApi.post("/knowledge", Object.fromEntries(new FormData(form)));
      setMsg({ ok: true, text: `Indexed ${chunks} chunk${chunks === 1 ? "" : "s"}.` });
      form.reset(); reload();
    } catch (err) { setMsg({ ok: false, text: err.message }); }
    setBusy(false);
  }
  async function del(source) {
    if (!confirm(`Delete "${source}" from the chatbot's knowledge?`)) return;
    try { await adminApi.del(`/knowledge/${encodeURIComponent(source)}`); reload(); } catch (e) { alert(e.message); }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl">Chatbot knowledge</h1>
        <p className="text-sm text-chrome-light mt-2">Add shop address &amp; hours, delivery, returns, warranty and payment info. Products and prices are read live from the catalog — don't paste them here. Saving a document with an existing name replaces it.</p>
      </div>
      <form onSubmit={save} className="spec-plate space-y-3">
        <div><label className="label">Document name</label><input name="source" required placeholder="e.g. delivery" className="input" /></div>
        <div><label className="label">Text</label><textarea name="text" required rows={8} className="input" /></div>
        {msg && <p className={`text-sm ${msg.ok ? "text-ok" : "text-danger"}`}>{msg.text}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Indexing…" : "Save & index"}</button>
      </form>
      <div>
        <h2 className="text-lg mb-3">Indexed documents</h2>
        {loading && <Loading />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {data?.length === 0 && <p className="text-chrome text-sm">Nothing yet — the bot can only answer from the catalog.</p>}
        <ul className="divide-y divide-steel-line border border-steel-line rounded">
          {data?.map((g) => (
            <li key={g.source} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span>{g.source} <span className="text-chrome font-mono text-xs">· {g.chunks} chunk{g.chunks === 1 ? "" : "s"}</span></span>
              <button onClick={() => del(g.source)} className="text-xs text-chrome hover:text-danger">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
