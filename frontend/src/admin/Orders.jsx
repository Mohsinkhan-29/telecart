import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminApi } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { ErrorBox, Loading } from "../components/Status";
import { fmtDateTime } from "../lib/format";

const RED = "text-[#ff7a6b]";
const rs = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;
const phoneText = (p) => (/^92\d{10}$/.test(p) ? `0${p.slice(2, 5)} ${p.slice(5)}` : p === "walk-in" ? "" : p);
const TABS = [["", "All"], ["PENDING", "Pending"], ["CONFIRMED", "Confirmed"], ["CANCELLED", "Cancelled"]];
const PILL = {
  PENDING: "bg-amber/10 text-amber",
  CONFIRMED: "bg-[#c5e813]/10 text-[#c5e813]",
  CANCELLED: "bg-steel text-chrome",
};
const small = "px-3 py-1.5 rounded border text-xs font-semibold transition-colors disabled:opacity-40";

export default function Orders() {
  const [sp, setSp] = useSearchParams();
  const status = TABS.some(([k]) => k && k === sp.get("status")) ? sp.get("status") : "";
  const [q, setQ] = useState("");
  const { data, error, loading, reload } = useFetch(() => adminApi.get("/orders"));
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState({});

  async function act(o, action) {
    const ask = {
      cancel: o.status === "CONFIRMED"
        ? `Cancel order #${o.id}? Its stock goes back on the shelf and the bill is reversed on ${o.customerName}'s khata.`
        : `Cancel order #${o.id}?`,
      remove: `Remove order #${o.id} for good? This can't be undone.`,
    }[action];
    if (ask && !confirm(ask)) return;
    setBusyId(o.id); setActionError((e) => ({ ...e, [o.id]: null }));
    try {
      if (action === "remove") await adminApi.del(`/orders/${o.id}`);
      else await adminApi.post(`/orders/${o.id}/${action}`);
      reload();
    } catch (err) { setActionError((e) => ({ ...e, [o.id]: err.message })); }
    setBusyId(null);
  }

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const count = (k) => (k ? data.filter((o) => o.status === k).length : data.length);
  const term = q.trim().toLowerCase();
  const list = data.filter((o) => (!status || o.status === status) &&
    (!term || [o.id, o.customerName, o.customerPhone, ...o.items.map((i) => i.name)].join(" ").toLowerCase().includes(term)));
  const pendingValue = data.filter((o) => o.status === "PENDING").reduce((n, o) => n + o.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl uppercase">Orders</h1>
          <p className="text-sm text-chrome mt-1">
            {count("PENDING") ? <>You have <span className="text-amber">{count("PENDING")} waiting</span> worth {rs(pendingValue)}. Confirm once the customer replies on WhatsApp.</>
              : "No orders waiting. New website orders show up here."}
          </p>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders"
          placeholder="Search order #, customer, phone or product" className="input py-2 w-72" />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(([k, label]) => (
          <button key={label} onClick={() => setSp(k ? { status: k } : {})}
            className={`px-3.5 py-1.5 rounded border text-sm ${status === k ? "border-amber text-amber" : "border-steel-line text-chrome-light hover:border-chrome"}`}>
            {label} <span className="ml-1 font-mono text-xs opacity-70">{count(k)}</span>
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="bg-asphalt-2 border border-steel-line rounded-lg p-10 text-center text-chrome">
          {term ? "No orders match your search." : "No orders here yet."}
        </div>
      )}

      <div className="grid xl:grid-cols-2 gap-4 items-start">
        {list.map((o) => {
          const busy = busyId === o.id;
          const phone = phoneText(o.customerPhone);
          return (
            <article key={o.id} className={`bg-asphalt-2 border rounded-lg overflow-hidden ${o.status === "PENDING" ? "border-amber/40" : "border-steel-line"} ${o.status === "CANCELLED" ? "opacity-70" : ""}`}>
              <header className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-steel-line">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-xl">#{o.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PILL[o.status]}`}>{o.status[0] + o.status.slice(1).toLowerCase()}</span>
                  </div>
                  <p className="text-xs text-chrome mt-1">{fmtDateTime(o.createdAt)}</p>
                </div>
                <div className="text-right">
                  <Link to={`/admin/ledger/${o.customerId}`} className="font-semibold text-offwhite hover:text-amber">{o.customerName}</Link>
                  {phone && (
                    <a className="block text-xs font-mono text-chrome hover:text-[#c5e813]" href={`https://wa.me/${o.customerPhone}`} target="_blank" rel="noreferrer">
                      {phone} · WhatsApp ↗
                    </a>
                  )}
                </div>
              </header>

              <ul className="px-5 py-3 text-sm divide-y divide-steel-line/50">
                {o.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-4 py-2">
                    <span className="text-offwhite">
                      {i.name}{i.label !== "Standard" && <span className="text-chrome"> · {i.label}</span>}
                      <span className="text-chrome"> × {i.qty}</span>
                    </span>
                    <span className="font-mono text-chrome-light whitespace-nowrap">{rs(i.unitPrice * i.qty)}</span>
                  </li>
                ))}
              </ul>
              {o.note && <p className="mx-5 mb-3 text-xs text-chrome-light whitespace-pre-line bg-steel/50 rounded px-3 py-2">{o.note}</p>}

              <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-steel-line bg-black/10">
                <span className="font-mono text-lg font-semibold text-offwhite">{rs(o.total)}</span>
                <div className="flex flex-wrap gap-2">
                  {o.status === "PENDING" && (
                    <button disabled={busy} onClick={() => act(o, "confirm")} title="Takes the items out of stock and adds the bill to the customer's khata"
                      className={`${small} border-[#c5e813] bg-[#c5e813] text-ink hover:brightness-95`}>{busy ? "…" : "Confirm"}</button>
                  )}
                  {o.status !== "CANCELLED" && (
                    <button disabled={busy} onClick={() => act(o, "cancel")} className={`${small} border-steel-line text-chrome-light hover:border-chrome`}>Cancel</button>
                  )}
                  {o.status !== "CONFIRMED" && (
                    <button disabled={busy} onClick={() => act(o, "remove")} className={`${small} border-[#ff7a6b]/40 ${RED} hover:bg-[#ff7a6b]/10`}>Remove</button>
                  )}
                </div>
              </footer>
              {actionError[o.id] && <p className={`px-5 pb-3 text-xs ${RED}`}>{actionError[o.id]}</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
}