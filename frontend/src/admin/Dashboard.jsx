import { Link } from "react-router-dom";
import { adminApi } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { useSettings } from "../context/SettingsContext";
import { ErrorBox, Loading } from "../components/Status";

const LIME = "text-[#c5e813]", RED = "text-[#ff7a6b]";
const rs = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;
const short = (n) => (n >= 1e7 ? `Rs ${+(n / 1e7).toFixed(2)}Cr` : n >= 1e5 ? `Rs ${+(n / 1e5).toFixed(2)}L` : rs(n));
const sameDay = (a, b) => a.toDateString() === b.toDateString();

const Panel = ({ title, right, children }) => (
  <section className="bg-asphalt-2 border border-steel-line rounded-lg overflow-hidden">
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-steel-line">
      <h2 className="font-display text-lg uppercase">{title}</h2>{right}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

function Kpi({ label, value, sub, color = "text-offwhite", to }) {
  const body = (
    <div className={`h-full bg-asphalt-2 border border-steel-line rounded-lg p-5 ${to ? "hover:border-chrome transition-colors" : ""}`}>
      <p className="font-mono text-[11px] uppercase tracking-[.15em] text-chrome">{label}</p>
      <p className={`font-display text-3xl mt-3 ${color}`}>{value}</p>
      <div className="text-xs text-chrome mt-2">{sub}</div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

/** One bar per day of the month; hover a bar for that day's total. */
function DailyBars({ totals, today }) {
  const max = Math.max(1, ...totals);
  return (
    <div>
      <div className="flex items-end gap-[2px] h-44" role="img" aria-label="Sales per day this month">
        {totals.map((v, i) => (
          <div key={i} className="group relative flex-1 h-full flex items-end">
            <div className={`w-full rounded-t ${i + 1 === today ? "bg-[#c5e813]" : "bg-[#c5e813]/45"} group-hover:bg-[#c5e813]`}
              style={{ height: v ? `${Math.max(3, (v / max) * 100)}%` : "2px", opacity: v ? 1 : 0.25 }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap
              rounded bg-ink border border-steel-line px-2 py-1 text-xs font-mono text-offwhite z-10">
              {i + 1} · {rs(v)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between font-mono text-[11px] text-chrome mt-2 border-t border-steel-line pt-2">
        <span>1</span><span>{Math.ceil(totals.length / 2)}</span><span>{totals.length}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const s = useSettings();
  const { data, error, loading, reload } = useFetch(() =>
    Promise.all([adminApi.get("/dashboard"), adminApi.get("/ledger?period=month"), adminApi.get("/ledger?period=last")]));
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const [d, month, last] = data;
  const now = new Date();
  const st = month.stats;

  // Compare with the same days of last month, so the 9th is measured against last month's 1st to 9th.
  const lastSoFar = last.sales.filter((x) => new Date(x.date).getDate() <= now.getDate()).reduce((n, x) => n + x.total, 0);
  const change = lastSoFar ? Math.round(((st.sold - lastSoFar) / lastSoFar) * 100) : null;
  const todays = month.sales.filter((x) => sameDay(new Date(x.date), now));
  const daily = Array(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).fill(0);
  for (const x of month.sales) daily[new Date(x.date).getDate() - 1] += x.total;
  const topSellers = [...month.inventory].filter((v) => v.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 5);
  const maxSold = Math.max(1, ...topSellers.map((v) => v.sold));
  const overdue = month.khata.filter((k) => k.overdue);
  const todo = [
    d.pendingOrders > 0 && { text: `${d.pendingOrders} website order${d.pendingOrders > 1 ? "s" : ""} waiting for confirmation`, to: "/admin/orders?status=PENDING", tone: "text-amber" },
    overdue.length > 0 && { text: `${overdue.length} ${overdue.length > 1 ? "customers haven't" : "customer hasn't"} paid in 30+ days (${rs(overdue.reduce((n, k) => n + k.balance, 0))})`, to: "/admin/ledger", tone: RED },
    d.lowStock.length > 0 && { text: `${d.lowStock.length} item${d.lowStock.length > 1 ? "s" : ""} running low on stock`, to: "/admin/catalog", tone: RED },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl uppercase">Dashboard</h1>
          <p className="text-sm text-chrome mt-1">
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · how {s.store.name} is doing this month.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/" target="_blank" className="btn btn-outline">View store ↗</Link>
          <Link to="/admin/ledger" className="btn bg-[#c5e813] text-ink hover:brightness-95">Open ledger</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Today" value={short(todays.reduce((n, x) => n + x.total, 0))} sub={`${todays.length} bill${todays.length === 1 ? "" : "s"} so far`} />
        <Kpi label="Sales this month" value={short(st.sold)} to="/admin/ledger"
          sub={change === null ? `${st.bills} bills · ${st.units} units`
            : <span className={change >= 0 ? LIME : RED}>{change >= 0 ? "▲" : "▼"} {Math.abs(change)}% vs last month</span>} />
        <Kpi label="Collected" value={short(st.collected)} color={LIME} sub="Cash in this month" />
        <Kpi label="Customers owe you" value={rs(st.owed)} color="text-amber" to="/admin/ledger"
          sub={<>{st.owingCount} customers{overdue.length > 0 && <span className={RED}> · {overdue.length} overdue</span>}</>} />
        <Kpi label="Pending orders" value={d.pendingOrders} color={d.pendingOrders ? "text-amber" : "text-offwhite"} to="/admin/orders?status=PENDING"
          sub={d.pendingOrders ? "Confirm on WhatsApp" : "All caught up"} />
        <Kpi label="Average bill" value={st.bills ? short(st.sold / st.bills) : "–"} sub={`${st.stockUnits} units in stock`} />
      </div>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-6 items-start">
        <Panel title="Sales this month" right={<span className="font-mono text-sm text-chrome">Best day {short(Math.max(...daily))}</span>}>
          {st.bills ? <DailyBars totals={daily} today={now.getDate()} />
            : <p className="text-chrome text-sm py-12 text-center">No sales yet this month. Record one from the ledger.</p>}
        </Panel>

        <Panel title="Needs attention">
          {todo.length === 0 ? <p className="text-chrome text-sm">Nothing urgent. Orders, payments and stock all look fine.</p> : (
            <ul className="space-y-3">
              {todo.map((t) => (
                <li key={t.text}>
                  <Link to={t.to} className="flex gap-3 items-start rounded border border-steel-line p-3 hover:border-chrome">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full bg-current ${t.tone}`} aria-hidden="true" />
                    <span className="text-sm text-chrome-light">{t.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <Panel title="Top sellers this month">
          {topSellers.length === 0 ? <p className="text-chrome text-sm">Nothing sold yet this month.</p> : (
            <ul className="space-y-4">
              {topSellers.map((v) => (
                <li key={v.id}>
                  <div className="flex justify-between gap-3 text-sm">
                    <Link to={`/admin/catalog/${v.productId}`} className="text-offwhite hover:text-amber truncate">
                      {v.name}{v.label !== "Standard" && <span className="text-chrome"> · {v.label}</span>}
                    </Link>
                    <span className="font-mono text-chrome-light shrink-0">{v.sold} sold</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-steel mt-2">
                    <div className="h-full rounded-full bg-[#c5e813]" style={{ width: `${(v.sold / maxSold) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Biggest balances" right={<Link to="/admin/ledger" className={`text-sm underline ${LIME}`}>Khata →</Link>}>
          {month.khata.length === 0 ? <p className="text-chrome text-sm">Nobody owes you anything.</p> : (
            <ul className="divide-y divide-steel-line/60 -my-2">
              {month.khata.slice(0, 5).map((k) => (
                <li key={k.id} className="flex justify-between items-center gap-3 py-2.5 text-sm">
                  <Link to={`/admin/ledger/${k.id}`} className="hover:text-amber">
                    <b className="text-offwhite">{k.name}</b>
                    {k.overdue && <span className={`ml-2 text-xs ${RED}`}>overdue</span>}
                  </Link>
                  <span className="font-mono text-amber">{rs(k.balance)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Low stock" right={<Link to="/admin/catalog" className={`text-sm underline ${LIME}`}>Restock →</Link>}>
          {d.lowStock.length === 0 ? <p className="text-chrome text-sm">Stock levels look fine.</p> : (
            <ul className="divide-y divide-steel-line/60 -my-2">
              {d.lowStock.map((v) => (
                <li key={v.id} className="flex justify-between items-center gap-3 py-2.5 text-sm">
                  <Link to={`/admin/catalog/${v.productId}`} className="text-offwhite hover:text-amber truncate">
                    {v.name}{v.label !== "Standard" && <span className="text-chrome"> · {v.label}</span>}
                  </Link>
                  <span className={`font-mono shrink-0 ${RED}`}>{v.stock === 0 ? "Sold out" : `${v.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Latest sales" right={<Link to="/admin/ledger" className={`text-sm underline ${LIME}`}>All sales →</Link>}>
        {month.sales.length === 0 ? <p className="text-chrome text-sm">No sales yet this month.</p> : (
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-sm">
              <tbody>
                {month.sales.slice(0, 6).map((x) => {
                  const left = x.total - x.paid;
                  return (
                    <tr key={x.id} className="border-b border-steel-line/60 last:border-0">
                      <td className="px-5 py-3 font-mono text-chrome-light whitespace-nowrap">TC-{x.id}</td>
                      <td className="px-3 py-3 text-offwhite font-semibold whitespace-nowrap">{x.name}</td>
                      <td className="px-3 py-3 text-chrome-light">{x.items}</td>
                      <td className="px-3 py-3 font-mono text-right text-offwhite whitespace-nowrap">{rs(x.total)}</td>
                      <td className={`px-5 py-3 text-right text-xs whitespace-nowrap ${left ? (x.paid ? "text-amber" : RED) : LIME}`}>
                        {left ? `${rs(left)} due` : "Paid"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}