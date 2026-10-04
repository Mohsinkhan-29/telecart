import { useState } from "react";
import { adminApi } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { ICON_NAMES } from "../components/Icon";
import { ErrorBox, Loading } from "../components/Status";

const EMPTY = { name: "", subtitle: "", icon: "phone", showOnHome: true, sortOrder: 0 };

function Row({ c, onSaved }) {
  const [f, setF] = useState({ name: c.name, subtitle: c.subtitle, icon: c.icon, showOnHome: c.showOnHome, sortOrder: c.sortOrder });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const dirty = JSON.stringify(f) !== JSON.stringify({ name: c.name, subtitle: c.subtitle, icon: c.icon, showOnHome: c.showOnHome, sortOrder: c.sortOrder });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function save() {
    setBusy(true); setErr(null);
    try { await adminApi.put(`/categories/${c.id}`, { ...f, sortOrder: Number(f.sortOrder) || 0 }); onSaved(); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }
  async function del() {
    if (!confirm(`Delete the category "${c.name}"?`)) return;
    try { await adminApi.del(`/categories/${c.id}`); onSaved(); } catch (e) { setErr(e.message); }
  }

  return (
    <tr>
      <td className="td"><input className="input py-1.5" value={f.name} onChange={(e) => set("name", e.target.value)} /><div className="text-xs text-chrome mt-1 font-mono">/{c.slug} · {c.productCount} product{c.productCount === 1 ? "" : "s"}</div></td>
      <td className="td"><input className="input py-1.5" value={f.subtitle} placeholder="Short line under the name" onChange={(e) => set("subtitle", e.target.value)} /></td>
      <td className="td"><select className="input py-1.5" value={f.icon} onChange={(e) => set("icon", e.target.value)}>{ICON_NAMES.map((n) => <option key={n}>{n}</option>)}</select></td>
      <td className="td"><input type="number" min={0} className="input py-1.5 w-20" value={f.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></td>
      <td className="td text-center"><input type="checkbox" checked={f.showOnHome} onChange={(e) => set("showOnHome", e.target.checked)} aria-label="Show on home" /></td>
      <td className="td text-right whitespace-nowrap">
        <button className="btn btn-primary py-1.5 text-xs" disabled={!dirty || busy} onClick={save}>{busy ? "…" : "Save"}</button>
        <button className="ml-3 text-xs text-chrome hover:text-danger" onClick={del}>Delete</button>
        {err && <p className="text-danger text-xs mt-1 whitespace-normal">{err}</p>}
      </td>
    </tr>
  );
}

export default function Categories() {
  const { data, error, loading, reload } = useFetch(() => adminApi.get("/categories"));
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState(null);

  async function add(e) {
    e.preventDefault(); setErr(null);
    try { await adminApi.post("/categories", { ...f, sortOrder: Number(f.sortOrder) || 0 }); setF(EMPTY); reload(); }
    catch (e2) { setErr(e2.message); }
  }

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Categories</h1>
        <p className="text-sm text-chrome-light mt-1">Categories with "Home" ticked and at least one product appear as tiles on the home page, lowest order number first. Renaming changes the category's link.</p>
      </div>
      <div className="overflow-x-auto border border-steel-line rounded">
        <table className="w-full text-sm">
          <thead><tr><th className="th">Name</th><th className="th">Subtitle</th><th className="th">Icon</th><th className="th">Order</th><th className="th text-center">Home</th><th className="th" /></tr></thead>
          <tbody>{data.map((c) => <Row key={`${c.id}-${c.name}-${c.subtitle}-${c.icon}-${c.sortOrder}-${c.showOnHome}`} c={c} onSaved={reload} />)}</tbody>
        </table>
      </div>
      <form onSubmit={add} className="spec-plate grid sm:grid-cols-[2fr_2fr_1fr_auto] gap-3 items-end max-w-4xl">
        <div><label className="label">New category</label><input required className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label">Subtitle</label><input className="input" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} /></div>
        <div><label className="label">Icon</label><select className="input" value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })}>{ICON_NAMES.map((n) => <option key={n}>{n}</option>)}</select></div>
        <button className="btn btn-primary">Add</button>
        {err && <p className="text-danger text-xs sm:col-span-4">{err}</p>}
      </form>
    </div>
  );
}
