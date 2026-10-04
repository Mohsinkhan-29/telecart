import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { adminApi } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { ErrorBox, Loading } from "../components/Status";
import { formatPKR } from "../lib/format";

export default function Ledger() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get("q") || "", owing = sp.get("owing") || "";
  const qs = new URLSearchParams(Object.entries({ q, owing }).filter(([, v]) => v)).toString();
  const { data, error, loading, reload } = useFetch(() => adminApi.get(`/customers${qs ? `?${qs}` : ""}`), [qs]);
  const navigate = useNavigate();
  const [newErr, setNewErr] = useState(null);

  const setParam = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n); };
  const chip = (on) => `px-3 py-1.5 rounded border ${on ? "border-amber text-amber" : "border-steel-line text-chrome-light"}`;

  async function addCustomer(e) {
    e.preventDefault(); setNewErr(null);
    const f = Object.fromEntries(new FormData(e.target));
    try { const { id } = await adminApi.post("/customers", f); navigate(`/admin/ledger/${id}`); }
    catch (err) { setNewErr(err.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Ledger</h1>
          {data && <p className="text-sm text-chrome mt-1">Customers owe you <span className="font-mono text-amber">{formatPKR(data.totalOwed)}</span></p>}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setParam("q", new FormData(e.target).get("q").trim()); }}>
          <input name="q" defaultValue={q} placeholder="Search name or phone" className="input py-2" />
          <button className="btn btn-outline">Search</button>
        </form>
      </div>
      <div className="flex gap-2 text-sm">
        <button className={chip(!owing)} onClick={() => setParam("owing", "")}>Everyone</button>
        <button className={chip(owing)} onClick={() => setParam("owing", "1")}>Owing only</button>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (
        <div className="overflow-x-auto border border-steel-line rounded">
          <table className="w-full text-sm">
            <thead><tr><th className="th">Customer</th><th className="th">Phone</th><th className="th text-right">Balance</th></tr></thead>
            <tbody>
              {data.customers.map((c) => (
                <tr key={c.id}>
                  <td className="td"><Link to={`/admin/ledger/${c.id}`} className="hover:text-amber font-semibold">{c.name}</Link></td>
                  <td className="td font-mono text-xs">{c.phone}</td>
                  <td className={`td text-right font-mono ${c.balance > 0 ? "text-amber" : c.balance < 0 ? "text-ok" : "text-chrome"}`}>
                    {c.balance < 0 ? `${formatPKR(-c.balance)} advance` : formatPKR(c.balance)}
                  </td>
                </tr>
              ))}
              {data.customers.length === 0 && <tr><td className="td text-chrome" colSpan={3}>No customers yet — they appear automatically when someone orders.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <details className="spec-plate max-w-md">
        <summary className="cursor-pointer text-sm font-display uppercase tracking-wide">+ Add walk-in customer</summary>
        <form onSubmit={addCustomer} className="space-y-3 mt-4">
          <div><label className="label">Name</label><input name="name" required className="input" /></div>
          <div><label className="label">Phone</label><input name="phone" type="tel" required className="input" /></div>
          {newErr && <p className="text-danger text-xs">{newErr}</p>}
          <button className="btn btn-primary">Add</button>
        </form>
      </details>
    </div>
  );
}
