import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminApi } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { ErrorBox, Loading } from "../components/Status";
import { formatPKR, fmtDateTime } from "../lib/format";

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"];
const COLOR = { PENDING: "text-amber", CONFIRMED: "text-ok", CANCELLED: "text-chrome" };

export default function Orders() {
  const [sp] = useSearchParams();
  const status = STATUSES.includes(sp.get("status")) ? sp.get("status") : "";
  const { data, error, loading, reload } = useFetch(() => adminApi.get(`/orders${status ? `?status=${status}` : ""}`), [status]);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState({});

  async function act(id, action) {
    if (action === "cancel" && !confirm("Cancel this order? If it was confirmed, stock is restored and a reversing ledger entry is added.")) return;
    setBusyId(id); setActionError((e) => ({ ...e, [id]: null }));
    try { await adminApi.post(`/orders/${id}/${action}`); reload(); }
    catch (err) { setActionError((e) => ({ ...e, [id]: err.message })); }
    setBusyId(null);
  }
  const chip = (on) => `px-3 py-1.5 rounded border text-sm ${on ? "border-amber text-amber" : "border-steel-line text-chrome-light hover:border-amber"}`;

  return (
    <div>
      <h1 className="text-3xl mb-4">Orders</h1>
      <div className="flex gap-2 mb-6">
        <Link to="/admin/orders" className={chip(!status)}>All</Link>
        {STATUSES.map((s) => <Link key={s} to={`/admin/orders?status=${s}`} className={chip(status === s)}>{s[0] + s.slice(1).toLowerCase()}</Link>)}
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data?.length === 0 && <p className="text-chrome">No orders.</p>}
      <div className="space-y-4">
        {data?.map((o) => (
          <div key={o.id} className="spec-plate">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <span className="font-display text-lg">Order #{o.id}</span>
                <span className={`ml-3 font-mono text-xs uppercase ${COLOR[o.status]}`}>{o.status}</span>
                <p className="text-xs text-chrome mt-0.5">{fmtDateTime(o.createdAt)}</p>
              </div>
              <div className="text-right">
                <Link to={`/admin/ledger/${o.customerId}`} className="hover:text-amber font-semibold">{o.customerName}</Link>
                <p><a className="text-xs font-mono text-chrome hover:text-amber" href={`https://wa.me/${o.customerPhone}`} target="_blank" rel="noreferrer">{o.customerPhone} ↗</a></p>
              </div>
            </div>
            <ul className="mt-3 text-sm space-y-1">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>{i.name}{i.label !== "Standard" ? ` · ${i.label}` : ""} × {i.qty}</span>
                  <span className="font-mono">{formatPKR(i.unitPrice * i.qty)}</span>
                </li>
              ))}
            </ul>
            {o.note && <p className="text-xs text-chrome-light mt-2 border-l-2 border-steel-line pl-2">{o.note}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-steel-line">
              <span className="font-mono text-amber font-semibold">{formatPKR(o.total)}</span>
              <div className="flex gap-3">
                {o.status === "PENDING" && <button disabled={busyId === o.id} onClick={() => act(o.id, "confirm")} className="btn btn-primary py-1.5 text-xs">Confirm (deduct stock + add to ledger)</button>}
                {o.status !== "CANCELLED" && <button disabled={busyId === o.id} onClick={() => act(o.id, "cancel")} className="btn btn-danger py-1.5 text-xs">Cancel</button>}
              </div>
            </div>
            {actionError[o.id] && <p className="text-danger text-xs mt-2">{actionError[o.id]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
