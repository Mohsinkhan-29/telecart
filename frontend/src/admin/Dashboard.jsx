import { Link } from "react-router-dom";
import { adminApi } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { ErrorBox, Loading } from "../components/Status";
import { formatPKR } from "../lib/format";

const Stat = ({ label, value, to }) => {
  const body = <div className="spec-plate"><p className="font-mono text-xs uppercase text-chrome">{label}</p><p className="font-display text-3xl mt-1 text-amber">{value}</p></div>;
  return to ? <Link to={to}>{body}</Link> : body;
};

export default function Dashboard() {
  const { data: d, error, loading, reload } = useFetch(() => adminApi.get("/dashboard"));
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <div className="space-y-8">
      <h1 className="text-3xl">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Pending orders" value={d.pendingOrders} to="/admin/orders?status=PENDING" />
        <Stat label="Confirmed this month" value={d.confirmedThisMonth} to="/admin/orders?status=CONFIRMED" />
        <Stat label="Sales this month" value={formatPKR(d.salesThisMonth)} />
        <Stat label="Customers owe you" value={formatPKR(d.receivable)} to="/admin/ledger" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="spec-plate">
          <h2 className="text-lg mb-3">Biggest balances</h2>
          {d.topBalances.length === 0 ? <p className="text-chrome text-sm">Nobody owes you anything.</p> : (
            <ul className="space-y-2 text-sm">
              {d.topBalances.map((c) => (
                <li key={c.id} className="flex justify-between">
                  <Link to={`/admin/ledger/${c.id}`} className="hover:text-amber">{c.name}</Link>
                  <span className="font-mono text-amber">{formatPKR(c.balance)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="spec-plate">
          <h2 className="text-lg mb-3">Low stock (3 or fewer)</h2>
          {d.lowStock.length === 0 ? <p className="text-chrome text-sm">Stock levels look fine.</p> : (
            <ul className="space-y-2 text-sm">
              {d.lowStock.map((v) => (
                <li key={v.id} className="flex justify-between">
                  <Link to={`/admin/catalog/${v.productId}`} className="hover:text-amber">{v.name}{v.label !== "Standard" ? ` · ${v.label}` : ""}</Link>
                  <span className={`font-mono ${v.stock === 0 ? "text-danger" : "text-amber"}`}>{v.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
