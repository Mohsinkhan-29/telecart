import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { useSettings } from "../context/SettingsContext";
import { ErrorBox, Loading } from "../components/Status";

const LIME = "text-[#c5e813]", RED = "text-[#ff7a6b]";
const rs = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;
const short = (n) => (n >= 1e7 ? `Rs ${+(n / 1e7).toFixed(2)}Cr` : n >= 1e5 ? `Rs ${+(n / 1e5).toFixed(2)}L` : rs(n));
const phoneText = (p) => (/^92\d{10}$/.test(p) ? `0${p.slice(2, 5)} ${p.slice(5)}` : p === "walk-in" ? "" : p);
const day = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
const ago = (d) => {
  const n = Math.floor((Date.now() - new Date(d)) / 86_400_000);
  return n <= 0 ? "Today" : n === 1 ? "Yesterday" : `${n} days ago`;
};
const statusOf = (s) => (s.paid >= s.total ? "Paid" : s.paid > 0 ? "Partial" : "Unpaid");
const PILL = { Paid: "bg-[#c5e813]/10 text-[#c5e813]", Partial: "bg-amber/10 text-amber", Unpaid: "bg-[#ff7a6b]/10 text-[#ff7a6b]" };

const Panel = ({ title, right, children, className = "" }) => (
  <section className={`bg-asphalt-2 border border-steel-line rounded-lg overflow-hidden ${className}`}>
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-steel-line">
      <h2 className="font-display text-xl uppercase">{title}</h2>{right}
    </div>
    {children}
  </section>
);
const Th = ({ children, right }) => <th className={`th py-3 tracking-[.12em] ${right ? "text-right" : ""}`}>{children}</th>;
const Td = ({ children, className = "" }) => <td className={`px-3 py-3.5 border-t border-steel-line/60 ${className}`}>{children}</td>;
const Who = ({ name, phone }) => (
  <><b className="block text-sm text-offwhite">{name}</b><span className="font-mono text-xs text-chrome whitespace-nowrap">{phoneText(phone) || "–"}</span></>
);

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-2xl mt-12 bg-asphalt-2 border border-steel-line rounded-lg">
        <div className="flex justify-between items-center px-5 py-4 border-b border-steel-line">
          <h2 className="font-display text-xl uppercase">{title}</h2>
          <button onClick={onClose} className="text-chrome hover:text-offwhite text-xl leading-none" aria-label="Close">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function RecordSale({ onClose, onDone }) {
  const products = useFetch(() => adminApi.get("/products"));
  const [rows, setRows] = useState([{ variantId: "", qty: 1, price: "" }]);
  const [paid, setPaid] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const variants = (products.data ?? []).flatMap((p) => p.variants.map((v) => ({ ...v, name: p.name })));
  const total = rows.reduce((n, r) => n + (Number(r.qty) || 0) * (Number(r.price) || 0), 0);
  const setRow = (i, patch) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr(null);
    const f = Object.fromEntries(new FormData(e.target));
    try {
      await adminApi.post("/sales", { name: f.name, phone: f.phone, note: f.note, paid: paid === "" ? total : Number(paid), items: rows });
      onDone();
    } catch (x) { setErr(x.message); setBusy(false); }
  }

  return (
    <Modal title="Record sale" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label" htmlFor="s-name">Customer name</label><input id="s-name" name="name" className="input" placeholder="Walk-in" /></div>
          <div><label className="label" htmlFor="s-phone">Phone</label><input id="s-phone" name="phone" type="tel" className="input" placeholder="Needed for khata" /></div>
        </div>
        {products.loading && <Loading />}
        {products.error && <ErrorBox message={products.error} onRetry={products.reload} />}
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_110px_auto] gap-2 items-end">
              <div><label className="label text-xs">Item</label>
                <select required className="input py-2" value={r.variantId}
                  onChange={(e) => { const v = variants.find((x) => x.id === Number(e.target.value)); setRow(i, { variantId: e.target.value, price: v?.price ?? "" }); }}>
                  <option value="">Select product…</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                      {v.name}{v.label !== "Standard" ? ` · ${v.label}` : ""} ({v.stock} left)
                    </option>
                  ))}
                </select></div>
              <div><label className="label text-xs">Qty</label><input required type="number" min={1} className="input py-2" value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} /></div>
              <div><label className="label text-xs">Price each</label><input required type="number" min={0} className="input py-2" value={r.price} onChange={(e) => setRow(i, { price: e.target.value })} /></div>
              <button type="button" disabled={rows.length === 1} onClick={() => setRows(rows.filter((_, j) => j !== i))}
                className="pb-2.5 text-chrome hover:text-[#ff7a6b] disabled:opacity-30" aria-label="Remove item">✕</button>
            </div>
          ))}
          <button type="button" className={`text-sm ${LIME}`} onClick={() => setRows([...rows, { variantId: "", qty: 1, price: "" }])}>+ Add item</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label" htmlFor="s-paid">Paid now</label>
            <input id="s-paid" type="number" min={0} max={total} className="input" value={paid} placeholder={`${total} (full)`} onChange={(e) => setPaid(e.target.value)} />
            <p className="text-xs text-chrome mt-1">Leave empty if paid in full. Anything less goes on the khata.</p></div>
          <div><label className="label" htmlFor="s-note">Note</label><input id="s-note" name="note" className="input" placeholder="e.g. cash, Easypaisa" /></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-steel-line">
          <p className="font-mono">Total <b className="text-offwhite text-lg">{rs(total)}</b>
            {paid !== "" && Number(paid) < total && <span className="text-amber text-sm"> · {rs(total - Number(paid))} on khata</span>}</p>
          <button className="btn bg-[#c5e813] text-ink hover:brightness-95" disabled={busy || !total}>{busy ? "Saving…" : "Save sale"}</button>
        </div>
        {err && <p className={`${RED} text-sm`}>{err}</p>}
      </form>
    </Modal>
  );
}

function ReceivePayment({ khata, initial, onClose, onDone }) {
  const [id, setId] = useState(initial ?? khata[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const who = khata.find((k) => k.id === Number(id));

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr(null);
    const f = Object.fromEntries(new FormData(e.target));
    try { await adminApi.post(`/customers/${id}/entries`, { type: "CREDIT", amount: f.amount, note: f.note }); onDone(); }
    catch (x) { setErr(x.message); setBusy(false); }
  }

  return (
    <Modal title="Receive payment" onClose={onClose}>
      {khata.length === 0 ? <p className="text-chrome">Nobody owes you anything right now.</p> : (
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label" htmlFor="p-who">Customer</label>
            <select id="p-who" className="input" value={id} onChange={(e) => setId(e.target.value)}>
              {khata.map((k) => <option key={k.id} value={k.id}>{k.name} · owes {rs(k.balance)}</option>)}
            </select></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label" htmlFor="p-amt">Amount received</label>
              <input id="p-amt" name="amount" type="number" min={1} required className="input" key={id} defaultValue={who?.balance} /></div>
            <div><label className="label" htmlFor="p-note">Note</label><input id="p-note" name="note" className="input" placeholder="e.g. cash, JazzCash" /></div>
          </div>
          {err && <p className={`${RED} text-sm`}>{err}</p>}
          <button className="btn bg-[#c5e813] text-ink hover:brightness-95" disabled={busy}>{busy ? "Saving…" : "Save payment"}</button>
        </form>
      )}
    </Modal>
  );
}

export default function Ledger() {
  const s = useSettings();
  const navigate = useNavigate();
  const [period, setPeriod] = useState("month");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [modal, setModal] = useState(null); // "sale" | { pay: customerId? }
  const [newErr, setNewErr] = useState(null);
  const { data, error, loading, reload } = useFetch(() => adminApi.get(`/ledger?period=${period}`), [period]);

  const done = () => { setModal(null); reload(); };
  const match = (...xs) => !q || xs.join(" ").toLowerCase().includes(q.toLowerCase());
  const periodName = { month: "this month", last: "last month", all: "all time" }[period];

  async function addCustomer(e) {
    e.preventDefault(); setNewErr(null);
    try { const { id } = await adminApi.post("/customers", Object.fromEntries(new FormData(e.target))); navigate(`/admin/ledger/${id}`); }
    catch (err) { setNewErr(err.message); }
  }

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { stats: st } = data;
  const sales = data.sales.filter((x) => (status === "All" || statusOf(x) === status) && match(x.name, x.phone, x.items, `TC-${x.id}`));
  const khata = data.khata.filter((k) => match(k.name, k.phone));
  const stock = data.inventory.filter((v) => match(v.name, v.label, v.category));
  const maxStock = Math.max(1, ...data.inventory.map((v) => v.stock));

  const cards = [
    [`Sold ${periodName}`, short(st.sold), "text-offwhite", `${st.bills} bills · ${st.units} units`],
    ["Collected", short(st.collected), LIME, st.sold ? `${Math.round((st.collected / st.sold) * 100)}% of sales` : "No sales yet"],
    ["Customers owe you", rs(st.owed), "text-amber", `${st.owingCount} customers · ${st.overdue} overdue`],
    ["Stock left", `${st.stockUnits} units`, "text-offwhite", `Worth ${short(st.stockValue)} at sale price`],
    ["Low stock", `${st.lowStock} items`, st.lowStock ? RED : "text-offwhite", "At or below 3 units"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl uppercase">Ledger</h1>
          <p className="text-sm text-chrome mt-1">What you sold, who owes you, and what's left on the shelf.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="l-q">Search</label>
          <input id="l-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer, phone or product" className="input py-2 w-64" />
          <select aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} className="input py-2 w-auto">
            <option value="month">This month</option><option value="last">Last month</option><option value="all">All time</option>
          </select>
          <button className="btn btn-outline" onClick={() => setModal({ pay: null })}>+ Receive payment</button>
          <button className="btn bg-[#c5e813] text-ink hover:brightness-95" onClick={() => setModal("sale")}>+ Record sale</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {cards.map(([label, value, color, sub]) => (
          <div key={label} className="bg-asphalt-2 border border-steel-line rounded-lg p-5">
            <p className="font-mono text-[11px] uppercase tracking-[.15em] text-chrome">{label}</p>
            <p className={`font-display text-3xl mt-3 ${color}`}>{value}</p>
            <p className="text-xs text-chrome mt-2">{sub}</p>
          </div>
        ))}
      </div>

      <Panel title="Sales · what you sold & to whom" right={
        <div className="flex gap-2 text-sm">
          {["All", "Paid", "Partial", "Unpaid"].map((k) => (
            <button key={k} onClick={() => setStatus(k)}
              className={`px-3.5 py-1.5 rounded border ${status === k ? "border-amber text-amber" : "border-steel-line text-chrome-light hover:border-chrome"}`}>{k}</button>
          ))}
        </div>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><Th>Date</Th><Th>Bill #</Th><Th>Customer</Th><Th>Items</Th><Th right>Total</Th><Th right>Paid</Th><Th right>Remaining</Th><Th>Status</Th></tr></thead>
            <tbody>
              {sales.map((x) => {
                const left = x.total - x.paid, st = statusOf(x);
                return (
                  <tr key={x.id} className="hover:bg-steel/40">
                    <Td className="text-chrome-light whitespace-nowrap">{day(x.date)}</Td>
                    <Td className="font-mono text-chrome-light">TC-{x.id}</Td>
                    <Td>{x.phone === "walk-in" ? <Who name={x.name} phone={x.phone} />
                      : <Link to={`/admin/ledger/${x.customerId}`} className="hover:[&_b]:text-amber"><Who name={x.name} phone={x.phone} /></Link>}</Td>
                    <Td className="text-offwhite min-w-[180px]">{x.items}</Td>
                    <Td className="font-mono text-right font-semibold text-offwhite whitespace-nowrap">{rs(x.total)}</Td>
                    <Td className="font-mono text-right text-chrome-light whitespace-nowrap">{rs(x.paid)}</Td>
                    <Td className={`font-mono text-right whitespace-nowrap ${left ? (x.paid ? "text-amber" : RED) : "text-chrome"}`}>{left ? rs(left) : "–"}</Td>
                    <Td><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PILL[st]}`}>{st}</span></Td>
                  </tr>
                );
              })}
              {sales.length === 0 && <tr><Td className="text-chrome" colSpan={8}>No sales {q || status !== "All" ? "match" : periodName}. Use Record sale for counter sales; confirmed website orders show up here too.</Td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid 2xl:grid-cols-2 gap-6 items-start">
        <Panel title="Khata · who owes you" right={<span className="font-mono text-amber">{rs(st.owed)}</span>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><Th>Customer</Th><Th right>Bought</Th><Th right>Paid</Th><Th right>Balance</Th><Th>Last paid</Th><Th /></tr></thead>
              <tbody>
                {khata.map((k) => (
                  <tr key={k.id} className="hover:bg-steel/40">
                    <Td><Link to={`/admin/ledger/${k.id}`} className="hover:[&_b]:text-amber"><Who name={k.name} phone={k.phone} /></Link></Td>
                    <Td className="font-mono text-right text-offwhite whitespace-nowrap">{rs(k.bought)}</Td>
                    <Td className="font-mono text-right text-chrome-light whitespace-nowrap">{rs(k.paid)}</Td>
                    <Td className="font-mono text-right text-amber font-semibold whitespace-nowrap">{rs(k.balance)}</Td>
                    <Td className={`whitespace-nowrap ${k.overdue || !k.lastPaid ? RED : "text-chrome-light"}`}>{k.lastPaid ? ago(k.lastPaid) : `Never · ${ago(k.since).toLowerCase()}`}</Td>
                    <Td className="text-right whitespace-nowrap space-x-1.5">
                      <button onClick={() => setModal({ pay: k.id })} className="px-2.5 py-1 rounded border border-steel-line text-xs text-chrome-light hover:border-chrome">Receive</button>
                      <a target="_blank" rel="noreferrer" className={`px-2.5 py-1 rounded border border-[#c5e813]/40 text-xs ${LIME} hover:bg-[#c5e813]/10`}
                        href={`https://wa.me/${k.phone}?text=${encodeURIComponent(`Assalam o Alaikum ${k.name}, a friendly reminder from ${s.store.name} that ${rs(k.balance)} is pending on your account. Thank you!`)}`}>Remind</a>
                    </Td>
                  </tr>
                ))}
                {khata.length === 0 && <tr><Td className="text-chrome" colSpan={6}>{q ? "No one matches." : "Nobody owes you anything."}</Td></tr>}
              </tbody>
            </table>
          </div>
          <details className="px-5 py-4 border-t border-steel-line">
            <summary className="cursor-pointer font-display uppercase tracking-wide">+ Add walk-in customer</summary>
            <form onSubmit={addCustomer} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end mt-4">
              <div><label className="label" htmlFor="w-name">Name</label><input id="w-name" name="name" required className="input py-2" /></div>
              <div><label className="label" htmlFor="w-phone">Phone</label><input id="w-phone" name="phone" type="tel" required className="input py-2" /></div>
              <button className="btn btn-outline">Add</button>
              {newErr && <p className={`${RED} text-xs sm:col-span-3`}>{newErr}</p>}
            </form>
          </details>
        </Panel>

        <Panel title="Inventory · what's left" right={<Link to="/admin/catalog" className={`text-sm underline ${LIME}`}>Restock →</Link>}>
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-asphalt-2"><tr><Th>Product</Th><Th>Stock</Th><Th right>Sold ({period === "all" ? "all" : "mo"})</Th><Th right>Stock value</Th></tr></thead>
              <tbody>
                {stock.map((v) => {
                  const low = v.stock <= 3;
                  return (
                    <tr key={v.id} className="hover:bg-steel/40">
                      <Td><Link to={`/admin/catalog/${v.productId}`} className="hover:[&_b]:text-amber">
                        <b className="block text-offwhite">{v.name}{v.label !== "Standard" && <span className="font-normal text-chrome-light"> · {v.label}</span>}</b>
                        <span className="text-xs text-chrome">{v.category}</span></Link></Td>
                      <Td className="min-w-[150px]">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 flex-1 rounded-full bg-steel">
                            <div className={`h-full rounded-full ${low ? "bg-[#ff7a6b]" : "bg-[#c5e813]"}`} style={{ width: `${Math.max(4, (v.stock / maxStock) * 100)}%` }} />
                          </div>
                          <span className={`font-mono w-7 text-right ${low ? RED : LIME}`}>{v.stock}</span>
                        </div>
                      </Td>
                      <Td className="font-mono text-right text-chrome-light">{v.sold}</Td>
                      <Td className="font-mono text-right font-semibold text-offwhite whitespace-nowrap">{rs(v.value)}</Td>
                    </tr>
                  );
                })}
                {stock.length === 0 && <tr><Td className="text-chrome" colSpan={4}>No products match.</Td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {modal === "sale" && <RecordSale onClose={() => setModal(null)} onDone={done} />}
      {modal?.pay !== undefined && <ReceivePayment khata={data.khata} initial={modal.pay} onClose={() => setModal(null)} onDone={done} />}
    </div>
  );
}