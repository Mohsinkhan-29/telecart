import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminApi } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { ErrorBox, Loading } from "../components/Status";
import { formatPKR, fmtDate } from "../lib/format";

export default function CustomerLedger() {
  const { id } = useParams();
  const { data: c, error, loading, reload } = useFetch(() => adminApi.get(`/customers/${id}`), [id]);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  async function addEntry(e) {
    e.preventDefault();
    const form = e.target;
    setBusy(true); setFormErr(null);
    try {
      await adminApi.post(`/customers/${id}/entries`, Object.fromEntries(new FormData(form)));
      form.reset(); reload();
    } catch (err) { setFormErr(err.message); }
    setBusy(false);
  }

  if (loading && !c) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <div className="space-y-6">
      <Link to="/admin/ledger" className="text-sm text-chrome hover:text-amber">← All customers</Link>
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl">{c.name}</h1>
          <a className="font-mono text-sm text-chrome hover:text-amber" href={`https://wa.me/${c.phone}`} target="_blank" rel="noreferrer">{c.phone} ↗</a>
        </div>
        <div className="spec-plate text-right">
          <p className="font-mono text-xs uppercase text-chrome">{c.balance < 0 ? "Advance paid" : "Owes you"}</p>
          <p className={`font-display text-3xl ${c.balance > 0 ? "text-amber" : c.balance < 0 ? "text-ok" : ""}`}>{formatPKR(Math.abs(c.balance))}</p>
        </div>
      </div>

      <form onSubmit={addEntry} className="spec-plate grid sm:grid-cols-[1fr_1fr_1fr_2fr_auto] gap-3 items-end">
        <div><label className="label text-xs">Type</label>
          <select name="type" className="input py-2"><option value="CREDIT">Payment received</option><option value="DEBIT">Charge / credit sale</option></select></div>
        <div><label className="label text-xs">Amount (₨)</label><input name="amount" type="number" min={1} required className="input py-2" /></div>
        <div><label className="label text-xs">Date</label><input name="date" type="date" defaultValue={today} className="input py-2" /></div>
        <div><label className="label text-xs">Note</label><input name="note" className="input py-2" placeholder="e.g. cash, Easypaisa, repair charge" /></div>
        <button className="btn btn-primary" disabled={busy}>{busy ? "…" : "Add entry"}</button>
        {formErr && <p className="text-danger text-xs sm:col-span-5">{formErr}</p>}
      </form>

      <div className="overflow-x-auto border border-steel-line rounded">
        <table className="w-full text-sm">
          <thead><tr><th className="th">Date</th><th className="th">Details</th><th className="th text-right">Debit</th><th className="th text-right">Credit</th><th className="th text-right">Balance</th></tr></thead>
          <tbody>
            {c.entries.map((e) => (
              <tr key={e.id}>
                <td className="td whitespace-nowrap">{fmtDate(e.date)}</td>
                <td className="td">{e.note || "—"}{e.orderId && <Link to="/admin/orders" className="ml-2 text-xs text-chrome hover:text-amber">order #{e.orderId}</Link>}</td>
                <td className="td text-right font-mono">{e.type === "DEBIT" ? formatPKR(e.amount) : ""}</td>
                <td className="td text-right font-mono text-ok">{e.type === "CREDIT" ? formatPKR(e.amount) : ""}</td>
                <td className="td text-right font-mono">{formatPKR(e.running)}</td>
              </tr>
            ))}
            {c.entries.length === 0 && <tr><td className="td text-chrome" colSpan={5}>No entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-chrome">Entries can't be edited. To fix a mistake, add an opposite entry with a note.</p>
    </div>
  );
}
